/* Where "Book a demo" and "Get a quote" go: the booking page, opened as it is,
   in a new tab, with nothing added to the address. The links in the HTML carry
   the same address, so they work before this script runs; change both. */
const DEMO_URL = 'https://calendar.app.google/N49RsbFjwGHiVa6d6';

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Theme ---------- */
  const themeBtn = $('[data-theme-toggle]');
  const syncThemeLabel = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (themeBtn) themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    $$('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#020817' : '#ffffff'));
  };
  syncThemeLabel();
  themeBtn?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('teamup-theme', next); } catch (e) { /* private mode: still switches */ }
    syncThemeLabel();
  });
  window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', (e) => {
    let stored = null;
    try { stored = localStorage.getItem('teamup-theme'); } catch (err) { /* ignore */ }
    if (stored) return;
    document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark');
    syncThemeLabel();
  });

  // Smooth in-page scrolling starts once the page has opened (see site.css).
  const markLoaded = () => setTimeout(() => document.documentElement.classList.add('is-loaded'), 100);
  if (document.readyState === 'complete') markLoaded(); else window.addEventListener('load', markLoaded, { once: true });

  /* ---------- Header and menu ---------- */
  const header = $('[data-header]');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const navToggle = $('[data-nav-toggle]');
  const navList = $('[data-nav-list]');
  const closeNav = () => { navList?.classList.remove('is-open'); navToggle?.setAttribute('aria-expanded', 'false'); };
  navToggle?.addEventListener('click', () => {
    const open = !navList.classList.contains('is-open');
    navList.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navList?.addEventListener('click', (e) => { if (e.target.closest('a')) closeNav(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && navList?.classList.contains('is-open')) { closeNav(); navToggle.focus(); } });
  document.addEventListener('click', (e) => { if (navList?.classList.contains('is-open') && !e.target.closest('.nav')) closeNav(); });

  /* ---------- Posters: set only when near the screen, in AVIF where the browser has it ---------- */
  // A poster attribute downloads at once even with preload="none", so each
  // picture waits in data-poster until its video comes close.
  const AVIF_PROBE = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  const posterExt = new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(probe.width > 0 ? 'avif' : 'webp');
    probe.onerror = () => resolve('webp');
    probe.src = AVIF_PROBE;
  });
  const setPoster = (v) => posterExt.then((ext) => {
    if (v.dataset.poster && !v.getAttribute('poster')) v.poster = `assets/img/posters/${v.dataset.poster}.${ext}`;
  });
  if ('IntersectionObserver' in window) {
    const pio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setPoster(e.target); pio.unobserve(e.target); } });
    }, { rootMargin: '600px 0px' });
    $$('video[data-poster]').forEach((v) => pio.observe(v));
  } else $$('video[data-poster]').forEach(setPoster);

  /* ---------- Videos: loaded only when near the screen ---------- */
  const conn = navigator.connection || {};
  const saveData = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  let motionOn = !reducedMotion.matches && !saveData;

  const attachSources = (video) => {
    if (video.dataset.loaded) return;
    const name = video.dataset.name;
    video.dataset.loaded = '1';
    [['mp4', 'video/mp4'], ['webm', 'video/webm']].forEach(([ext, type]) => {
      const s = document.createElement('source');
      s.src = `assets/video/${name}.${ext}`;
      s.type = type;
      video.appendChild(s);
    });
    video.load();
  };
  const tryPlay = (video) => {
    if (!motionOn) return;
    attachSources(video);
    const p = video.play();
    if (p && p.catch) p.catch(() => { /* autoplay refused: the poster stays */ });
  };
  const visible = new Set();
  const lazyIO = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) { visible.add(target); tryPlay(target); } else { visible.delete(target); target.pause(); }
    });
  }, { rootMargin: '150px 0px' }) : null;

  const startLazy = () => $$('[data-lazy-video]').forEach((v) => lazyIO?.observe(v));
  // Recordings start once the page itself has loaded.
  const afterLoad = (fn) => {
    const run = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
    if (document.readyState === 'complete') run(); else window.addEventListener('load', run, { once: true });
  };
  afterLoad(startLazy);

  /* ---------- The product window: tabs, one screen, one caption ---------- */
  const showcase = $('[data-showcase]');
  const tabs = showcase ? $$('[role="tab"]', showcase) : [];
  const shotVideo = () => showcase && $('.shot.is-active video', showcase);
  let showcaseInView = false;
  let showcaseReady = false;
  const playShot = () => {
    const v = shotVideo();
    if (v && showcaseReady && showcaseInView) tryPlay(v);
  };
  if (showcase) {
    const url = $('[data-showcase-url]', showcase);
    const select = (tab, focus) => {
      const name = tab.dataset.tab;
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      $$('[data-shot]', showcase).forEach((s) => {
        const on = s.dataset.shot === name;
        s.classList.toggle('is-active', on);
        s.classList.toggle('is-in', on);
        const v = $('video', s);
        v.pause();
        if (on && v.dataset.loaded) v.currentTime = 0;
      });
      $$('[data-panel]', showcase).forEach((p) => {
        p.hidden = p.dataset.panel !== name;
        if (!p.hidden) url.textContent = p.dataset.url;
      });
      if (focus) tab.focus();
      playShot();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        select(tabs[(to + tabs.length) % tabs.length], true);
      });
    });
    // The still picture stays until the recording really plays.
    $$('[data-showcase-video]', showcase).forEach((v) => v.addEventListener('playing', () => v.classList.add('is-playing')));
    // The other screens' pictures come with the first sign of interest, so a tab
    // never opens onto nothing and the first paint never waits for them.
    const fetchShots = () => $$('.shot img', showcase).forEach((img) => { img.loading = 'eager'; });
    showcase.addEventListener('pointerenter', fetchShots, { once: true });
    showcase.addEventListener('focusin', fetchShots, { once: true });
    window.addEventListener('scroll', fetchShots, { once: true, passive: true });
    // Recordings wait until the page has loaded, so they never hold up the first paint.
    afterLoad(() => { showcaseReady = true; playShot(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        showcaseInView = e.isIntersecting;
        if (showcaseInView) playShot(); else shotVideo()?.pause();
      }).observe($('.window', showcase));
    }
  }

  /* Pause and play every recording on the page. */
  const motionBtn = $('[data-motion-toggle]');
  const setMotion = (on) => {
    motionOn = on;
    motionBtn?.setAttribute('aria-pressed', String(!on));
    const label = $('[data-motion-label]');
    if (label) label.textContent = on ? 'Pause videos' : 'Play videos';
    $$('[data-lazy-video], [data-showcase-video]').forEach((v) => {
      if (!on) v.pause();
      else if (visible.has(v)) tryPlay(v);
    });
    if (on) playShot();
  };
  motionBtn?.addEventListener('click', () => setMotion(!motionOn));
  if (!motionOn) setMotion(false);
  reducedMotion.addEventListener?.('change', (e) => setMotion(!e.matches));

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('is-in'));
  }

  /* Book a demo and Get a quote both open the booking page. */
  $$('[data-demo]').forEach((a) => {
    a.href = DEMO_URL;
    a.target = '_blank';
    a.rel = 'noopener';
    a.addEventListener('click', closeNav);
  });

  /* ---------- Sticky call to action on phones ---------- */
  const bar = $('[data-mobile-cta]');
  const firstCta = $('.hero, .page-hero');
  const lastCta = $('.final-cta');
  if (bar && firstCta && 'IntersectionObserver' in window) {
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting));
      const show = !seen.get(firstCta) && !(lastCta && seen.get(lastCta));
      bar.classList.toggle('is-on', show);
    });
    io.observe(firstCta);
    if (lastCta) io.observe(lastCta);
  }

  /* ---------- Customers page: the link for the section in view ---------- */
  const typeLinks = $$('.type-index a');
  if (typeLinks.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        typeLinks.forEach((a) => {
          const on = a.getAttribute('href') === `#${e.target.id}`;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('.type').forEach((s) => io.observe(s));
  }
})();
