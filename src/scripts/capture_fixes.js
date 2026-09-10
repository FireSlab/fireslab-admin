import puppeteer from 'puppeteer-core';

async function snap() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1440, height: 900 });
  await page1.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1000));
  await page1.type('input[type="email"]', 'admin@fireslab.com');
  await page1.type('input[type="password"]', 'admin@123!');
  await page1.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 2500));
  await page1.goto('http://localhost:3000/dashboard/products', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await page1.screenshot({
    path: 'C:/Users/Tusha/.gemini/antigravity-ide/brain/ff2c70ae-f4b2-4b21-a306-fc177fc1aacd/admin_products_table_fixed.png',
  });

  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1440, height: 900 });
  await page2.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await page2.screenshot({
    path: 'C:/Users/Tusha/.gemini/antigravity-ide/brain/ff2c70ae-f4b2-4b21-a306-fc177fc1aacd/frontend_home_navbar_fixed.png',
  });

  await browser.close();
  console.log('All verification screenshots captured successfully');
}

snap().catch(console.error);
