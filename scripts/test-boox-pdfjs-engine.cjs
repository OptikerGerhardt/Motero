// Engine upgrade gate: official viewer regressions plus real bundled rendering.
const { chromium } = require('playwright');
const fs = require('fs'), http = require('http'), path = require('path'), assert = require('assert/strict');
const root = path.resolve(__dirname, '../build/android');
const upstream = path.resolve(__dirname, '../pdfjs/pdf.js');
const pin = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../vendor/pdfjs-mobile.json')));
const jasmine = require.resolve('jasmine-core/lib/jasmine-core/jasmine.js');

function makePDF(embedded) {
	const text = 'BT /F1 24 Tf 20 72 Td (ABC) Tj ET';
	const stream = (data, entries = '') => Buffer.concat([
		Buffer.from(`<< /Length ${data.length} ${entries} >>\nstream\n`), data, Buffer.from('\nendstream')
	]);
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 160] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
		embedded
			? '<< /Type /Font /Subtype /TrueType /BaseFont /MoteroEmbedded-BoldItalic /FirstChar 32 /LastChar 126 /Widths [' + Array(95).fill(600).join(' ') + '] /FontDescriptor 6 0 R /Encoding /WinAnsiEncoding >>'
			: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
		stream(Buffer.from(text))
	];
	if (embedded) objects.push(
		'<< /Type /FontDescriptor /FontName /MoteroEmbedded-BoldItalic /Flags 262240 /FontBBox [-500 -300 1500 1200] /ItalicAngle -12 /Ascent 800 /Descent -200 /CapHeight 700 /StemV 120 /FontFile2 7 0 R >>',
		stream(fs.readFileSync(path.join(root, 'pdf/web/standard_fonts/LiberationSans-BoldItalic.ttf')))
	);
	const chunks = [Buffer.from('%PDF-1.7\n')], offsets = [0];
	let length = chunks[0].length;
	for (const [i, object] of objects.entries()) {
		offsets.push(length);
		const data = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), Buffer.from(object), Buffer.from('\nendobj\n')]);
		chunks.push(data); length += data.length;
	}
	chunks.push(Buffer.from(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`
		+ offsets.slice(1).map(x => String(x).padStart(10, '0') + ' 00000 n \n').join('')
		+ `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF`));
	return Buffer.concat(chunks);
}

(async () => {
	const fixtures = { '/basic.pdf': makePDF(false), '/embedded.pdf': makePDF(true) };
	const server = http.createServer((req, res) => {
		const url = new URL(req.url, 'http://localhost').pathname;
		if (fixtures[url]) { res.setHeader('Content-Type', 'application/pdf'); return res.end(fixtures[url]); }
		if (url === '/engine.html' || url === '/viewer-tests.html') {
			res.setHeader('Content-Type', 'text/html');
			return res.end('<!doctype html><script type="importmap">{"imports":{"pdfjs-lib":"/upstream/src/pdf.js","web-null_l10n":"/upstream/web/l10n.js","display-node_utils":"/upstream/src/display/stubs.js","display-binary_data_factory":"/upstream/src/display/binary_data_factory.js","display-network_stream":"/upstream/src/display/network_stream.js"}}</script><body>PDF.js upgrade tests</body>');
		}
		const file = url === '/jasmine.js' ? jasmine : url.startsWith('/upstream/')
			? path.join(upstream, url.slice(10)) : path.join(root, url);
		if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
		res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm' })[path.extname(file)] || 'application/octet-stream');
		fs.createReadStream(file).pipe(res);
	});
	await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
	let browser;
	try {
		browser = await chromium.launch({ executablePath: process.env.BOOX_TEST_BROWSER, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
		const origin = 'http://127.0.0.1:' + server.address().port;
		const page = await browser.newPage();
		page.setDefaultTimeout(60000);
		const errors = [];
		page.on('pageerror', e => errors.push(e.stack));
		await page.goto(origin + '/viewer-tests.html');
		await page.addScriptTag({ url: origin + '/jasmine.js' });
		await page.evaluate(async () => {
			const core = jasmineRequire.core(jasmineRequire), env = core.getEnv();
			window.jasmine = core;
			Object.assign(window, jasmineRequire.interface(core, env));
			window.specs = [];
			env.configure({ random: false });
			env.addReporter({ specDone: spec => window.specs.push({ name: spec.fullName, status: spec.status, failures: spec.failedExpectations.map(f => f.message) }), jasmineDone: result => { window.result = result.overallStatus; } });
			await import('/upstream/test/unit/pdf_viewer_spec.js');
			env.execute();
		});
		await page.waitForFunction(() => window.result);
		const viewer = await page.evaluate(() => ({ status: window.result, specs: window.specs }));
		assert.equal(viewer.status, 'passed', JSON.stringify(viewer));
		assert.ok(viewer.specs.length >= 10);
		assert.ok(viewer.specs.every(s => s.status === 'passed'), JSON.stringify(viewer));
		console.log('PASS ' + viewer.specs.length + ' official viewer tests: canvas replacement, cancellation, selection/focus, detail views and thumbnails');

		await page.goto(origin + '/engine.html');
		const actual = await page.evaluate(async () => {
			const api = await import('/pdf/build/pdf.mjs');
			api.GlobalWorkerOptions.workerSrc = '/pdf/build/pdf.worker.mjs';
			const reports = [];
			for (const fixture of ['basic', 'embedded']) {
				const task = api.getDocument({ url: '/' + fixture + '.pdf', standardFontDataUrl: '/pdf/web/standard_fonts/', fontExtraProperties: true });
				try {
					const doc = await task.promise, pdfPage = await doc.getPage(1);
					const content = await pdfPage.getTextContent();
					const fontId = content.items.find(item => item.str.includes('ABC')).fontName;
					for (const theme of [null, { background: '#2e3440', foreground: '#d8dee9' }]) {
						window.theme = theme;
						const viewport = pdfPage.getViewport({ scale: 3 });
						const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
						const regions = [{ rect: [18, 64, 38, 100], color: '#245e91' }];
						const render = pdfPage.render({ canvas, viewport, textColorRegions: regions });
						await render.promise;
						const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
						const ink = theme ? [143, 204, 255] : [36, 94, 145];
						let count = 0;
						for (let i = 0; i < pixels.length; i += 4) if (ink.every((v, j) => pixels[i + j] === v)) count++;
						const font = pdfPage.commonObjs.get(fontId);
						reports.push({ fixture, dark: !!theme, colored: render.coloredTextRegions, count, embeddedBytes: font.data?.length || 0, bold: !!font.bold, italic: !!font.italic, disabled: !!font.disableFontFace });
					}
				} finally { await task.destroy(); }
			}
			delete window.theme;
			return { version: api.version, build: api.build, reports };
		});
		assert.equal(actual.version, pin.version); assert.equal(actual.build, pin.build);
		for (const report of actual.reports) {
			assert.ok(report.count > 100, JSON.stringify(report));
			assert.equal(report.colored.length, 1, JSON.stringify(report));
			assert.equal(report.disabled, false, JSON.stringify(report));
			if (report.fixture === 'embedded') {
				assert.ok(report.embeddedBytes > 1000, JSON.stringify(report));
				assert.equal(report.bold, false, 'Embedded fonts must not receive synthetic bold');
				assert.equal(report.italic, false, 'Embedded fonts must not receive synthetic italic');
			}
		}
		assert.deepEqual(errors, []);
		console.log('PASS bundled PDF.js ' + actual.version + '/' + actual.build + ': real worker, embedded bold/italic font, native glyph coloring in light and dark themes');
	} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
