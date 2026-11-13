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
const fixture = path.join(require('os').tmpdir(), 'motero-screenshot-fixture.pdf');
const output = path.resolve(process.env.BOOX_SCREENSHOT_OUTPUT || path.join(root, 'screenshot-previews'));
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.pdf': 'application/pdf', '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml', '.png': 'image/png'
};

(async () => {
  if (!fs.existsSync(path.join(build, 'view.html'))) {
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
    // Produce a multi-section academic-style PDF with wholly synthetic content.
    // Chromium prints it once; the actual Motero Reader/PDF.js opens the resulting PDF.
    const demoPage = await browser.newPage();
    const paragraphA = 'A reliable annotation preserves the distinction between what a source says and what a reader concludes. A highlighted sentence may establish the textual basis for a question, while handwritten notes trace the argument that follows from it. Each interpretation should remain revisable.';
    const paragraphB = 'Close reading becomes easier when the page remains legible and navigation does not interrupt the train of thought. The reader can mark a passage, compare it to surrounding paragraphs, and return to it later. The annotations form a record of an evolving interpretation.';
    const paragraphC = 'A note is not merely a summary. It can identify an objection, articulate a presupposition, or record a possible counterexample. Linking a note to its source makes the distinction between evidence and response visible and testable.';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      @page { size: A4; margin: 58px 67px 58px 67px; }
      body { font: 15px/1.52 Georgia, "Times New Roman", serif; color: #202329; }
      .eyebrow { text-transform: uppercase; font: 9px Arial,sans-serif; letter-spacing: 1.8px; color: #586574; margin-bottom: 12px; }
      h1 { font-size: 26px; margin: 0 0 10px; font-weight: 600; }
      .sub { font: 11px Arial,sans-serif; margin: 0 0 28px; color: #687584; }
      h2 { font-size: 17px; margin: 19px 0 8px; font-weight: 600; }
      p { margin: 0 0 13px; text-align: justify; }
      .callout { border-left: 2px solid #778596; padding: 5px 12px; margin: 15px 0 20px; font-style: italic; }
      .footer { font: 9px Arial,sans-serif; margin-top: 28px; color: #75808A; }
    </style></head><body>
      <div class="eyebrow">Motero Reader · Demonstration</div>
      <h1>Reading, Evidence, and Interpretation</h1>
      <div class="sub">Synthetic academic-style text created for a public software demonstration</div>
      <h2>1. From passage to question</h2>
      <p>${paragraphA}</p><p>${paragraphB}</p>
      <div class="callout">An annotation connects the original passage with a question that can be revisited.</div>
      <h2>2. Working with critical notes</h2>
      <p>${paragraphC}</p><p>${paragraphA}</p>
      <h2>3. Comparing interpretations</h2>
      <p>${paragraphB}</p><p>${paragraphC}</p>
      <div class="footer">Illustrative text only · No private document or user data</div>
    </body></html>`;
    await demoPage.setContent(html);
    await demoPage.pdf({path: fixture, format: 'A4', printBackground: true});
    await demoPage.close();
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
      'Synthetic, generated demonstration document only. These DO NOT show the native Android toolbar, actual E-Ink colors, or hardware behavior.\n');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
