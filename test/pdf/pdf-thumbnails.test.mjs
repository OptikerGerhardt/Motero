/* global globalThis */

import assert from 'node:assert/strict';
import test from 'node:test';

import { getThumbnailDimensions, PDFThumbnails } from '../../src/pdf/pdf-thumbnails.js';

const dimensions = ({ width, height }) => [width, height];

function createCanvas() {
	return {
		width: 0,
		height: 0,
		getContext: () => ({ drawImage() {} }),
		toDataURL: () => 'data:image/png;base64,thumbnail',
	};
}

function createThumbnails() {
	let viewportCalls = [];
	let renderContexts = [];
	let rendered = [];
	let pdfPage = {
		rotate: 90,
		getViewport({ scale }) {
			viewportCalls.push({ scale });
			let rotated = pdfPage.rotate % 180 !== 0;
			return {
				width: (rotated ? 800 : 600) * scale,
				height: (rotated ? 600 : 800) * scale,
			};
		},
		render(context) {
			renderContexts.push(context);
			return { promise: Promise.resolve() };
		},
	};
	let thumbnails = Object.create(PDFThumbnails.prototype);
	Object.assign(thumbnails, {
		_pdfView: { renderPageAnnotationsOnCanvas: async () => {}, _colorScheme: "light" },
        _epoch: 0, _documentID: "test", _pending: new Map(), _runningJob: null, _onInit: () => {},
		_onRender: thumbnail => rendered.push(thumbnail),
		_renderOptions: [],
		_thumbnails: [{ pageIndex: 0, width: 120, height: 160 }],
		_window: {
			document: { createElement: () => createCanvas() },
			PDFViewerApplication: {
				eventBus: { dispatch() {} },
				pdfDocument: { getPage: async () => pdfPage },
			},
		},
	});
	return { pdfPage, renderContexts, rendered, thumbnails, viewportCalls };
}

test('thumbnail dimensions preserve aspect ratio within optional bounds', () => {
	let cases = [
		[{ width: 600, height: 800 }, undefined, [120, 160]],
        [{ width: 600, height: 60000 }, undefined, [4, 480]],
		[{ width: 600, height: 800 }, { maxHeight: 64 }, [48, 64]],
		[{ width: 800, height: 600 }, { maxWidth: 80, maxHeight: 64 }, [80, 60]],
	];
	for (let [viewport, options, expected] of cases) {
		assert.deepEqual(dimensions(getThumbnailDimensions(viewport, options)), expected);
	}
});

test('PDF thumbnails fit intrinsically rotated pages into the requested bounds', async () => {
	globalThis.window = { devicePixelRatio: 1 };
	let { renderContexts, rendered, thumbnails, viewportCalls } = createThumbnails();

	await thumbnails._render(0, { maxWidth: 80, maxHeight: 64 });

	assert.deepEqual(viewportCalls, [
		{ scale: 1 },
		{ scale: 0.2 },
	]);
	assert.equal(renderContexts.length, 1);
	assert.deepEqual(dimensions(rendered[0]), [80, 60]);
});

test('PDF thumbnails reuse only matching dimensions', async () => {
	globalThis.window = { devicePixelRatio: 1 };
	let { pdfPage, renderContexts, rendered, thumbnails } = createThumbnails();

	await thumbnails._render(0, { maxWidth: 80, maxHeight: 64 });
	await thumbnails._render(0, { maxWidth: 80, maxHeight: 64 });
	assert.equal(renderContexts.length, 1);
	assert.equal(rendered.length, 2);

	await thumbnails._render(0, { maxHeight: 32 });
	assert.equal(renderContexts.length, 2);
	assert.deepEqual(dimensions(rendered.at(-1)), [42, 32]);

	pdfPage.rotate = 0;
	await thumbnails._render(0, { maxHeight: 32 });
	assert.equal(renderContexts.length, 3);
});

test('annotation rerenders preserve the requested thumbnail bounds', async () => {
	globalThis.window = { devicePixelRatio: 1 };
	let { renderContexts, rendered, thumbnails } = createThumbnails();
	let options = { maxWidth: 80, maxHeight: 64 };
	await thumbnails._render(0, options);

	await thumbnails.rerender([0]);

	assert.equal(renderContexts.length, 2);
	assert.deepEqual(dimensions(rendered.at(-1)), [80, 60]);
});


test('theme change discards an in-flight thumbnail instead of caching its old pixels', async () => {
    globalThis.window = { devicePixelRatio: 1 };
    const { thumbnails, pdfPage, rendered } = createThumbnails();
    let complete;
    pdfPage.render = () => ({ promise: new Promise(resolve => complete = resolve) });
    const pending = thumbnails._render(0);
    await new Promise(resolve => setImmediate(resolve));
    const key = thumbnails.renderKey;
    thumbnails.clear();
    assert.notEqual(thumbnails.renderKey, key);
    complete(); await pending;
    assert.equal(rendered.length, 0);
    assert.equal(thumbnails._thumbnails[0].image, undefined);
});

test('pending thumbnail work is bounded and reports cancellations to its host', async () => {
    const { thumbnails, rendered } = createThumbnails();
    thumbnails._thumbnails = Array.from({length:70}, (_,pageIndex)=>({pageIndex}));
    let resume;
    thumbnails._render = () => new Promise(resolve => resume=resolve);
    const pending=thumbnails.render(Array.from({length:70},(_,i)=>i));
    assert.ok(thumbnails._pending.size <= 32);
    assert.equal(rendered.filter(t=>t.canceled).length,38);
    thumbnails.clear(); resume(); await pending;
    assert.equal(thumbnails._pending.size,0);
});

test('dark thumbnails start with original white paper before the PDF.js theme blender', async () => {
    globalThis.window = { devicePixelRatio: 1 };
    const { thumbnails, renderContexts } = createThumbnails();
    thumbnails._window.theme = { background: '#2E3440', foreground: '#D8DEE9' };
    thumbnails._pdfView._colorScheme = 'dark';
    await thumbnails._render(0);
    assert.equal(renderContexts[0].background.toLowerCase(), '#ffffff');
});

test('Android thumbnail images stay bounded while evicted pages remain renderable', async () => {
    globalThis.window = { devicePixelRatio: 1 };
    const { thumbnails, renderContexts, rendered } = createThumbnails();
    thumbnails._pdfView._options = {platform:'android'};
    thumbnails._thumbnails = Array.from({length:96}, (_,pageIndex)=>({pageIndex}));
    for (let i=0;i<96;i++) await thumbnails._render(i);
    assert.equal(rendered.length,96);
    assert.equal(thumbnails._thumbnails.length,96,'retain metadata for every page');
    assert.equal(thumbnails._thumbnails.filter(t=>t.image).length,32);
    assert.equal(thumbnails._thumbnails[0].image,undefined);
    const renders=renderContexts.length;
    await thumbnails._render(0);
    assert.equal(renderContexts.length,renders+1,'an evicted image is rendered on demand');
    await thumbnails._render(0);
    assert.equal(renderContexts.length,renders+1,'a recent image is reused');
    assert.equal(rendered.at(-1).pageIndex,0);
    assert.equal(rendered.at(-1).renderKey,'test:0');
    thumbnails.clear();
    assert.equal(thumbnails._imageBytes,0);
    assert.equal(thumbnails._imageLRU.size,0);
});

test('Android thumbnail cache also respects image byte size', () => {
    const { thumbnails }=createThumbnails();
    thumbnails._pdfView._options={platform:'android'};
    thumbnails._thumbnails=Array.from({length:12},(_,pageIndex)=>({pageIndex,image:'x'.repeat(512*1024)}));
    for(let i=0;i<12;i++) thumbnails._touchImage(i);
    assert.ok(thumbnails._imageBytes<=8*1024*1024);
    assert.equal(thumbnails._thumbnails.filter(t=>t.image).length,8);
    assert.ok(thumbnails._thumbnails[11].image,'retain the most recently requested preview');
});
