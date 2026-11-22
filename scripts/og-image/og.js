// Renders og.html to a 1200x630 JPEG. Needs Playwright (npm i -D playwright) and internet for the Google Fonts.
//   node scripts/og-image/og.js                 -> writes assets/images/og-default.jpg
//   node scripts/og-image/og.js /tmp/test.jpg   -> writes elsewhere, to compare first
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || path.join(__dirname, '../../assets/images/og-default.jpg');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('file://' + path.join(__dirname, 'og.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: out, type: 'jpeg', quality: 88 });
  await browser.close();
  console.log('written', out);
})();
