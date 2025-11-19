const puppeteer = require('puppeteer');

const TEST_URL = 'https://amili.fi/';

async function testConfig(configName, setupFn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${configName}`);
  console.log('='.repeat(60));

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

  const page = await browser.newPage();
  const startTime = Date.now();

  try {
    // Apply custom setup
    await setupFn(page);
    console.log(`Navigating to ${TEST_URL}...`);

    const response = await page.goto(TEST_URL, {
      waitUntil: 'load',
      timeout: 30000
    });

    const elapsed = Date.now() - startTime;
    const title = await page.title();
    const url = page.url();

    console.log(`✅ SUCCESS in ${elapsed}ms`);
    console.log(`   Status: ${response.status()}`);
    console.log(`   Title: ${title}`);
    console.log(`   Final URL: ${url}`);

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log(`❌ FAILED after ${elapsed}ms`);
    console.log(`   Error: ${error.message}`);
  }

  await browser.close();
}

async function runTests() {
  console.log('Testing https://amili.fi/ with different configurations\n');

  // Test 1: Minimal config (no blocking, no interception)
  await testConfig('Test 1: Minimal (no blocking)', async (page) => {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });
  });

  // Test 2: With cache disabled
  await testConfig('Test 2: Cache disabled', async (page) => {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setCacheEnabled(false);
  });

  // Test 3: With request interception but no blocking
  await testConfig('Test 3: Request interception (no blocking)', async (page) => {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setCacheEnabled(false);

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      req.continue();
    });
  });

  // Test 4: Block only images
  await testConfig('Test 4: Block only images', async (page) => {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setCacheEnabled(false);

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'image') {
        req.abort();
      } else {
        req.continue();
      }
    });
  });

  // Test 5: Block images + fonts
  await testConfig('Test 5: Block images + fonts', async (page) => {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setCacheEnabled(false);

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (type === 'image' || type === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });
  });

  // Test 6: Block images + fonts + CSS
  await testConfig('Test 6: Block images + fonts + CSS', async (page) => {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setCacheEnabled(false);

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (type === 'image' || type === 'font' || type === 'stylesheet') {
        req.abort();
      } else {
        req.continue();
      }
    });
  });

  // Test 7: Full production config (as in scraper.ts)
  await testConfig('Test 7: Full production config', async (page) => {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setCacheEnabled(false);

    const blockedResourceTypes = [
      'image',
      'media',
      'font',
      'stylesheet',
      'texttrack'
    ];

    const blockedDomains = [
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.com',
      'facebook.net',
      'doubleclick.net',
      'googlesyndication.com',
      'googleadservices.com',
      'hotjar.com',
      'segment.com',
      'segment.io',
      'mixpanel.com',
      'intercom.io',
      'intercom.com',
      'clarity.ms',
      'analytics.tiktok.com',
      'connect.facebook.net',
      'ads-twitter.com',
      'linkedin.com/px'
    ];

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();

      if (blockedResourceTypes.includes(resourceType)) {
        req.abort();
        return;
      }

      if (blockedDomains.some(domain => url.includes(domain))) {
        req.abort();
        return;
      }

      req.continue();
    });
  });

  console.log('\n' + '='.repeat(60));
  console.log('All tests complete!');
  console.log('='.repeat(60));
}

runTests().catch(console.error);
