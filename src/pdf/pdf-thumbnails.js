/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @typedef {import("./interfaces").IL10n} IL10n */
/** @typedef {import("./interfaces").IPDFLinkService} IPDFLinkService */
/** @typedef {import("./interfaces").IRenderableView} IRenderableView */
// eslint-disable-next-line max-len

/** @typedef {import("./pdf_rendering_queue").PDFRenderingQueue} PDFRenderingQueue */

// import { OutputScale, RenderingStates } from "./ui_utils.js";
// import { RenderingCancelledException } from "pdfjs-lib";

const DRAW_UPSCALE_FACTOR = 2; // See comment in `PDFThumbnailView.draw` below.
const MAX_NUM_SCALING_STEPS = 3;
const THUMBNAIL_WIDTH = 120; // px

function getThumbnailDimensions({ width, height }, { maxWidth, maxHeight } = {}) {
	if (maxWidth === undefined && maxHeight === undefined) {
		maxWidth = THUMBNAIL_WIDTH;
        maxHeight = 480;
	}
	const scale = Math.min(
		maxWidth === undefined ? Infinity : maxWidth / width,
		maxHeight === undefined ? Infinity : maxHeight / height
	);
	return {
		width: Math.max(1, Math.floor(width * scale)),
		height: Math.max(1, Math.floor(height * scale)),
		scale,
	};
}


/**
 * Scale factors for the canvas, necessary with HiDPI displays.
 */
class OutputScale {
	constructor() {
		const pixelRatio = Math.min(2, window.devicePixelRatio || 1);

		/**
		 * @type {number} Horizontal scale.
		 */
		this.sx = pixelRatio;

		/**
		 * @type {number} Vertical scale.
		 */
		this.sy = pixelRatio;
	}

	/**
	 * @type {boolean} Returns `true` when scaling is required, `false` otherwise.
	 */
	get scaled() {
		return this.sx !== 1 || this.sy !== 1;
	}
}

class TempImageFactory {
	static #tempCanvas = null;

	static getCanvas(width, height, iframeWindow) {
		const tempCanvas = (this.#tempCanvas ||= iframeWindow.document.createElement("canvas"));
		tempCanvas.width = width;
		tempCanvas.height = height;

		// Since this is a temporary canvas, we need to fill it with a white
		// background ourselves. `_getPageDrawContext` uses CSS rules for this.
		const ctx = tempCanvas.getContext("2d", { alpha: false });
		ctx.save();
		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.fillRect(0, 0, width, height);
		ctx.restore();
		return [tempCanvas, tempCanvas.getContext("2d")];
	}

	static destroyCanvas() {
		const tempCanvas = this.#tempCanvas;
		if (tempCanvas) {
			// Zeroing the width and height causes Firefox to release graphics
			// resources immediately, which can greatly reduce memory consumption.
			tempCanvas.width = 0;
			tempCanvas.height = 0;
		}
		this.#tempCanvas = null;
	}
}

/**
 * @implements {IRenderableView}
 */


class PDFThumbnails {
	constructor(options) {
		this._pdfView = options.pdfView;
		this._onInit = options.onInit || options.onUpdate;
		this._onUpdate = options.onUpdate;
		this._onRender = options.onRender;
		this._window = options.window;
		this._thumbnails = [];
		this._renderOptions = [];
        this._epoch = 0;
        this._documentID = Date.now().toString(36) + Math.random().toString(36).slice(2);
		this._initialized = false;
        this._pending = new Map();
        this._runningJob = null;
		this._init();
	}

	async _init() {
		let { pdfDocument } = this._window.PDFViewerApplication;

		let firstPdfPage = await pdfDocument.getPage(1);

		let pagesCount = pdfDocument.numPages;
		let defaultViewport = firstPdfPage.getViewport({ scale: 1 });
		let { width, height } = getThumbnailDimensions(defaultViewport);

		for (let pageNum = 1; pageNum <= pagesCount; ++pageNum) {
			this._thumbnails.push({
				pageIndex: pageNum - 1,
                renderKey: this.renderKey,
				width,
				height
			});
		}
		this._onInit(this._thumbnails);
	}

    get renderKey() { return this._documentID + ':' + this._epoch; }

	async _render(pageIndex, options) {
        const epoch = this._epoch;
        const colorScheme = this._pdfView._colorScheme;
        const renderKey = this.renderKey;
		let { pdfDocument } = this._window.PDFViewerApplication;

		let pdfPage = await pdfDocument.getPage(pageIndex + 1);
		if (epoch !== this._epoch) return;
		let viewport = pdfPage.getViewport({ scale: 1 });
		let { width: canvasWidth, height: canvasHeight, scale }
			= getThumbnailDimensions(viewport, options);

		let thumbnail = this._thumbnails[pageIndex];
		if (thumbnail?.image && !thumbnail.forceRerender
				&& thumbnail.width === canvasWidth
				&& thumbnail.height === canvasHeight) {
			if (this._onRender) {
				this._onRender(thumbnail);
			}
			return;
		}

		// Render the thumbnail at a larger size and downsize the canvas (similar
		// to `setImage`), to improve consistency between thumbnails created by
		// the `draw` and `setImage` methods (fixes issue 8233).
		// NOTE: To primarily avoid increasing memory usage too much, but also to
		//   reduce downsizing overhead, we purposely limit the up-scaling factor.
		const { ctx, canvas, transform } = this._getPageDrawContext(DRAW_UPSCALE_FACTOR, canvasWidth, canvasHeight);

		const drawViewport = pdfPage.getViewport({
			scale: DRAW_UPSCALE_FACTOR * scale,
		});

		const renderContext = {
			canvasContext: ctx,
			transform,
			background: this._window.theme?.background || "#FFFFFF",
			viewport: drawViewport
		};
		const renderTask = pdfPage.render(renderContext);

		let renderedThumbnail;
		try {
			await renderTask.promise;
		}
		catch (e) {
			console.log(e);
		}
		finally {
            if (epoch !== this._epoch) { canvas.width = canvas.height = 0; return; }
			canvas.readerBookmarkFlags = true;
			await this._pdfView.renderPageAnnotationsOnCanvas(canvas, drawViewport, pageIndex);
            if (epoch !== this._epoch) { canvas.width = canvas.height = 0; return; }
			const reducedCanvas = this._reduceImage(canvas, canvasWidth, canvasHeight);
			renderedThumbnail = {
				pageIndex,
				width: canvasWidth,
				height: canvasHeight,
				image: reducedCanvas.toDataURL(),
                renderKey, colorScheme
			};
			this._thumbnails = this._thumbnails.slice();
			this._thumbnails[pageIndex] = renderedThumbnail;
			this._renderOptions[pageIndex] = options;

			// Zeroing the width and height causes Firefox to release graphics
			// resources immediately, which can greatly reduce memory consumption.
			canvas.width = 0;
			canvas.height = 0;

			this._window.PDFViewerApplication.eventBus.dispatch("thumbnailrendered", {
				source: this,
				pageNumber: this.id,
				pdfPage: this.pdfPage,
			});
		}
		if (this._onRender && renderedThumbnail) {
			this._onRender(renderedThumbnail);
		}
		else {
			this._onUpdate(this._thumbnails);
		}
	}

	render(pageIndexes = [], options) {
		return this._queueRender(pageIndexes, options);
	}

	rerender(pageIndexes = []) {
		return this._queueRender(pageIndexes, undefined, true);
	}

    _queueRender(pageIndexes, options, rerenderOnly = false) {
        for (const pageIndex of pageIndexes) {
            const thumbnail = this._thumbnails[pageIndex];
            if (!thumbnail || rerenderOnly && !thumbnail.image) continue;
            if (rerenderOnly) thumbnail.forceRerender = true;
            const pageOptions = rerenderOnly ? this._renderOptions[pageIndex] : options;
            if (!rerenderOnly && this._runningJob?.pageIndex === pageIndex
                && JSON.stringify(this._runningJob.options) === JSON.stringify(pageOptions)) continue;
            this._pending.delete(pageIndex);
            this._pending.set(pageIndex, { pageIndex, options: pageOptions });
        }
        while (this._pending.size > 32) {
            const index = this._pending.keys().next().value;
            this._pending.delete(index);
            this._onRender?.({ pageIndex: index, renderKey: this.renderKey, colorScheme: this._pdfView._colorScheme, canceled: true });
        }
        return this._drain();
    }

    async _drain() {
        if (this._runningJob) return;
        while (this._pending.size) {
            const index = [...this._pending.keys()].at(-1);
            const job = this._pending.get(index);
            this._pending.delete(index);
            this._runningJob = job;
            try { await this._render(job.pageIndex, job.options); }
            catch (error) {
                console.error(error);
                this._onRender?.({ pageIndex: index, renderKey: this.renderKey, colorScheme: this._pdfView._colorScheme, canceled: true });
            } finally { this._runningJob = null; }
        }
    }

	clear() {
        this._epoch++;
		this._pending.clear();
		this._thumbnails = this._thumbnails.map(x => ({ ...x, image: undefined, renderKey: this.renderKey }));
		this._renderOptions = [];
		this._onInit(this._thumbnails);
	}

	_getPageDrawContext(upscaleFactor = 1, canvasWidth, canvasHeight) {
		// Keep the no-thumbnail outline visible, i.e. `data-loaded === false`,
		// until rendering/image conversion is complete, to avoid display issues.
		const canvas = this._window.document.createElement("canvas");
		const ctx = canvas.getContext("2d", { alpha: false });
		const outputScale = new OutputScale();

		canvas.width = (upscaleFactor * canvasWidth * outputScale.sx) | 0;
		canvas.height = (upscaleFactor * canvasHeight * outputScale.sy) | 0;

		const transform = outputScale.scaled ? [outputScale.sx, 0, 0, outputScale.sy, 0, 0] : null;

		return { ctx, canvas, transform };
	}

	_reduceImage(img, canvasWidth, canvasHeight) {
		const { ctx, canvas } = this._getPageDrawContext(1, canvasWidth, canvasHeight);

		if (img.width <= 2 * canvas.width) {
			ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
			return canvas;
		}
		// drawImage does an awful job of rescaling the image, doing it gradually.
		let reducedWidth = canvas.width << MAX_NUM_SCALING_STEPS;
		let reducedHeight = canvas.height << MAX_NUM_SCALING_STEPS;
		const [reducedImage, reducedImageCtx] = TempImageFactory.getCanvas(reducedWidth, reducedHeight, this._window);

		while (reducedWidth > img.width || reducedHeight > img.height) {
			reducedWidth >>= 1;
			reducedHeight >>= 1;
		}
		reducedImageCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, reducedWidth, reducedHeight);
		while (reducedWidth > 2 * canvas.width) {
			reducedImageCtx.drawImage(reducedImage, 0, 0, reducedWidth, reducedHeight, 0, 0, reducedWidth >> 1, reducedHeight >> 1);
			reducedWidth >>= 1;
			reducedHeight >>= 1;
		}
		ctx.drawImage(reducedImage, 0, 0, reducedWidth, reducedHeight, 0, 0, canvas.width, canvas.height);
		return canvas;
	}
}

export { getThumbnailDimensions, PDFThumbnails };
