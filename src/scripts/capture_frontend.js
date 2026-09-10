import puppeteer from 'puppeteer-core';

async function snap() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: 'C:/Users/Tusha/.gemini/antigravity-ide/brain/ff2c70ae-f4b2-4b21-a306-fc177fc1aacd/frontend_home_navbar_clean.png',
  });

  await browser.close();
  console.log('Homepage screenshot captured');
}

snap().catch(console.error);
