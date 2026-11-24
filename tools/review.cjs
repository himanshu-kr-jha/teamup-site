// Screenshots every section of every page at phone, tablet and desktop widths,
// in light and dark, checks for sideways scrolling and console errors, and
// drives each demo once. Output goes to review/.
//
// Usage: python3 -m http.server 4173 &   then   node tools/review.cjs [base-url]
// Needs the playwright package; set PW to its path if it is not installed here.
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright');

const BASE = process.argv[2] || 'http://localhost:4173/';
const OUT = path.resolve(__dirname, '../review');
const PAGES = ['index.html', 'customers.html', '404.html'];
const SHOT_WIDTHS = [375, 768, 1440];
const CHECK_WIDTHS = [360, 375, 390, 768, 1024, 1280, 1440, 1920];
const THEMES = ['dark', 'light'];

const problems = [];
const note = (msg) => { problems.push(msg); console.log('  ! ' + msg); };

async function newPage(browser, width, theme) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 768 ? 800 : 900 },
    deviceScaleFactor: 1,
    bypassCSP: true,
    colorScheme: theme,
  });
  await ctx.addInitScript((t) => { try { localStorage.setItem('teamup-theme', t); } catch (e) {} }, theme);
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') note(`console error ${page.url()} @${width} ${theme}: ${m.text()}`); });
  page.on('pageerror', (e) => note(`page error ${page.url()} @${width} ${theme}: ${e.message}`));
  return { ctx, page };
}

async function overflow(page) {
  return page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const out = [];
    if (document.documentElement.scrollWidth > w + 1) out.push(`scrollWidth ${document.documentElement.scrollWidth} > ${w}`);
    // Anything visible reaching past the right edge, outside a box that clips or scrolls it.
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || r.right <= w + 1) return;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) return;
      }
      if (getComputedStyle(el).position === 'fixed' && r.left >= w) return;
      out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} right=${Math.round(r.right)}`);
    });
    return out.slice(0, 8);
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const p of PAGES) {
    for (const theme of THEMES) {
      for (const width of CHECK_WIDTHS) {
        const { ctx, page } = await newPage(browser, width, theme);
        await page.goto(BASE + p, { waitUntil: 'load' });
        await page.addStyleTag({ content: '.js .reveal{opacity:1!important;transform:none!important}' });
        await page.waitForTimeout(400);
        const o = await overflow(page);
        if (o.length) note(`overflow ${p} @${width} ${theme}: ${o.join(' | ')}`);
        if (SHOT_WIDTHS.includes(width)) {
          const name = p.replace('.html', '');
          await page.waitForTimeout(1500); // the recordings start after load
          const flat = await page.addStyleTag({ content: '.site-header{position:relative!important}.mobile-cta{display:none!important}' });
          const sections = await page.$$('aside.topline, header.site-header, main > section, main.notfound, footer');
          let i = 0;
          for (const s of sections) {
            const id = (await s.getAttribute('id')) || (await s.evaluate((e) => e.className.split(' ')[0] || e.tagName.toLowerCase()));
            await s.scrollIntoViewIfNeeded();
            await page.waitForTimeout(250);
            await s.screenshot({ path: path.join(OUT, `${name}-${width}-${theme}-${String(i++).padStart(2, '0')}-${id}.png`) });
          }
          await flat.evaluate((el) => el.remove());
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(300);
          await page.screenshot({ path: path.join(OUT, `${name}-${width}-${theme}-viewport.png`) });
        }
        await ctx.close();
      }
    }
  }

  // Every in-page link lands with its target's heading fully below the sticky header.
  for (const p of ['index.html', 'customers.html']) {
    for (const width of [375, 1440]) {
      const { ctx, page } = await newPage(browser, width, 'dark');
      await page.goto(BASE + p, { waitUntil: 'load' });
      await page.addStyleTag({ content: '.js .reveal{opacity:1!important;transform:none!important}html{scroll-behavior:auto!important}' });
      // "#x" is on this page; "./#x" is on the home page.
      const links = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="#"], a[href^="./#"]')]
        .map((a) => a.getAttribute('href')).filter((h) => !/^(\.\/)?#(demo|main)?$/.test(h)))]);
      for (const link of links) {
        const h = link.replace('./', '');
        // Follow the real link, as a visitor would, from the top of its page.
        await page.goto(BASE + p, { waitUntil: 'load' });
        await page.addStyleTag({ content: '.js .reveal{opacity:1!important;transform:none!important}html{scroll-behavior:auto!important}' });
        await Promise.all([
          link.startsWith('./') ? page.waitForURL('**/' + h, { waitUntil: 'load' }) : Promise.resolve(),
          page.evaluate((l) => document.querySelector(`a[href="${l}"]`).click(), link),
        ]);
        await page.addStyleTag({ content: '.js .reveal{opacity:1!important;transform:none!important}' });
        await page.waitForTimeout(400);
        const r2 = await page.evaluate((hash) => {
          const t = document.querySelector(hash);
          if (!t) return { missing: true };
          const head = t.matches('h1,h2,h3') ? t : t.querySelector(':scope [role="tablist"]') || t.querySelector('h1, h2, h3') || t;
          // A sticky bar covers content only while it is stuck at its top offset.
          const bars = [...document.querySelectorAll('.site-header')].filter((b) => getComputedStyle(b).position === 'sticky'
            && b.getBoundingClientRect().top <= (parseFloat(getComputedStyle(b).top) || 0) + 1);
          const cover = Math.max(0, ...bars.map((b) => b.getBoundingClientRect().bottom));
          return { top: Math.round(head.getBoundingClientRect().top), cover: Math.round(cover), vh: innerHeight };
        }, h);
        if (r2.missing) note(`anchor ${link} from ${p} @${width}: no element with that id`);
        else if (r2.top > r2.vh / 2) note(`anchor ${link} from ${p} @${width}: heading at ${r2.top} did not scroll into view`);
        else if (r2.top < r2.cover) note(`anchor ${link} from ${p} @${width}: heading top ${r2.top} is under the header (${r2.cover})`);
        else console.log(`  ok ${link} from ${p} @${width}: heading at ${r2.top}, header ends ${r2.cover}`);
      }
      await ctx.close();
    }
  }

  // Each demo once, at phone and desktop width, dark and light.
  for (const [width, theme] of [[1440, 'dark'], [375, 'dark'], [1440, 'light'], [375, 'light']]) {
    const { ctx, page } = await newPage(browser, width, theme);
    await page.goto(BASE + 'index.html', { waitUntil: 'load' });
    await page.addStyleTag({ content: '.js .reveal{opacity:1!important;transform:none!important}' });
    const tag = `${width}-${theme}`;

    // The product window: a click, then the arrow keys, with one caption at a time.
    await page.locator('#tab-notes').click();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1200);
    const tabState = await page.evaluate(() => [document.activeElement.id, document.querySelector('[role="tab"][aria-selected="true"]').id,
      [...document.querySelectorAll('[data-panel]')].filter((p) => !p.hidden).map((p) => p.id).join()].join(' '));
    if (tabState !== 'tab-tasks tab-tasks panel-tasks') note(`product window @${tag}: ${tabState}`);
    await page.locator('[data-showcase]').screenshot({ path: path.join(OUT, `demo-window-${tag}.png`) });

    // The film opens, plays and closes with Escape.
    await page.locator('[data-film-open]').click();
    await page.waitForTimeout(800);
    if (!(await page.evaluate(() => document.querySelector('[data-film-dialog]').open))) note(`film @${tag}: did not open`);
    await page.keyboard.press('Escape');

    await page.locator('#chat-input').scrollIntoViewIfNeeded();
    await page.locator('#chat-input').click();
    await page.keyboard.type('Thanks @an');
    await page.waitForTimeout(200);
    await page.locator('[data-chat-demo]').screenshot({ path: path.join(OUT, `demo-chat-mention-${tag}.png`) });
    await page.keyboard.press('Enter');
    await page.keyboard.type('can you share the deck?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    await page.locator('[data-chat-demo]').screenshot({ path: path.join(OUT, `demo-chat-sent-${tag}.png`) });

    await page.locator('[data-ctrl="weak"]').click();
    await page.locator('[data-ctrl="hand"]').click();
    await page.locator('[data-ctrl="phone"]').click();
    await page.waitForTimeout(500);
    await page.locator('[data-call-demo]').screenshot({ path: path.join(OUT, `demo-call-weak-${tag}.png`) });
    await page.locator('[data-ctrl="weak"]').click();
    await page.locator('[data-ctrl="bg"]').click();
    await page.locator('[data-ctrl="bg"]').click();
    await page.waitForTimeout(500);
    await page.locator('[data-call-demo]').screenshot({ path: path.join(OUT, `demo-call-company-${tag}.png`) });

    await page.locator('[data-notes-end]').click();
    await page.waitForTimeout(4500);
    await page.locator('[data-notes-demo]').screenshot({ path: path.join(OUT, `demo-notes-${tag}.png`) });

    await page.locator('[data-task="t4"]').click();
    await page.locator('[data-task-act="block"]').click();
    await page.locator('#block-reason').fill('API keys from the bank');
    await page.screenshot({ path: path.join(OUT, `demo-scrum-blocking-${tag}.png`) });
    await page.keyboard.press('Enter');
    await page.locator('[data-handle="vs"]').focus();
    await page.keyboard.press('Space');
    for (let k = 0; k < 4; k++) await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await page.locator('[data-scrum-demo]').screenshot({ path: path.join(OUT, `demo-scrum-${tag}.png`) });

    await page.locator('[data-day-play]').click();
    await page.waitForTimeout(13000);
    await page.locator('.standup-grid').screenshot({ path: path.join(OUT, `demo-day-${tag}.png`) });

    await page.locator('[data-flow="file"]').click();
    await page.waitForTimeout(1500);
    await page.locator('[data-flow-demo]').screenshot({ path: path.join(OUT, `demo-flow-${tag}.png`) });

    await page.locator('[data-roi-people]').fill('200');
    await page.locator('[data-roi-seat]').fill('600');
    await page.locator('[data-roi]').screenshot({ path: path.join(OUT, `demo-roi-${tag}.png`) });

    // Book a demo and Get a quote open the booking page as it is, in a new tab.
    const links = await page.$$eval('[data-demo]', (as) => as.map((a) => [a.href, a.target, a.rel]));
    const bad = links.filter(([h, t, r]) => h !== 'https://calendar.app.google/N49RsbFjwGHiVa6d6' || t !== '_blank' || !r.includes('noopener'));
    if (!links.length || bad.length) note(`booking links @${tag}: ${links.length} found, ${bad.length} wrong`);
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'problems.txt'), problems.join('\n') + '\n');
  console.log(`\n${problems.length} problems. Screenshots in ${OUT}`);
})();
