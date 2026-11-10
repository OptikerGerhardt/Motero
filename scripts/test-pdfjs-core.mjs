// Run upstream pixel/contrast tests against the exact Android bundle, not a
// separately rebuilt engine. Node has no FontFaceSet; the adapter registers the
// PDF's actual embedded font in Skia for the upstream native-text test.
import { registerHooks } from 'node:module';
import { DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';

Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });

registerHooks({
	resolve(specifier, context, nextResolve) {
		if (context.parentURL?.endsWith('/pdfjs/pdf.js/test/text_color_test.mjs')
			&& specifier === '../build/generic-legacy/build/pdf.mjs') {
			return { url: new URL('./pdfjs-node-adapter.mjs', import.meta.url).href, shortCircuit: true };
		}
		return nextResolve(specifier, context);
	}
});
await import('../pdfjs/pdf.js/test/text_color_test.mjs');
