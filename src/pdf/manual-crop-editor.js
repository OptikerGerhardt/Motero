import { cropForPage, dragCrop, normalizeCrops, updateCrop } from './manual-crop.mjs';
import { rotateReadingBounds } from './reading-layout.mjs';

/** Separate full-page preview: reader zoom, PDF coordinates and annotations remain independent. */
export class ManualCropEditor {
	constructor(fitting) {
		this.fitting = fitting;
		this.view = fitting.view;
		this.win = fitting.win;
		this.viewer = fitting.viewer;
		this.index = this.viewer.currentPageNumber - 1;
		this.rotation = this.viewer.pagesRotation;
		this.crops = normalizeCrops(fitting.options.manualCrop);
		this.scope = 'all';
		this.drafts = {};
		this.token = 0;
		let doc = this.win.document;
		this.root = doc.createElement('div');
		this.root.className = 'boox-manual-crop';
		this.root.setAttribute('role', 'dialog');
		this.root.setAttribute('aria-modal', 'true');
		this.root.setAttribute('aria-label', 'Manueller Zuschnitt');
		this.root.innerHTML = `<style>
.boox-manual-crop{position:fixed;inset:0;z-index:2147483647;background:#fff;color:#111;display:flex;flex-direction:column;font:16px sans-serif;overflow:auto;box-sizing:border-box;padding:12px;gap:8px}
.boox-manual-crop *{box-sizing:border-box}.boox-manual-crop .crop-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.boox-manual-crop button,.boox-manual-crop select{font:inherit;color:#111;background:#fff;border:1px solid #444;border-radius:4px;min-height:44px;padding:8px}
.boox-manual-crop button:focus-visible,.boox-manual-crop select:focus-visible{outline:3px solid #111}
.boox-manual-crop button:disabled{color:#777}.boox-manual-crop .crop-preview{flex:1;min-height:160px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#ddd}
.boox-manual-crop .crop-sheet{position:relative;max-width:100%;max-height:100%;touch-action:none;user-select:none}
.boox-manual-crop canvas{display:block;width:100%;height:100%}.boox-manual-crop .crop-selection{position:absolute;border:2px solid #111;box-shadow:0 0 0 2000px #0005;touch-action:none;cursor:move}
.boox-manual-crop .crop-handle{position:absolute;width:30px;height:30px;background:#fff;border:2px solid #111;border-radius:50%;touch-action:none}
.boox-manual-crop [data-handle=nw]{left:-15px;top:-15px;cursor:nw-resize}.boox-manual-crop [data-handle=ne]{right:-15px;top:-15px;cursor:ne-resize}
.boox-manual-crop [data-handle=sw]{left:-15px;bottom:-15px;cursor:sw-resize}.boox-manual-crop [data-handle=se]{right:-15px;bottom:-15px;cursor:se-resize}
</style><strong>Manueller Zuschnitt</strong><div class="crop-toolbar"><label>Gilt für <select aria-label="Seitenbereich"><option value="all">Alle Seiten</option><option value="odd">Ungerade Seiten</option><option value="even">Gerade Seiten</option></select></label><button data-action="previous" aria-label="Vorherige Vorschauseite">‹</button><span class="crop-page"></span><button data-action="next" aria-label="Nächste Vorschauseite">›</button></div>
<div>Rahmen an den Ecken ziehen oder innen verschieben. Gerade/ungerade bezieht sich auf die PDF-Seite ab 1.</div>
<div class="crop-preview"><div class="crop-sheet"><canvas></canvas><div class="crop-selection" data-handle="move"><i class="crop-handle" data-handle="nw"></i><i class="crop-handle" data-handle="ne"></i><i class="crop-handle" data-handle="sw"></i><i class="crop-handle" data-handle="se"></i></div></div></div>
<div class="crop-status" role="status"></div><div class="crop-toolbar"><button data-action="automatic">Automatisch (alle zurücksetzen)</button><button data-action="cancel">Abbrechen</button><button data-action="save">Zuschnitt übernehmen</button></div>`;
		doc.body.append(this.root);
		this.beforeFocus = doc.activeElement;
		this.sheet = this.root.querySelector('.crop-sheet');
		this.canvas = this.root.querySelector('canvas');
		this.selection = this.root.querySelector('.crop-selection');
		this.select = this.root.querySelector('select');
		this.select.onchange = () => {
			this.scope = this.select.value;
			let parity = this.scope === 'odd' ? 0 : 1;
			if (this.scope !== 'all' && this.index % 2 !== parity) {
				this.index = this.index + 1 < this.viewer.pdfDocument.numPages ? this.index + 1 : this.index - 1;
			}
			this.load();
		};
		if (this.viewer.pdfDocument.numPages < 2) this.select.querySelector('[value=even]').disabled = true;
		this.root.querySelector('[data-action=previous]').onclick = () => this.changePage(-1);
		this.root.querySelector('[data-action=next]').onclick = () => this.changePage(1);
		this.root.querySelector('[data-action=cancel]').onclick = () => this.close();
		this.root.querySelector('[data-action=automatic]').onclick = () => this.save(true);
		this.root.querySelector('[data-action=save]').onclick = () => this.save(false);
		this.sheet.onpointerdown = event => this.down(event);
		this.sheet.onpointermove = event => this.move(event);
		this.sheet.onpointerup = event => this.up(event);
		this.sheet.onpointercancel = event => { if (this.drag?.id === event.pointerId) { this.rect = this.drag.rect; this.draw(); this.drag = null; } };
		this.keydown = event => { if (event.key === 'Escape') { event.preventDefault(); this.close(); } };
		this.root.addEventListener('keydown', this.keydown);
		this.resize = new this.win.ResizeObserver(() => this.sizePreview());
		this.resize.observe(this.root.querySelector('.crop-preview'));
		this.select.focus();
		this.load();
	}
	changePage(direction) {
		let next = this.index + direction * (this.scope === 'all' ? 1 : 2);
		if (next >= 0 && next < this.viewer.pdfDocument.numPages) { this.index = next; this.load(); }
	}
	setBusy(value) {
		this.busy = value;
		this.root.querySelector('[data-action=save]').disabled = value;
	}
	async load() {
		let token = ++this.token;
		this.drag = null;
		this.setBusy(true);
		this.renderTask?.cancel();
		let step = this.scope === 'all' ? 1 : 2;
		this.root.querySelector('[data-action=previous]').disabled = this.index - step < 0;
		this.root.querySelector('[data-action=next]').disabled = this.index + step >= this.viewer.pdfDocument.numPages;
		this.root.querySelector('.crop-page').textContent = `PDF-Seite ${this.index + 1} / ${this.viewer.pdfDocument.numPages}`;
		this.root.querySelector('.crop-status').textContent = 'Vorschau wird geladen…';
		try {
			// A new canvas prevents a cancelled PDF.js render from competing with a newer one.
			let page = await this.viewer.pdfDocument.getPage(this.index + 1);
			if (token !== this.token || this.closed) return;
			let natural = page.getViewport({ scale: 1, rotation: page.rotate + this.rotation });
			this.aspect = natural.width / natural.height;
			let viewport = page.getViewport({ scale: Math.min(2, 1200 / natural.width), rotation: page.rotate + this.rotation });
			let canvas = this.win.document.createElement('canvas');
			canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
			this.canvas.replaceWith(canvas); this.canvas = canvas;
			let ctx = canvas.getContext('2d', { alpha: false });
			this.renderTask = page.render({ canvasContext: ctx, viewport, annotationMode: 0 });
			await this.renderTask.promise;
			if (token !== this.token || this.closed) return;
			let bounds = this.drafts[this.scope] || (this.scope === 'all' ? cropForPage(this.crops, this.index)
				: this.crops[this.scope] || cropForPage(this.crops, this.index));
			if (!bounds) {
				// Start with the existing automatic reading bounds when no manual crop exists.
				bounds = rotateReadingBounds(await this.fitting.boundsFor(this.index), -this.viewer.pagesRotation);
			}
			if (token !== this.token || this.closed) return;
			this.rect = rotateReadingBounds(bounds, this.rotation);
			this.sizePreview(); this.draw(); this.setBusy(false);
			this.root.querySelector('.crop-status').textContent = 'Nur die Ansicht dieses Dokuments wird geändert.';
		}
		catch (error) {
			if (token !== this.token || this.closed || error.name === 'RenderingCancelledException') return;
			this.root.querySelector('.crop-status').textContent = 'Vorschau konnte nicht geladen werden. Bitte erneut versuchen.';
			console.error(error);
		}
	}
	sizePreview() {
		if (!this.aspect || this.closed) return;
		let box = this.root.querySelector('.crop-preview');
		let width = Math.max(1, Math.min(box.clientWidth - 32, (box.clientHeight - 32) * this.aspect));
		this.sheet.style.width = width + 'px';
		this.sheet.style.height = width / this.aspect + 'px';
	}
	draw() {
		if (!this.rect) return;
		let [x0, y0, x1, y1] = this.rect;
		Object.assign(this.selection.style, { left: x0 * 100 + '%', top: y0 * 100 + '%', width: (x1 - x0) * 100 + '%', height: (y1 - y0) * 100 + '%' });
	}
	down(event) {
		if (this.busy || event.isPrimary === false || event.button !== 0 || this.drag) return;
		let handle = event.target.closest('[data-handle]')?.dataset.handle;
		if (!handle) return;
		event.preventDefault();
		this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, rect: [...this.rect], handle, box: this.sheet.getBoundingClientRect() };
		this.sheet.setPointerCapture(event.pointerId);
	}
	move(event) {
		if (!this.drag || event.pointerId !== this.drag.id) return;
		event.preventDefault();
		let { rect, handle, x, y, box } = this.drag;
		this.rect = dragCrop(rect, handle, (event.clientX - x) / box.width, (event.clientY - y) / box.height);
		this.draw();
	}
	up(event) {
		if (this.drag?.id !== event.pointerId) return;
		this.move(event); this.drafts[this.scope] = rotateReadingBounds(this.rect, -this.rotation); this.drag = null;
		if (this.sheet.hasPointerCapture(event.pointerId)) this.sheet.releasePointerCapture(event.pointerId);
	}
	async save(automatic) {
		if (this.saving || this.busy && !automatic) return;
		this.saving = true;
		let options = { ...this.fitting.options,
			manualCrop: automatic ? {} : updateCrop(this.crops, this.scope, rotateReadingBounds(this.rect, -this.rotation)),
			revision: (this.fitting.options.revision || 0) + 1 };
		if (!automatic) { options.mode = 'content'; options.reference = 'content'; }
		// Notify Android before the asynchronous fit, so navigation/reopen cannot lose the crop.
		this.view._options.onManualCropChanged?.({ crop: options.manualCrop, enable: !automatic, revision: options.revision });
		this.close();
		if (!automatic) this.viewer.spreadMode = 0;
		await this.fitting.configure(options);
	}
	close() {
		if (this.closed) return;
		this.closed = true; ++this.token; this.renderTask?.cancel(); this.resize.disconnect();
		this.canvas.width = this.canvas.height = 0;
		this.root.remove();
		this.beforeFocus?.focus?.();
		if (this.fitting.editor === this) this.fitting.editor = null;
	}
}
