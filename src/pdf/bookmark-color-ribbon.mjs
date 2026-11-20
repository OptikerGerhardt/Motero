import { readerIndicatorPosition } from '../common/reader-bookmark.mjs';

// Same order and exact hex values as Android AnnotationsConfig.allColors.
export const BOOKMARK_COLORS = Object.freeze([
    '#ffd400', '#ff6666', '#5fb236', '#2ea8e5', '#a28ae5',
    '#e56eee', '#f19837', '#aaaaaa', '#000000'
]);
export const BOOKMARK_LONG_PRESS_MS = 450;
export const BOOKMARK_MOVE_TOLERANCE = 8;

export function bookmarkRibbonDuration(eReader, reducedMotion = false) {
    return eReader || reducedMotion ? 0 : 180;
}

export function bookmarkPressMoved(press, event) {
    return Math.hypot(event.clientX - press.x, event.clientY - press.y) > BOOKMARK_MOVE_TOLERANCE;
}

// The top and right edges use the same safe viewport anchor as the existing
// corner flag. Only the flag body grows; short viewports scroll the swatches.
export function bookmarkRibbonGeometry(bounds, insets, viewport) {
    const anchor = readerIndicatorPosition(bounds, insets);
    const width = 54;
    const top = Math.max(4, Math.min(anchor.top, viewport.height - 90));
    const left = Math.max(4, Math.min(viewport.width - width - 4, anchor.left + 34 - width));
    const height = Math.max(82, Math.min(446, viewport.height - top - 8));
    return { top, left, width, height };
}

const COLOR_NAMES_EN = ['Yellow', 'Red', 'Green', 'Blue', 'Purple',
    'Magenta', 'Orange', 'Gray', 'Black'];
const COLOR_NAMES_DE = ['Gelb', 'Rot', 'Grün', 'Blau', 'Violett',
    'Magenta', 'Orange', 'Grau', 'Schwarz'];

/**
 * One bookmark-shaped surface, never an adjacent popover. The color selection
 * lives INSIDE the flag. E-ink devices skip all transitions and animation frames.
 */
export class BookmarkColorRibbon {
    constructor({ win, bounds, insets, color, eReader, onSelect, onClose }) {
        this.win = win;
        this.doc = win.document;
        this.onSelect = onSelect;
        this.onClose = onClose;
        this.duration = bookmarkRibbonDuration(eReader,
            !!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
        this.color = BOOKMARK_COLORS.find(c => c.toLowerCase() === color?.toLowerCase()) || '#000000';
        this.geometry = bookmarkRibbonGeometry(bounds, insets, {
            width: win.innerWidth, height: win.innerHeight
        });
    }

    show() {
        const { doc, geometry: g } = this;
        const layer = doc.createElement('div');
        layer.className = 'motero-bookmark-gesture-layer';
        layer.style.cssText = 'position:fixed;inset:0;z-index:2147483645;pointer-events:auto;background:transparent;isolation:isolate;';
        const flag = doc.createElement('div');
        flag.className = 'motero-bookmark-color-ribbon';
        flag.setAttribute('role', 'group');
        flag.setAttribute('aria-label', doc.documentElement.lang?.startsWith('de') ? 'Lesezeichenfarbe' : 'Bookmark color');
        flag.style.cssText = 'position:absolute;box-sizing:border-box;overflow:hidden;'
            + 'clip-path:polygon(0 0,100% 0,100% 100%,50% calc(100% - 12px),0 100%);'
            + 'border:1px solid rgba(0,0,0,.25);'
            + 'touch-action:pan-y;'
            + 'left:' + g.left + 'px;top:' + g.top + 'px;width:' + g.width + 'px;'
            + 'height:' + (this.duration ? 34 : g.height) + 'px;'
            + 'background:' + this.color + ';'
            + (this.duration ? 'transition:height ' + this.duration + 'ms ease-in-out;' : 'transition:none;');
        const interior = doc.createElement('div');
        interior.className = 'motero-bookmark-ribbon-colors';
        interior.style.cssText = 'position:absolute;top:34px;left:3px;right:3px;bottom:18px;'
            + 'display:flex;flex-direction:column;align-items:center;'
            + 'overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;'
            + 'border-radius:6px;background:var(--color-background,#fff);'
            + 'border:1px solid var(--color-border,#d1d1d1);';
        // Reader's annotation palette already uses Zotero's host theme tokens.
        try {
            const theme = this.win.parent.getComputedStyle(this.win.parent.document.documentElement);
            for (const name of ['--color-background', '--color-border', '--fill-primary', '--fill-quinary']) {
                const value = theme.getPropertyValue(name);
                if (value) flag.style.setProperty(name, value);
            }
        } catch (_) { /* Embedded reader can still use its local theme defaults. */ }

        const names = doc.documentElement.lang?.startsWith('de') ? COLOR_NAMES_DE : COLOR_NAMES_EN;
        BOOKMARK_COLORS.forEach((color, index) => {
            const button = doc.createElement('button');
            button.type = 'button';
            button.className = 'motero-bookmark-color-choice';
            button.dataset.color = color;
            button.setAttribute('aria-label', names[index]);
            button.setAttribute('aria-pressed', String(color.toLowerCase() === this.color.toLowerCase()));
            button.style.cssText = 'box-sizing:border-box;flex:0 0 44px;width:44px;height:44px;'
                + 'display:flex;align-items:center;justify-content:center;'
                + 'border:0;border-radius:6px;background:transparent;padding:0;'
                + 'color:var(--fill-primary,#222);';
            const circle = doc.createElement('span');
            circle.style.cssText = 'display:block;width:24px;height:24px;border-radius:50%;'
                + 'box-sizing:border-box;border:1px solid rgba(0,0,0,.2);background:' + color + ';'
                + (color.toLowerCase() === this.color.toLowerCase()
                    ? 'box-shadow:inset 0 0 0 2px ' + color + ',inset 0 0 0 4px white;' : '');
            button.append(circle);
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                if (this.chosen) return;
                this.chosen = true;
                flag.style.background = color;
                // UI closes even if asynchronous storage has not finished.
                try { this.onSelect(color); }
                finally { this.dismiss(); }
            });
            interior.append(button);
        });
        flag.append(interior);
        layer.append(flag);
        layer.addEventListener('pointerdown', event => {
            if (!flag.contains(event.target)) {
                event.preventDefault();
                this.dismiss(true);
            }
        });
        layer.addEventListener('contextmenu', event => event.preventDefault());
        doc.documentElement.append(layer);
        this.layer = layer;
        this.flag = flag;
        if (this.duration) {
            // Force one initial layout, not an animation loop.
            flag.getBoundingClientRect();
            flag.style.height = g.height + 'px';
        }
        return layer;
    }

    dismiss(immediately = false) {
        if (!this.layer || this.closing) return;
        this.closing = true;
        this.onClose?.();
        if (!immediately && this.duration) {
            this.flag.style.height = '34px';
            this.closeTimer = this.win.setTimeout(() => this.destroy(), this.duration);
        } else {
            this.destroy();
        }
    }

    destroy() {
        this.win.clearTimeout(this.closeTimer);
        this.layer?.remove();
        this.layer = null;
        this.flag = null;
    }
}
