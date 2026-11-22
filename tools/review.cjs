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
          await page.waitForTimeout(1500); // the hero's videos start after load
          const sections = await page.$$('header.site-header, main > section, main > nav, main.notfound, footer');
          let i = 0;
          for (const s of sections) {
            const id = (await s.getAttribute('id')) || (await s.evaluate((e) => e.className.split(' ')[0] || e.tagName.toLowerCase()));
            await s.scrollIntoViewIfNeeded();
            await page.waitForTimeout(250);
            await s.screenshot({ path: path.join(OUT, `${name}-${width}-${theme}-${String(i++).padStart(2, '0')}-${id}.png`) });
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(300);
          await page.screenshot({ path: path.join(OUT, `${name}-${width}-${theme}-viewport.png`) });
        }
        await ctx.close();
      }
    }
  }

  // Each demo once, at phone and desktop width, dark and light.
  for (const [width, theme] of [[1440, 'dark'], [375, 'dark'], [1440, 'light'], [375, 'light']]) {
    const { ctx, page } = await newPage(browser, width, theme);
    await page.goto(BASE + 'index.html', { waitUntil: 'load' });
    await page.addStyleTag({ content: '.js .reveal{opacity:1!important;transform:none!important}' });
    const tag = `${width}-${theme}`;

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
    await page.locator('[data-roi]').screenshot({ path: path.join(OUT, `demo-roi-${tag}.png`) });

    await page.locator('.hero [data-demo]').first().scrollIntoViewIfNeeded();
    await page.locator('.hero [data-demo]').first().click();
    await page.locator('#f-name').fill('Test Person');
    await page.locator('#f-email').fill('test@example.com');
    await page.locator('#f-company').fill('Example Ltd');
    await page.locator('#f-size').selectOption({ index: 2 });
    await page.locator('[data-form-submit]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `demo-form-${tag}.png`) });
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'problems.txt'), problems.join('\n') + '\n');
  console.log(`\n${problems.length} problems. Screenshots in ${OUT}`);
})();
