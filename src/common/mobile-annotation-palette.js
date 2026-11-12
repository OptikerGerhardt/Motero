import highlightIcon from '!!raw-loader!../../res/icons/16/annotate-highlight.svg';
import underlineIcon from '!!raw-loader!../../res/icons/16/annotate-underline.svg';
import { ANNOTATION_COLORS } from './defines';

// Shared PDF/EPUB quick palette; geometry and persistence are supplied by the host.
export function showAnnotationPalette(annotations) {
		this.closePalette();
		annotations = annotations.filter(a => !a.readOnly && !a.isExternal);
		if (!annotations.length || this.view._readOnly) return;
		let box = this.doc.createElement('div');
		box.className = 'boox-highlight-palette';
		box.setAttribute('role', 'toolbar');
		box.setAttribute('aria-label', this.de ? 'Markierung' : 'Annotation');
		// Use the original Zotero theme tokens, including the outer Android host's dark scheme.
		let theme = this.win.parent.getComputedStyle(this.win.parent.document.documentElement);
		for (let name of ['--color-background', '--fill-primary', '--fill-quinary', '--color-border', '--accent-blue']) {
			let value = theme.getPropertyValue(name); if (value) box.style.setProperty(name, value);
		}
		box.style.cssText += 'position:fixed;z-index:2147483647;isolation:isolate;mix-blend-mode:normal;pointer-events:auto;display:flex;flex-direction:column;padding:0;max-width:calc(100vw - 12px);background:var(--color-background,#fff);color:var(--fill-primary,#222);border-radius:6px;box-shadow:0 2px 10px #0002,0 0 0 1px var(--color-border,#ddd);box-sizing:border-box;';
		for (let event of ['pointerdown', 'pointerup', 'mousedown', 'touchstart', 'touchend']) box.addEventListener(event, e => e.stopPropagation());
		let colors = this.doc.createElement('div');
		colors.style.cssText = 'display:flex;overflow-x:auto;max-width:100%;padding:4px;box-sizing:border-box;';
		let labels = this.de ? ['Gelb', 'Rot', 'Grün', 'Blau', 'Violett', 'Magenta', 'Orange', 'Grau']
			: ['Yellow', 'Red', 'Green', 'Blue', 'Purple', 'Magenta', 'Orange', 'Gray'];
		ANNOTATION_COLORS.forEach(([, color], index) => {
			let button = this.doc.createElement('button');
			button.type = 'button'; button.dataset.color = color;
			button.setAttribute('aria-label', labels[index]);
			button.setAttribute('aria-pressed', String(annotations[0].color === color));
			button.style.cssText = 'display:flex;align-items:center;justify-content:center;flex:0 0 38px;width:38px;height:40px;border:0;border-radius:50%;background:transparent;padding:0;';
			let circle = this.doc.createElement('span');
			circle.style.cssText = `display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${color};color:#111;font:18px sans-serif;`;
			// Match the native annotation popup: a white ring inside the color.
            if (annotations[0].color === color) circle.style.boxShadow = `inset 0 0 0 2px ${color}, inset 0 0 0 4px white`;
            button.append(circle);
			button.addEventListener('click', event => {
				event.preventDefault(); event.stopPropagation();
				let ids = new Set(annotations.map(a => a.id));
				let current = this.view._annotations.filter(a => ids.has(a.id) && !a.readOnly);
				if (!this.view._readOnly && current.length) this.view._onUpdateAnnotations(current.map(a => ({ id: a.id, color })));
				this.closePalette();
			});
			colors.append(button);
		});
		box.append(colors);
		let tools = this.doc.createElement('div');
		tools.style.cssText = 'display:flex;align-items:stretch;width:100%;border-top:1px solid var(--color-border,#ddd);box-sizing:border-box;';
		for (let [type, icon, label] of [['highlight', highlightIcon, this.de ? 'Hervorheben' : 'Highlight'], ['delete', '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2.5" y="2.5" width="15" height="15" rx="3"/><path d="M7 7l6 6m0-6l-6 6"/></svg>', this.de ? 'Markierung löschen' : 'Delete annotation'], ['underline', underlineIcon, this.de ? 'Unterstreichen' : 'Underline']]) {
			let button = this.doc.createElement('button'); button.type = 'button'; button.dataset.type = type;
			button.setAttribute('aria-label', label);
			if (type !== 'delete') button.setAttribute('aria-pressed', String(annotations[0].type === type));
			button.disabled = type !== 'delete' && !annotations.every(a => ['highlight','underline'].includes(a.type));
			button.style.cssText = `display:flex;align-items:center;justify-content:center;flex:1 1 0;min-width:0;height:44px;padding:0;border:0;color:inherit;background:${annotations[0].type === type ? 'var(--fill-quinary,#0001)' : 'transparent'};`;
			button.style.borderRadius = type === 'highlight' ? '0 0 0 6px' : type === 'underline' ? '0 0 6px 0' : '0';
			if (button.disabled) button.style.opacity = '0.4';
			button.innerHTML = icon; let svg = button.querySelector('svg'); svg.style.width = svg.style.height = '20px';
			button.addEventListener('click', event => {
				event.preventDefault(); event.stopPropagation();
				if (this.view._readOnly) return;
				let ids = annotations.filter(a => !a.readOnly && !a.isExternal && this.view._annotations.some(x => x.id === a.id && !x.readOnly && !x.isExternal)).map(a => a.id);
				if (!ids.length) return;
				if (type === 'delete') {
					this.closePalette();
					this.view._onSelectAnnotations([]); this.view._onSetAnnotationPopup(null);
					this.view._directHighlight?.reset();
					this.view._onDeleteAnnotationsFromPalette(ids);
					return;
				}
				this.view._directHighlightType = type;
				let converted = this.view._onConvertAnnotations(ids, type);
				this.showPalette(converted);
			});
			tools.append(button);
		}
		box.append(tools);
		this.doc.documentElement.append(box); this.palette = box;
		let rect = this.view.getClientRectForPopup(annotations.at(-1).position);
		let width = box.offsetWidth, height = box.offsetHeight;
		let below = rect[3] + height + 10 < this.win.innerHeight;
		let left = Math.max(6, Math.min((rect[0] + rect[2] - width) / 2, this.win.innerWidth - width - 6));
		box.style.left = left + 'px';
		box.style.top = (below ? rect[3] + 8 : Math.max(6, rect[1] - height - 8)) + 'px';
		let arrow = this.doc.createElement('span'); arrow.className = 'boox-palette-arrow';
		arrow.style.cssText = `position:absolute;width:10px;height:10px;left:${Math.max(8, Math.min(width - 18, (rect[0] + rect[2]) / 2 - left - 5))}px;${below ? 'top:-5px' : 'bottom:-5px'};background:var(--color-background,#fff);transform:rotate(45deg);pointer-events:none;`;
		box.append(arrow);
	}
