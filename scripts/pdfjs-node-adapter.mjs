import { GlobalFonts } from '@napi-rs/canvas';
import { getDocument as loadDocument } from '../build/android/pdf/build/pdf.mjs';

export function getDocument(options) {
	// Keep font bytes until Skia can register them; production WebView registers
	// them through FontFace before PDF.js releases this buffer.
	const task = loadDocument({ ...options, fontExtraProperties: true });
	// Preserve real tasks, operator lists and rendering; only provide Node's
	// missing native-font registry, normally supplied by document.fonts in WebView.
	task.promise.then(doc => {
		const getPage = doc.getPage.bind(doc);
		const adapted = new WeakSet();
		doc.getPage = async (...args) => {
			const page = await getPage(...args);
			if (!adapted.has(page)) {
				adapted.add(page);
				const getOperatorList = page.getOperatorList.bind(page);
				page.getOperatorList = async (...params) => {
					const result = await getOperatorList(...params);
					for (const [, font] of page.commonObjs) {
						if (font?.data && font.loadedName) {
							if (!GlobalFonts.register(Buffer.from(font.data), font.loadedName)) {
								throw new Error('Cannot register embedded test font: ' + font.loadedName);
							}
						}
					}
					return result;
				};
			}
			return page;
		};
	});
	return task;
}
