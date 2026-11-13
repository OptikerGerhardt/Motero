#!/usr/bin/env node
/**
 * Capture real Motero PDF reader previews in a simulated BOOX-sized Chromium viewport.
 * These are browser-rendered reader screenshots, not Android/E-Ink hardware captures.
 * Uses only the synthetic public test fixture included in the reader submodule.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const build = path.join(root, 'reader', 'build', 'android');
const fixture = path.join(root, 'reader', 'test', 'fixtures', 'boox-fitting.pdf');
const output = path.resolve(process.env.BOOX_SCREENSHOT_OUTPUT || path.join(root, 'screenshot-previews'));
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.pdf': 'application/pdf', '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml', '.png': 'image/png'
};

(async () => {
  if (!fs.existsSync(path.join(build, 'view.html')) || !fs.existsSync(fixture)) {
    throw new Error('Build the Android reader first and initialize the reader submodule');
  }
  fs.mkdirSync(output, { recursive: true });
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = name === '/fixture.pdf' ? fixture : path.join(build, name);
    if (!file.startsWith(build + path.sep) && file !== fixture) {
      res.writeHead(403); res.end(); return;
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.BOOX_TEST_BROWSER || chromium.executablePath(),
      headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    // Approximate mobile CSS viewport, rendered to 1263 x 1680 physical pixels.
    // The exact Android dp viewport/density depends on user device settings.
    const page = await browser.newPage({
      viewport: { width: 421, height: 560 },
      deviceScaleFactor: 3,
      isMobile: true, hasTouch: true, colorScheme: 'light'
    });
    page.setDefaultTimeout(45000);
    page.on('pageerror', error => console.error('BROWSER ERROR', error.message));
    await page.goto(origin + '/view.html?readerColorScheme=light', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.testMessages = [];
      const channel = new MessageChannel();
      channel.port1.onmessage = event => window.testMessages.push(JSON.parse(event.data));
      window.postMessage('initPort', '*', [channel.port2]);
    });
    await page.waitForFunction(() =>
      window.testMessages.some(entry => entry.message?.event === 'onInitialized'));
    await page.evaluate(url => {
      const options = {
        type: 'pdf', url, annotations: [], colorScheme: 'light',
        directHighlight: true,
        viewState: { pageIndex: 0, scale: 'page-width', scrollMode: 0, spreadMode: 0 }
      };
      window.createView(btoa(JSON.stringify(options)));
    }, origin + '/fixture.pdf');
    await page.waitForFunction(() =>
      window._view?._view?._resolveInitializedPromise === null);
    await page.evaluate(async () => window._view._view._ensureBasicPageData(0));
    await page.waitForTimeout(300);

    async function capture(name) {
      const filename = path.join(output, name + '.png');
      await page.screenshot({ path: filename, animations: 'disabled' });
      console.log('Captured', filename);
    }

    await capture('01-pdf-reader');

    await page.evaluate(() => {
      const annotations = window._view._annotationManager;
      annotations.addAnnotation({
        type: 'highlight', color: '#AA81D0', text: 'Demonstration',
        pageLabel: '1', sortIndex: '00000|000100|00000',
        position: { pageIndex: 0, rects: [[70, 630, 420, 650]] }
      });
      annotations.addAnnotation({
        type: 'ink', color: '#4C81B5', pageLabel: '1',
        sortIndex: '00000|000101|00000',
        position: {
          pageIndex: 0, width: 2,
          paths: [[110, 575, 150, 585, 190, 580, 240, 590, 300, 585]]
        }
      });
    });
    await page.waitForTimeout(200);
    await capture('02-highlights-and-ink');

    await page.evaluate(() => window._view._annotationManager.addAnnotation({
      type: 'note', color: '#000000', comment: 'Bookmark · demo',
      pageLabel: '1', sortIndex: '00000|000102|00000',
      position: { pageIndex: 0, rects: [[200, 300, 222, 322]] }
    }));
    await page.waitForTimeout(200);
    await capture('03-bookmarks');

    await page.evaluate(() => window._view.setColorScheme('dark'));
    await page.waitForTimeout(300);
    await capture('04-dark-appearance');

    fs.writeFileSync(path.join(output, 'README.txt'),
      'Browser-rendered screenshots of Motero reader, simulated BOOX-like 421x560 CSS px / 3x pixel ratio.\n' +
      'Synthetic test document only. These DO NOT show the native Android toolbar, actual E-Ink colors, or hardware behavior.\n');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
