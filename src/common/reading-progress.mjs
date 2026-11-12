// An overlay in the same document as the quick annotation palette. Its text
// and visibility never participate in EPUB pagination or the native viewport.
export class ReadingProgress {
    constructor(doc, cycle) {
        this.button = doc.createElement('button');
        const b = this.button;
        b.type = 'button';
        b.className = 'motero-reading-progress';
        b.setAttribute('aria-label', doc.defaultView.navigator.language.startsWith('de')
            ? 'Lesefortschritt umschalten' : 'Change reading progress');
        b.style.cssText = 'position:fixed;inset:auto 0 0;z-index:9000;box-sizing:border-box;width:100%;min-height:40px;margin:0;border:0;border-radius:0;padding:0;color:var(--text-color);background:var(--background-color);font:12px system-ui;text-align:center;touch-action:manipulation;pointer-events:auto;';
        // Native edge navigation and selection must never receive these taps.
        for (const name of ['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup']) {
            b.addEventListener(name, e => e.stopPropagation());
        }
        b.addEventListener('click', e => { e.stopPropagation(); cycle(); });
        doc.documentElement.append(b);
    }
    update({text = '', hidden = false, visible = true, bottomInset = 0} = {}) {
        const b = this.button, inset = Math.max(0, Number(bottomInset) || 0);
        b.textContent = hidden ? '' : text;
        b.hidden = !visible;
        b.style.display = visible ? 'block' : 'none';
        b.style.height = (40 + inset) + 'px';
        b.style.paddingBottom = inset + 'px';
        b.style.background = hidden ? 'transparent' : 'var(--background-color)';
    }
    destroy() { this.button.remove(); }
}
