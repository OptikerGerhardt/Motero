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
		const de = (doc.documentElement.lang || navigator.language || '').startsWith('de');
		const t = de ? {
			title: 'Manueller Zuschnitt', scope: 'Seitenbereich', all: 'Alle Seiten', odd: 'Ungerade Seiten', even: 'Gerade Seiten',
			previous: 'Vorherige Vorschauseite', next: 'Nächste Vorschauseite', cancel: 'Abbrechen', save: 'Übernehmen',
			help: 'Ecken ziehen oder den Rahmen verschieben. Gerade/ungerade zählt ab PDF-Seite 1.',
			reset: 'Automatischen Zuschnitt verwenden', loading: 'Vorschau wird geladen…',
			status: 'Gilt nur für die Ansicht dieses Dokuments.', error: 'Vorschau konnte nicht geladen werden. Bitte erneut versuchen.', page: 'PDF-Seite'
		} : {
			title: 'Manual crop', scope: 'Page range', all: 'All pages', odd: 'Odd pages', even: 'Even pages',
			previous: 'Previous preview page', next: 'Next preview page', cancel: 'Cancel', save: 'Apply',
			help: 'Drag a corner or move the frame. Odd/even counts from PDF page 1.',
			reset: 'Use automatic crop', loading: 'Loading preview…', status: 'Changes only the view of this document.',
			error: 'Could not load the preview. Please try again.', page: 'PDF page'
		};
		this.labels = t;
		this.root.setAttribute('aria-label', t.title);
		const theme = this.win.parent.getComputedStyle(this.win.parent.document.documentElement);
		for (const name of ['--color-background', '--fill-primary', '--fill-secondary', '--fill-quinary', '--color-border', '--accent-blue']) {
			const value = theme.getPropertyValue(name); if (value) this.root.style.setProperty(name, value);
		}
		this.root.innerHTML = `<style>
.boox-manual-crop{position:fixed;inset:0;z-index:2147483647;background:var(--color-background,#fff);color:var(--fill-primary,#222);display:flex;flex-direction:column;font:15px system-ui,sans-serif;overflow:hidden;box-sizing:border-box;padding:12px;gap:12px}
.boox-manual-crop *{box-sizing:border-box}.boox-manual-crop .crop-toolbar{display:flex;align-items:center;gap:8px;flex-shrink:0}.boox-manual-crop .crop-heading{flex:1;font-size:17px;font-weight:600;margin:0}
.boox-manual-crop button,.boox-manual-crop select{font:inherit;color:var(--accent-blue,#3468d3);background:transparent;border:0;border-radius:8px;min-height:44px;padding:8px 12px;touch-action:manipulation}
.boox-manual-crop button:focus-visible,.boox-manual-crop select:focus-visible{outline:2px solid var(--accent-blue,#3468d3);outline-offset:2px}
.boox-manual-crop button:disabled{opacity:.4}.boox-manual-crop button[data-action=save]{background:var(--accent-blue,#3468d3);color:#fff;font-weight:600}.boox-manual-crop select{color:inherit;background:var(--fill-quinary,#eee);min-width:0;max-width:100%}
.boox-manual-crop .crop-range{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.boox-manual-crop .crop-pages{display:flex;align-items:center;gap:4px}.boox-manual-crop .crop-page{font-variant-numeric:tabular-nums;font-size:13px;white-space:nowrap}
.boox-manual-crop .crop-help,.boox-manual-crop .crop-status{font-size:13px;color:var(--fill-secondary,#666);line-height:1.35;flex-shrink:0}.boox-manual-crop .crop-preview{flex:1;min-height:100px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--fill-quinary,#eee);border-radius:10px}
.boox-manual-crop .crop-sheet{position:relative;max-width:100%;max-height:100%;touch-action:none;user-select:none}.boox-manual-crop canvas{display:block;width:100%;height:100%}
.boox-manual-crop .crop-selection{position:absolute;border:2px solid var(--accent-blue,#3468d3);box-shadow:0 0 0 2000px #0005;touch-action:none;cursor:move}
.boox-manual-crop .crop-handle{position:absolute;width:28px;height:28px;background:#fff;border:2px solid var(--accent-blue,#3468d3);border-radius:50%;touch-action:none}
.boox-manual-crop [data-handle=nw]{left:-14px;top:-14px;cursor:nw-resize}.boox-manual-crop [data-handle=ne]{right:-14px;top:-14px;cursor:ne-resize}.boox-manual-crop [data-handle=sw]{left:-14px;bottom:-14px;cursor:sw-resize}.boox-manual-crop [data-handle=se]{right:-14px;bottom:-14px;cursor:se-resize}
.boox-manual-crop .crop-footer{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;padding-bottom:env(safe-area-inset-bottom,0px)}
@media(max-height:450px){.boox-manual-crop{gap:4px;padding:6px 12px}.boox-manual-crop .crop-help,.boox-manual-crop .crop-status{display:none}.boox-manual-crop .crop-footer{position:absolute;bottom:8px;right:12px}.boox-manual-crop .crop-footer button{background:var(--color-background,#fff)}}
</style>
<div class="crop-toolbar"><button data-action="cancel">${t.cancel}</button><h1 class="crop-heading">${t.title}</h1><button data-action="save">${t.save}</button></div>
<div class="crop-range"><select aria-label="${t.scope}"><option value="all">${t.all}</option><option value="odd">${t.odd}</option><option value="even">${t.even}</option></select><div class="crop-pages"><button data-action="previous" aria-label="${t.previous}">‹</button><span class="crop-page"></span><button data-action="next" aria-label="${t.next}">›</button></div></div>
<div class="crop-help">${t.help}</div>
<div class="crop-preview"><div class="crop-sheet"><canvas></canvas><div class="crop-selection" data-handle="move"><i class="crop-handle" data-handle="nw"></i><i class="crop-handle" data-handle="ne"></i><i class="crop-handle" data-handle="sw"></i><i class="crop-handle" data-handle="se"></i></div></div></div>
<div class="crop-footer"><div class="crop-status" role="status"></div><button data-action="automatic">${t.reset}</button></div>`;
		doc.body.append(this.root);
		this.beforeFocus = doc.activeElement;
		this.view._options.onCropEditorChanged?.(true);
		this.view._clearPointerAction?.();
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
		this.root.querySelector('.crop-page').textContent = `${this.labels.page} ${this.index + 1} / ${this.viewer.pdfDocument.numPages}`;
		this.root.querySelector('.crop-status').textContent = this.labels.loading;
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
			this.root.querySelector('.crop-status').textContent = this.labels.status;
		}
		catch (error) {
			if (token !== this.token || this.closed || error.name === 'RenderingCancelledException') return;
			this.root.querySelector('.crop-status').textContent = this.labels.error;
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
		let crops = this.crops;
		if (!automatic) {
			// Preserve edits to both parity tabs made during the same session.
			for (const scope of ['all', 'odd', 'even']) {
				if (this.drafts[scope]) crops = updateCrop(crops, scope, this.drafts[scope]);
			}
			crops = updateCrop(crops, this.scope, rotateReadingBounds(this.rect, -this.rotation));
		}
		let options = { ...this.fitting.options,
			manualCrop: automatic ? {} : crops,
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
		this.view._options.onCropEditorChanged?.(false);
		this.beforeFocus?.focus?.();
		if (this.fitting.editor === this) this.fitting.editor = null;
	}
}
