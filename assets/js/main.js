/* Where "Book a demo" and "Get a quote" go: the booking page, opened as it is,
   in a new tab, with nothing added to the address. The links in the HTML carry
   the same address, so they work before this script runs; change both. */
const DEMO_URL = 'https://calendar.app.google/N49RsbFjwGHiVa6d6';

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isLocal = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname) || location.hostname.endsWith('.local');

  if (isLocal) document.documentElement.classList.add('show-confirm');

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
    // The tour's big screen stacks its videos, hidden ones included.
    const stage = $('[data-tour-screen]');
    if (stage) {
      const sio = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { $$('video', stage).forEach(setPoster); sio.disconnect(); }
      }, { rootMargin: '600px 0px' });
      sio.observe(stage);
    }
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
  // The hero's living background waits until the page itself has loaded, so it
  // never competes with the headline for the first paint.
  const afterLoad = (fn) => {
    const run = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
    if (document.readyState === 'complete') run(); else window.addEventListener('load', run, { once: true });
  };
  afterLoad(startLazy);

  /* Pause and play the hero background. */
  const hero = $('.hero');
  const motionBtn = $('[data-motion-toggle]');
  const setMotion = (on) => {
    motionOn = on;
    hero?.classList.toggle('is-paused', !on);
    motionBtn?.setAttribute('aria-pressed', String(!on));
    const label = $('[data-motion-label]');
    if (label) label.textContent = on ? 'Pause background' : 'Play background';
    $$('video[data-lazy-video], video[data-tour-video]').forEach((v) => {
      if (!on) v.pause();
      else if (visible.has(v) || (v.dataset.tourVideo && v.classList.contains('is-active') && tourInView)) tryPlay(v);
    });
  };
  motionBtn?.addEventListener('click', () => setMotion(!motionOn));
  if (!motionOn) setMotion(false);
  reducedMotion.addEventListener?.('change', (e) => setMotion(!e.matches));

  /* ---------- Product tour: the screen follows the step ---------- */
  const tour = $('[data-tour]');
  const wide = window.matchMedia('(min-width: 1024px)');
  let tourInView = false;
  if (tour && 'IntersectionObserver' in window) {
    const steps = $$('.tour-step', tour);
    const videos = $$('[data-tour-video]', tour);
    const url = $('[data-tour-url]', tour);
    const phone = $('[data-tour-phone]', tour);
    let current = 'chat';
    const activate = (name) => {
      current = name;
      steps.forEach((s) => s.classList.toggle('is-active', s.dataset.step === name));
      const step = steps.find((s) => s.dataset.step === name);
      if (url && step) url.textContent = step.dataset.url;
      phone?.classList.toggle('is-on', !!step?.hasAttribute('data-phone'));
      videos.forEach((v) => {
        const on = v.dataset.tourVideo === name;
        v.classList.toggle('is-active', on);
        if (on && wide.matches && tourInView) { v.currentTime = 0; tryPlay(v); } else v.pause();
      });
    };
    // A step is current while it crosses the middle of the screen.
    const stepIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting && wide.matches) activate(e.target.dataset.step); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    steps.forEach((s) => stepIO.observe(s));
    // The big screen only plays while the tour is on screen.
    new IntersectionObserver(([e]) => {
      tourInView = e.isIntersecting;
      const v = videos.find((x) => x.dataset.tourVideo === current);
      if (!v || !wide.matches) return;
      if (tourInView) tryPlay(v); else v.pause();
    }, { rootMargin: '100px 0px' }).observe(tour);
  }

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Dialogs ---------- */
  const openDialog = (dlg) => {
    if (!dlg) return;
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
  };
  $$('dialog').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) { dlg.close(); return; }
      if (e.target === dlg) {
        const r = dlg.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) dlg.close();
      }
    });
  });

  /* Book a demo and Get a quote both open the booking page. */
  $$('[data-demo]').forEach((a) => {
    a.href = DEMO_URL;
    a.target = '_blank';
    a.rel = 'noopener';
    a.addEventListener('click', closeNav);
  });

  /* The launch film */
  const filmDlg = $('[data-film-dialog]');
  const film = $('[data-film]');
  $$('[data-film-open]').forEach((b) => b.addEventListener('click', () => {
    if (!film.dataset.loaded) {
      film.dataset.loaded = '1';
      [['mp4', 'video/mp4'], ['webm', 'video/webm']].forEach(([ext, type]) => {
        const s = document.createElement('source');
        s.src = `assets/video/film.${ext}`;
        s.type = type;
        film.insertBefore(s, film.firstChild);
      });
      film.load();
    }
    openDialog(filmDlg);
    const p = film.play();
    if (p && p.catch) p.catch(() => {});
  }));
  filmDlg?.addEventListener('close', () => film.pause());

  /* ---------- Copy buttons ---------- */
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const label = $('span', b);
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      label.textContent = 'Copied';
    } catch (e) {
      label.textContent = 'Select and copy';
    }
    setTimeout(() => { label.textContent = 'Copy'; }, 1800);
  }));

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

  /* ---------- Customers page: the chip for the section in view ---------- */
  const typeLinks = $$('.type-nav a');
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
