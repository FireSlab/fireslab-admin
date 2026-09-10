import puppeteer from 'puppeteer-core';

async function testAll() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // 1. Check Admin Hero Slides page
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1440, height: 900 });
  await page1.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1000));
  await page1.type('input[type="email"]', 'admin@fireslab.com');
  await page1.type('input[type="password"]', 'admin@123!');
  await page1.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 2000));

  await page1.goto('http://localhost:3000/dashboard/hero-slides', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  await page1.screenshot({ path: 'C:/Users/Tusha/.gemini/antigravity-ide/brain/ff2c70ae-f4b2-4b21-a306-fc177fc1aacd/hero_slides_view.png' });

  // 2. Check Frontend Home with Products 3D Parallax Tilt cards
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1440, height: 900 });
  await page2.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));

  // Scroll to Products section
  await page2.evaluate(() => {
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page2.screenshot({ path: 'C:/Users/Tusha/.gemini/antigravity-ide/brain/ff2c70ae-f4b2-4b21-a306-fc177fc1aacd/batch2_08_products_scroll.png' });

  // Click on first 3D Parallax product box
  const cards = await page2.$$('.parallax-box');
  if (cards.length > 0) {
    await cards[0].click();
    await new Promise((r) => setTimeout(r, 800));
    await page2.screenshot({ path: 'C:/Users/Tusha/.gemini/antigravity-ide/brain/ff2c70ae-f4b2-4b21-a306-fc177fc1aacd/batch2_09_product_modal.png' });
  }

  await browser.close();
  console.log('All verification snapshots completed successfully!');
}

testAll().catch(console.error);
