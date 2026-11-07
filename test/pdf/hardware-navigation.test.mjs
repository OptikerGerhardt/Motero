import assert from 'node:assert/strict';
import test from 'node:test';
import { navigateWithHardwareButton as move, getHardwareScrollLimits } from '../../src/pdf/hardware-navigation.mjs';

test('EPUB hardware navigation respects document ends and ignores an uninitialized flow', async () => {
	let calls = [];
	let view = {initialized:true,canNavigateToNextPage:()=>false,canNavigateToPreviousPage:()=>true,
		navigateToNextPage(){calls.push('next');},navigateToPreviousPage(){calls.push('previous');}};
	assert.equal(await move(view,true),'none');
	assert.equal(await move(view,false),'page');
	assert.deepEqual(calls,['previous']);
	view.initialized=false;
	assert.equal(await move(view,false),'ignored');
	assert.deepEqual(calls,['previous']);
});

function fixture({ height = 1800, viewport = 600, pages = 3, mode = 1 } = {}) {
	let container = { clientHeight: viewport, clientWidth: 400, clientTop: 2,
		scrollTop: 0, scrollLeft: 17, getBoundingClientRect: () => ({ top: 40 }) };
	let list = Array.from({ length: pages }, (_, i) => ({
		pdfPage: {}, div: { clientHeight: height, clientTop: 1,
			getBoundingClientRect: () => ({ top: 41 + (mode === 0 ? i * height : 0) - container.scrollTop }) },
	}));
	let viewer = { container, currentPageNumber: 1, currentScale: 2, scrollMode: mode,
		spreadMode: 0, getPageView: i => list[i] };
	let view = { _iframeWindow: { PDFViewerApplication: { pdfViewer: viewer } },
		async _navigateToPage({ direction }) { viewer.currentPageNumber += direction; },
	};
	return { view, viewer, container, list };
}

test('forward steps stay inside page; only the following press at bottom turns', async () => {
	let { view, container, viewer } = fixture();
	assert.equal(await move(view, true, 2 / 3), 'scroll');
	assert.equal(container.scrollTop, 400);
	await move(view, true, 2 / 3); await move(view, true, 2 / 3);
	assert.equal(container.scrollTop, 1200); assert.equal(viewer.currentPageNumber, 1);
	assert.equal(await move(view, true, 2 / 3), 'page');
	assert.equal(viewer.currentPageNumber, 2); assert.equal(container.scrollTop, 0);
	assert.equal(container.scrollLeft, 17); assert.equal(viewer.currentScale, 2);
});

test('last partial step clamps to bottom without skipping visible text', async () => {
	let { view, container, viewer } = fixture({ height: 1700 });
	container.scrollTop = 900;
	assert.equal(await move(view, true, 0.67), 'scroll');
	assert.equal(container.scrollTop, 1100); assert.equal(viewer.currentPageNumber, 1);
});

test('backward scroll clamps to top, then enters previous page at bottom', async () => {
	let { view, container, viewer } = fixture();
	viewer.currentPageNumber = 2; container.scrollTop = 80;
	assert.equal(await move(view, false, 0.5), 'scroll'); assert.equal(container.scrollTop, 0);
	assert.equal(await move(view, false, 0.5), 'page');
	assert.equal(viewer.currentPageNumber, 1); assert.equal(container.scrollTop, 1200);
});

test('fitted whole pages, including centered pages, turn immediately', async () => {
	let { view, viewer, list } = fixture({ height: 400 });
	for (let p of list) p.div.getBoundingClientRect = () => ({ top: 141 });
	assert.equal(await move(view, true), 'page'); assert.equal(viewer.currentPageNumber, 2);
});

test('Android content fitting skips hidden paper margins on the first button press', async () => {
	let {view,viewer,container,list} = fixture({height:1000});
	container.scrollTop = 120;
	view._pageFitting = {active:true, options:{mode:'content'}, applied:{pageIndex:0,scale:2,top:120}};
	assert.deepEqual(getHardwareScrollLimits(view,viewer,list[0]),{min:120,max:120,viewportHeight:600});
	assert.equal(await move(view,true),'page'); assert.equal(viewer.currentPageNumber,2);
});

test('first and last pages cannot move outside document', async () => {
	let { view, viewer, container } = fixture();
	assert.equal(await move(view, false), 'none');
	viewer.currentPageNumber = 3; container.scrollTop = 1200;
	assert.equal(await move(view, true), 'none'); assert.equal(viewer.currentPageNumber, 3);
});

test('zero selects page-only mode; step size uses actual viewport', async () => {
	let { view, viewer, container } = fixture();
	assert.equal(await move(view, true, 0), 'page'); assert.equal(viewer.currentPageNumber, 2);
	await move(view, true, 1 / 3); assert.equal(container.scrollTop, 200);
});

test('fractional pixels near edge do not require an extra tiny scroll', async () => {
	let { view, viewer, container } = fixture(); container.scrollTop = 1199.5;
	assert.equal(await move(view, true), 'page'); assert.equal(viewer.currentPageNumber, 2);
});

test('vertical positions use current page bounds, not document bottom', async () => {
	let { view, viewer, container } = fixture({ mode: 0 });
	viewer.currentPageNumber = 2; container.scrollTop = 2000;
	await move(view, true, 0.5); assert.equal(container.scrollTop, 2300);
	container.scrollTop = 3000; await move(view, true, 0.5);
	assert.equal(viewer.currentPageNumber, 3); assert.equal(container.scrollTop, 3600);
});

test('content fit omits white margins; zoom changes restore full-page bounds', () => {
	let { view, viewer, list } = fixture({ height: 2000 });
	view._contentFit = { margin: 0 };
	view._appliedContentFit = { scale: 2, margin: 0, bounds: [0.1, 0.1, 0.9, 0.9] };
	assert.deepEqual(getHardwareScrollLimits(view, viewer, list[0]), { min: 200, max: 1200, viewportHeight: 600 });
	viewer.currentScale = 3; assert.equal(getHardwareScrollLimits(view, viewer, list[0]).max, 1400);
});

test('content shorter than viewport after cropping turns immediately', async () => {
	let { view, viewer } = fixture({ height: 1800 }); view._contentFit = { margin: 0 };
	view._appliedContentFit = { scale: 2, margin: 0, bounds: [0, 0.2, 1, 0.4] };
	assert.equal(await move(view, true), 'page'); assert.equal(viewer.currentPageNumber, 2);
});

test('pending geometry load is cancelled by manual scrolling and failed loads stay put', async () => {
	let { view, viewer, list, container } = fixture(); list[1].pdfPage = null;
	let resolve; viewer.pdfDocument = { getPage: () => new Promise(r => { resolve = r; }) };
	container.scrollTop = 1200; let result = move(view, true); container.scrollTop = 1100; resolve({});
	assert.equal(await result, 'ignored'); assert.equal(viewer.currentPageNumber, 1);
	container.scrollTop = 1200; viewer.pdfDocument.getPage = async () => { throw Error('load failed'); };
	assert.equal(await move(view, true), 'none');
});

test('invalid geometry and destroyed readers ignore press; EPUB uses own navigation', async () => {
	let { view, container } = fixture(); container.clientHeight = 0;
	assert.equal(await move(view, true), 'ignored'); view._destroyed = true;
	assert.equal(await move(view, true), 'ignored'); let called = 0;
	assert.equal(await move({ navigateToNextPage() { called++; } }, true), 'page'); assert.equal(called, 1);
});

test('an unloaded previous page uses its resolved height for bottom entry', async () => {
	let { view, viewer, list } = fixture();
	viewer.currentPageNumber = 2;
	list[0].pdfPage = null;
	list[0].setPdfPage = data => { list[0].pdfPage = data; list[0].div.clientHeight = 2400; };
	viewer.pdfDocument = { getPage: async () => ({ loaded: true }) };
	assert.equal(await move(view, false), 'page');
	assert.equal(viewer.currentPageNumber, 1);
	assert.equal(viewer.container.scrollTop, 1800);
});

test('content margin is included in scroll limits and changing crop settings invalidates old bounds', () => {
	let { view, viewer, list } = fixture({ height: 2000 });
	view._contentFit = { margin: 0.01 };
	view._appliedContentFit = { scale: 2, margin: 0.01, bounds: [0.1, 0.1, 0.9, 0.9] };
	assert.deepEqual(getHardwareScrollLimits(view, viewer, list[0]), { min: 196, max: 1204, viewportHeight: 600 });
	view._contentFit.margin = 0.04;
	assert.deepEqual(getHardwareScrollLimits(view, viewer, list[0]), { min: 0, max: 1400, viewportHeight: 600 });
});
