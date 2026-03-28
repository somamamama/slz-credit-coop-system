#!/usr/bin/env node
// Simple Puppeteer script to test the dashboard loan-approval notification.
// Usage:
//   node tools/test-loan-notification.js --url http://localhost:3000 --member TEST123 --wait 10000

const puppeteer = require('puppeteer');

const argv = require('minimist')(process.argv.slice(2));
const url = argv.url || 'http://localhost:3000';
const memberNumber = argv.member || 'TEST123';
const waitMs = parseInt(argv.wait || '10000', 10);

async function run() {
  console.log('Launching browser...');
  const preferredExec = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser' || '/usr/bin/google-chrome';
  const headless = argv.headless !== 'false' && argv.headless !== '0' ? true : false;

  const launchOptions = { headless };

  // helper to detect executable path
  const fs = require('fs');
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else if (fs.existsSync('/usr/bin/chromium-browser')) {
    launchOptions.executablePath = '/usr/bin/chromium-browser';
  } else if (fs.existsSync('/usr/bin/google-chrome')) {
    launchOptions.executablePath = '/usr/bin/google-chrome';
  }

  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (err) {
    console.warn('Default launch failed, retrying with no-sandbox flags:', err.message || err);
    // common flags to avoid sandbox errors on Linux CI/desktop without proper libs
    const fallbackOpts = {
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };
    if (launchOptions.executablePath) fallbackOpts.executablePath = launchOptions.executablePath;
    try {
      browser = await puppeteer.launch(fallbackOpts);
    } catch (err2) {
      console.error('Retry launch also failed. See Puppeteer troubleshooting: https://pptr.dev/troubleshooting');
      throw err2;
    }
  }
  const page = await browser.newPage();

  // Intercept network requests so we can simulate backend responses
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const reqUrl = req.url();
    if (reqUrl.includes('/api/loan-application/list')) {
      // Return a response with one approved application
      const body = JSON.stringify({
        applications: [
          {
            application_id: 'test-approval-1',
            status: 'approved',
            title: 'Automated Test Loan',
            notes: 'This is a simulated approval for testing.'
          }
        ]
      });
      req.respond({ status: 200, contentType: 'application/json', body });
      return;
    }

    if (reqUrl.includes('/api/user')) {
      // Provide a minimal user object with matching member_number so dashboard loads
      const body = JSON.stringify({
        success: true,
        user: {
          user_id: 'test-user-1',
          member_number: memberNumber,
          recentTransactions: [],
          accounts: { savings: { accountNumber: 'S-TEST-001' } }
        }
      });
      req.respond({ status: 200, contentType: 'application/json', body });
      return;
    }

    // allow all other requests
    req.continue();
  });

  console.log(`Navigating to ${url} ...`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait a bit for the dashboard to mount and for the polling to run
  console.log('Waiting for notification (waiting up to', waitMs, 'ms) ...');

  try {
    // Wait for a toastified toast element or our inline banner
    await Promise.race([
      page.waitForSelector('.Toastify__toast', { timeout: waitMs }),
      page.waitForFunction(() => !!document.querySelector('.approved-banner'), { timeout: waitMs })
    ]);

    console.log('Notification appeared!');
    // optionally take screenshot
    const screenshotPath = 'tools/notification-test-result.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Saved screenshot to', screenshotPath);
  } catch (err) {
    console.error('Timed out waiting for notification:', err.message || err);
    await page.screenshot({ path: 'tools/notification-test-timeout.png' });
    console.log('Saved timeout screenshot to tools/notification-test-timeout.png');
  }

  await browser.close();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
