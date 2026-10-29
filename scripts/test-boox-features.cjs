const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '../build/android');
const fixture = path.resolve(__dirname, '../test/fixtures/boox-pages.pdf');
const problem = process.env.BOOX_PROBLEM_PDF;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
 '.css': 'text/css', '.pdf': 'application/pdf', '.wasm': 'application/wasm' };

(async () => {
 const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname;
  const file = name === '/fixture.pdf' ? fixture : name === '/problem.pdf' ? problem : path.join(root, name);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const origin = 'http://127.0.0.1:' + server.address().port;
 const browser = await chromium.launch({ executablePath: process.env.BOOX_TEST_BROWSER,
  headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
 const page = await browser.newPage({ viewport: { width: 600, height: 800 }, isMobile: true, hasTouch: true });
 const errors = [];
 page.on('pageerror', error => { errors.push(error.message); console.error('PAGE ERROR', error.stack); });
 page.setDefaultTimeout(30000);
 const cdp = await page.context().newCDPSession(page);
 const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type,
  touchPoints: points.map((p, i) => ({ ...p, id: i + 1, radiusX: 2, radiusY: 2 })) });
 async function tap(point) { await touch('touchStart', [point]); await touch('touchEnd', []); await page.waitForTimeout(450); }
 async function open(pdf = '/fixture.pdf', extra = {}) {
  await page.goto(origin + '/view.html');
  await page.evaluate(() => {
   window.testMessages = [];
   const channel = new MessageChannel();
   channel.port1.onmessage = e => window.testMessages.push(JSON.parse(e.data));
   window.postMessage('initPort', '*', [channel.port2]);
  });
  await page.waitForFunction(() => window.testMessages.some(x => x.message?.event === 'onInitialized'));
  await page.evaluate(({ origin, pdf, extra }) => window.createView(btoa(JSON.stringify({
   type: 'pdf', url: origin + pdf, annotations: [], directHighlight: true,
   viewState: { pageIndex: 0, scale: 'page-width', scrollMode: 2, spreadMode: 0 }, ...extra,
  }))), { origin, pdf, extra });
  await page.waitForFunction(() => window._view?._view?._resolveInitializedPromise === null);
  await page.evaluate(() => window._view._view._ensureBasicPageData(0));
  await page.waitForTimeout(250);
 }
 const state = () => page.evaluate(() => {
  const view = window._view._view, v = view._iframeWindow.PDFViewerApplication.pdfViewer;
  const p = v.getPageView(v.currentPageNumber - 1), c = v.container;
  return { page: v.currentPageNumber, scale: v.currentScale, mode: v.scrollMode,
   x: c.scrollLeft - p.div.offsetLeft - p.div.clientLeft,
   y: c.scrollTop - p.div.offsetTop - p.div.clientTop,
   overview: view._booxReader.isOverview(), reading: view._booxReader.readingScale };
 });
 try {
  // Both navigation directions and both scrolling layouts retain a manually
  // chosen horizontal crop. This reproduces the original page-turn failure.
  for (const pdf of problem ? ['/fixture.pdf', '/problem.pdf'] : ['/fixture.pdf']) {
   for (const mode of [0, 2]) {
    await open(pdf);
    await page.evaluate(mode => {
     const v = window._view._view._iframeWindow.PDFViewerApplication.pdfViewer;
     v.scrollMode = mode; v.currentScale = 1.5;
     const p = v.getPageView(0); v.container.scrollLeft = p.div.offsetLeft + p.div.clientLeft + 80;
    }, mode);
    await page.waitForTimeout(100);
    const before = await state();
    await page.evaluate(() => window.turnPageWithHardwareButton(true, 0));
    await page.waitForTimeout(150);
    let after = await state();
    assert.equal(after.page, 2); assert.ok(Math.abs(after.x - before.x) < 2, JSON.stringify({ before, after }));
    assert.equal(after.scale, before.scale);
    await page.evaluate(() => window.turnPageWithHardwareButton(false, 0));
    await page.waitForTimeout(150);
    after = await state();
    assert.equal(after.page, 1); assert.ok(Math.abs(after.x - before.x) < 2);
    console.log('PASS pan', pdf, mode, before.x, after.x);
   }
  }
  if (problem) {
   await open('/problem.pdf');
   await page.evaluate(async () => {
    const view = window._view._view, v = view._iframeWindow.PDFViewerApplication.pdfViewer;
    await view.navigate({ pageIndex: 249 });
    view.setContentFit({ margin: 0.01 }); await view.fitToContent({ margin: 0.01 });
   });
   const fitted = await state();
   await page.evaluate(() => window.turnPageWithHardwareButton(true, 0));
   await page.waitForTimeout(150);
   const next = await state();
   assert.equal(next.page, 251); assert.equal(next.scale, fitted.scale);
   assert.ok(Math.abs(next.x - fitted.x) < 2, JSON.stringify({ fitted, next }));
   await page.evaluate(() => window.turnPageWithHardwareButton(false, 0));
   await page.waitForTimeout(150);
   const previous = await state();
   assert.equal(previous.page, 250); assert.ok(Math.abs(previous.x - fitted.x) < 2);
   console.log('PASS Fit to Content pan in body pages of problem PDF', fitted.x, previous.x);
  }
  await open();
  await page.evaluate(() => {
   const v = window._view._view._iframeWindow.PDFViewerApplication.pdfViewer;
   v.currentScale = 1.5; v.container.scrollTop = 8;
  });
  const edge = await page.evaluate(async () => {
   const view = window._view._view, v = view._iframeWindow.PDFViewerApplication.pdfViewer, c = v.container;
   const oldTop = c.scrollTop, oldBottom = c.getBoundingClientRect().bottom;
   await window.turnPageWithHardwareButton(true, 2 / 3);
   const line = view._booxReader.edgeElement;
   return { expected: oldBottom - (c.scrollTop - oldTop), actual: line?.getBoundingClientRect().top,
    page: v.currentPageNumber, pointerEvents: line && getComputedStyle(line).pointerEvents,
    opacity: line && getComputedStyle(line).opacity };
  });
  assert.equal(edge.page, 1); assert.ok(Math.abs(edge.actual - edge.expected) < 4, JSON.stringify(edge));
  assert.equal(edge.pointerEvents, 'none');
  assert.equal(edge.opacity, '0.5');
  console.log('PASS reading edge', edge);
  await page.setViewportSize({ width: 600, height: 856 });
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => !!window._view._view._booxReader.edgeElement?.isConnected), true);
  await page.setViewportSize({ width: 600, height: 800 });
  await page.waitForTimeout(200);
  console.log('PASS reading edge survives native-bar height changes');
  const reverseEdge = await page.evaluate(async () => {
   const view = window._view._view, v = view._iframeWindow.PDFViewerApplication.pdfViewer, c = v.container;
   const oldTop = c.scrollTop, oldViewportTop = c.getBoundingClientRect().top;
   await window.turnPageWithHardwareButton(false, 1 / 3);
   return { expected: oldViewportTop + oldTop - c.scrollTop,
    actual: view._booxReader.edgeElement?.getBoundingClientRect().top };
  });
  assert.ok(Math.abs(reverseEdge.actual - reverseEdge.expected) < 4, JSON.stringify(reverseEdge));
  console.log('PASS reverse reading edge', reverseEdge);
  await page.evaluate(() => window.turnPageWithHardwareButton(true, 0));
  assert.equal(await page.evaluate(() => !!window._view._view._booxReader.edgeElement), false);
  await open();
  await page.evaluate(() => window._view._view._iframeWindow.PDFViewerApplication.pdfViewer.currentScale = 1.5);
  await touch('touchStart', [{ x: 300, y: 550 }]);
  for (let i = 1; i <= 8; i++) {
   await touch('touchMove', [{ x: 300, y: 550 - i * 20 }]);
   await page.waitForTimeout(35);
  }
  await touch('touchEnd', []); await page.waitForTimeout(500);
  assert.ok(await page.evaluate(() => !!window._view._view._booxReader.edgeElement));
  assert.equal(await page.evaluate(() => window._view._view._annotations.length), 0);
  console.log('PASS reading edge after free swipe without accidental annotation');

  // One completed hold/drag creates one annotation; the palette changes its
  // existing ID instead of creating a duplicate.
  await open();
  const points = await page.evaluate(() => {
   const view = window._view._view, p = view._iframeWindow.PDFViewerApplication.pdfViewer.getPageView(0);
   const r = p.div.getBoundingClientRect(), outer = view._iframe.getBoundingClientRect();
   function at(i) { const rect = view._pdfPages[0].chars[i].rect;
    const xy = p.viewport.convertToViewportPoint((rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2);
    return { x: r.left + outer.left + xy[0], y: r.top + outer.top + xy[1] }; }
   return [at(1), at(25)];
  });
  await touch('touchStart', [points[0]]); await page.waitForTimeout(600);
  for (let i = 1; i <= 8; i++) await touch('touchMove', [{
   x: points[0].x + (points[1].x - points[0].x) * i / 8, y: points[0].y }]);
  await touch('touchEnd', []); await page.waitForTimeout(200);
  const first = await page.evaluate(() => window._view._view._annotations.map(x => ({ id: x.id, color: x.color })));
  assert.equal(first.length, 1);
  const palette = page.frameLocator('iframe').locator('.boox-highlight-palette');
  await palette.waitFor({ state: 'visible' });
  await palette.locator('button[data-color="#2ea8e5"]').click();
  const recolored = await page.evaluate(() => window._view._view._annotations.map(x => ({ id: x.id, color: x.color })));
  assert.deepEqual(recolored, [{ id: first[0].id, color: '#2ea8e5' }]);
  assert.equal(await palette.count(), 0);
  console.log('PASS immediate palette, same annotation ID');
  // Native Done now calls the same selection-clear bridge before re-opening.
  await tap(points[0]);
  await page.evaluate(() => window._view.selectAnnotations([]));
  assert.deepEqual(await page.evaluate(() => window._view._view._selectedAnnotationIDs), []);
  const beforeReopen = await page.evaluate(() => window.testMessages.filter(x => x.message?.event === 'onSelectAnnotations').length);
  await tap(points[0]);
  assert.deepEqual(await page.evaluate(() => window._view._view._selectedAnnotationIDs), [first[0].id]);
  assert.ok(await page.evaluate(() => window.testMessages.filter(x => x.message?.event === 'onSelectAnnotations').length) > beforeReopen);
  console.log('PASS annotation reopens after selection-clear bridge');

  await open();
  await tap({ x: 310, y: 65 });
  let notes = await page.evaluate(() => window._view._view._annotations);
  assert.equal(notes.length, 1); assert.equal(notes[0].type, 'note'); assert.equal(notes[0].color, '#aaaaaa');
  assert.match(notes[0].comment, /^(Bookmark|Lesezeichen) · /);
  const fixedPosition = notes[0].position;
  await tap({ x: 590, y: 40 });
  assert.equal(await page.evaluate(() => window._view._view._annotations.length), 1);
  assert.deepEqual(await page.evaluate(() => window._view._view._annotations[0].position), fixedPosition);
  assert.ok(await page.evaluate(() => window._view._view._selectedAnnotationIDs.length === 1));
  assert.ok(await page.evaluate(() => window.testMessages.some(x => x.message?.event === 'onSaveAnnotations')));
  await page.evaluate(() => window._view.selectAnnotations([]));
  await page.evaluate(() => window.turnPageWithHardwareButton(true, 0));
  await page.waitForTimeout(150);
  await tap({ x: 450, y: 45 });
  notes = await page.evaluate(() => window._view._view._annotations);
  assert.equal(notes.length, 2); assert.notEqual(notes[0].position.pageIndex, notes[1].position.pageIndex);
  await open('/fixture.pdf', { annotations: notes });
  assert.equal(await page.evaluate(() => window._view._view._annotations.length), 2);
  await page.evaluate(id => window._view._annotationManager.deleteAnnotations([id]), notes[0].id);
  assert.equal(await page.evaluate(() => window._view._view._annotations.length), 1);
  console.log('PASS dated bookmarks, repeated tap, multiple pages, restoration and standard deletion');
  await open();
  await page.evaluate(() => window._view._view._iframeWindow.PDFViewerApplication.pdfViewer.currentScale = 1.6);
  await tap({ x: 580, y: 30 });
  assert.deepEqual(await page.evaluate(() => window._view._view._annotations[0].position), fixedPosition);
  console.log('PASS fixed bookmark PDF position independent of tap and zoom');
  await open();
  await page.evaluate(() => {
   const v = window._view._view._iframeWindow.PDFViewerApplication.pdfViewer;
   v.scrollMode = 1; v.currentScaleValue = 'page-width';
  });
  // Changing layout can enqueue a later scroll event, after the setter returns.
  await page.waitForTimeout(250);
  await page.waitForFunction(() => !window._view._view._scrolling);
  await tap({ x: 590, y: 45 });
  assert.equal((await state()).page, 1);
  assert.equal(await page.evaluate(() => window._view._view._annotations.length), 1);
  await tap({ x: 590, y: 150 });
  assert.equal((await state()).page, 2);
  assert.equal(await page.evaluate(() => window._view._view._annotations.length), 1);
  console.log('PASS upper right edge bookmarks; lower right edge still turns pages');
  await open();
  await page.evaluate(() => {
   const v = window._view._view._iframeWindow.PDFViewerApplication.pdfViewer;
   v.pagesRotation = 90; v.currentScaleValue = 'page-width';
  });
  await page.waitForTimeout(250);
  await page.waitForFunction(() => !window._view._view._scrolling);
  await tap({ x: 580, y: 35 });
  const rotated = await page.evaluate(() => {
   const view = window._view._view, p = view._iframeWindow.PDFViewerApplication.pdfViewer.getPageView(0);
   const viewport = p.pdfPage.getViewport({ scale: 1, rotation: p.viewport.rotation });
   const rect = viewport.convertToViewportRectangle(view._annotations[0].position.rects[0]);
   return { top: Math.min(rect[1], rect[3]), right: viewport.width - Math.max(rect[0], rect[2]) };
  });
  assert.ok(Math.abs(rotated.top - 4) < 0.1, JSON.stringify(rotated));
  assert.ok(Math.abs(rotated.right - 72 / 2.54) < 0.1, JSON.stringify(rotated));
  console.log('PASS rotated page bookmark remains at visual upper right', rotated);

  for (const restoreMode of ['manual', 'content', 'width', 'manual-with-content-setting']) {
   await open('/fixture.pdf', { pageWidthFit: restoreMode === 'width' });
   await page.evaluate(async mode => {
    const view = window._view._view, v = view._iframeWindow.PDFViewerApplication.pdfViewer;
    if (mode === 'content' || mode === 'manual-with-content-setting') {
     view.setContentFit({ margin: 0.01 }); await view.fitToContent({ margin: 0.01 });
    }
    if (mode === 'manual' || mode === 'manual-with-content-setting') v.currentScale = 1.6;
    window.expectedReadingScale = v.currentScale;
    for (let i = 0; i < 6; i++) { const p = v.getPageView(i); if (!p.pdfPage) p.setPdfPage(await v.pdfDocument.getPage(i + 1)); }
    v.currentScale = 0.28;
   }, restoreMode);
   await page.waitForTimeout(300);
   console.log('Overview before', restoreMode, await state());
   const target = await page.evaluate(() => {
    const view = window._view._view, v = view._iframeWindow.PDFViewerApplication.pdfViewer;
    const r = v.getPageView(3).div.getBoundingClientRect(), outer = view._iframe.getBoundingClientRect();
    return { x: outer.left + r.left + r.width / 2, y: outer.top + r.top + r.height / 2 };
   });
   assert.ok(target.y < 800, JSON.stringify(target));
   await tap(target);
   await page.waitForFunction(() => {
    const v = window._view._view._iframeWindow.PDFViewerApplication.pdfViewer;
    return v.currentPageNumber === 4 && v.currentScale > 0.6;
   });
   const after = await state(), expected = await page.evaluate(() => window.expectedReadingScale);
   assert.equal(after.mode, 2); assert.ok(Math.abs(after.scale - expected) < 0.02, JSON.stringify({ after, expected }));
   console.log('PASS overview selection', restoreMode, after);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: all new Reader features');
 } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
