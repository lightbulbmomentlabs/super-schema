const puppeteer = require('puppeteer');

const TEST_URL = 'https://amili.fi/';

async function testCSSBlocking() {
  console.log('Testing CSS blocking impact on https://amili.fi/\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-cache'
    ]
  });

  // Test WITHOUT CSS blocking
  console.log('Test 1: Block images + fonts (NO CSS blocking)');
  console.log('='.repeat(50));
  const page1 = await browser.newPage();
  const start1 = Date.now();

  try {
    await page1.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    );
    await page1.setViewport({ width: 1920, height: 1080 });
    await page1.setCacheEnabled(false);

    await page1.setRequestInterception(true);
    page1.on('request', (req) => {
      const type = req.resourceType();
      if (type === 'image' || type === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });

    const response = await page1.goto(TEST_URL, {
      waitUntil: 'load',
      timeout: 15000
    });

    const elapsed = Date.now() - start1;
    console.log(`✅ SUCCESS in ${elapsed}ms`);
    console.log(`   Status: ${response.status()}`);
    console.log(`   Title: ${await page1.title()}\n`);
  } catch (error) {
    const elapsed = Date.now() - start1;
    console.log(`❌ FAILED after ${elapsed}ms`);
    console.log(`   Error: ${error.message}\n`);
  }
  await page1.close();

  // Test WITH CSS blocking
  console.log('Test 2: Block images + fonts + CSS (WITH CSS blocking)');
  console.log('='.repeat(50));
  const page2 = await browser.newPage();
  const start2 = Date.now();

  try {
    await page2.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    );
    await page2.setViewport({ width: 1920, height: 1080 });
    await page2.setCacheEnabled(false);

    await page2.setRequestInterception(true);
    page2.on('request', (req) => {
      const type = req.resourceType();
      if (type === 'image' || type === 'font' || type === 'stylesheet') {
        req.abort();
      } else {
        req.continue();
      }
    });

    const response = await page2.goto(TEST_URL, {
      waitUntil: 'load',
      timeout: 15000
    });

    const elapsed = Date.now() - start2;
    console.log(`✅ SUCCESS in ${elapsed}ms`);
    console.log(`   Status: ${response.status()}`);
    console.log(`   Title: ${await page2.title()}\n`);
  } catch (error) {
    const elapsed = Date.now() - start2;
    console.log(`❌ FAILED after ${elapsed}ms`);
    console.log(`   Error: ${error.message}\n`);
  }
  await page2.close();

  await browser.close();
  console.log('Tests complete!');
}

testCSSBlocking().catch(console.error);
