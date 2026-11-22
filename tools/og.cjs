// Renders tools/og.html into assets/img/og.png (1200x630), the social card.
// Usage: node tools/og.cjs   (needs the playwright package; set PW to its path if it is elsewhere)
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('file://' + path.resolve(__dirname, 'og.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.resolve(__dirname, '../assets/img/og.png') });
  await browser.close();
})();
