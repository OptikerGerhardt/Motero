import ribbonStyles from '!!raw-loader!./bookmark-color-ribbon.css';
import { ANNOTATION_COLORS, EXTRA_INK_AND_TEXT_COLORS } from '../common/defines';
import { bookmarkColor, bookmarkFrameAnchor, DEFAULT_BOOKMARK_COLOR, BOOKMARK_FLAG_WIDTH, BOOKMARK_FLAG_HEIGHT } from '../common/reader-bookmark.mjs';

const HOLD_MS = 450;
const SLOP = 8;
const TRANSITION_MS = 180;
const COLORS = [...ANNOTATION_COLORS, ...EXTRA_INK_AND_TEXT_COLORS].map(([, color]) => color);
const NAMES = {
    en: ['Yellow', 'Red', 'Green', 'Blue', 'Purple', 'Magenta', 'Orange', 'Gray', 'Black'],
    de: ['Gelb', 'Rot', 'Grün', 'Blau', 'Violett', 'Magenta', 'Orange', 'Grau', 'Schwarz'],
};

export class BookmarkColorPicker {
    constructor(reader) {
        this.reader = reader;
        this.win = reader.win;
        this.doc = reader.doc;
        this.onVisibility = () => { if (this.doc.hidden) this.dismiss(); };
        this.doc.addEventListener('visibilitychange', this.onVisibility);
        this.onBlur = () => this.dismiss();
        this.win.addEventListener('blur', this.onBlur);
    }

    contains(event) {
        return this.layer?.contains(event.target);
    }

    owns(event) {
        return !!this.press && this.press.id === event.pointerId;
    }

    start(event) {
        if (this.press) {
            if (!this.owns(event)) this.dismiss();
            return false;
        }
        if (!['touch', 'pen'].includes(event.pointerType) || !event.isPrimary || event.button !== 0
                || !this.reader.canUseBookmarkCorner(event)) return false;
        const index = this.reader.bookmarkPageIndex(event);
        const existing = this.reader.findBookmark(index);
        const press = { id: event.pointerId, x: event.clientX, y: event.clientY,
            time: Date.now(), index, annotationID: existing?.id };
        this.press = press;
        press.timer = this.win.setTimeout(() => this.open(press), HOLD_MS);
        return true;
    }

    move(event) {
        if (!this.owns(event) || this.press.recognized) return;
        if (Math.hypot(event.clientX - this.press.x, event.clientY - this.press.y) > SLOP) {
            this.dismiss();
        }
    }

    end(event) {
        if (!this.owns(event)) return false;
        const { press, win } = this;
        this.move(event);
        win.clearTimeout(press.timer);
        if (event.type !== 'pointerup') this.dismiss();
        if (!press.cancelled && !press.recognized) {
            if (Date.now() - press.time >= HOLD_MS) this.open(press);
            else if (this.reader.bookmarkPageIndex(event) === press.index && this.reader.canUseBookmarkCorner(event)) {
                this.reader.addBookmark(press.index).catch(console.error);
            }
        }
        this.press = null;
        return true;
    }

    open(press) {
        const { reader, win, doc } = this;
        const view = reader.view;
        if (press.cancelled || this.press !== press) return;
        press.recognized = true;
        const annotation = reader.findBookmark(press.index);
        if (annotation?.id !== press.annotationID || annotation?.readOnly || annotation?.isExternal
                || !reader.canUseBookmarkCorner({
                    clientX: press.x, clientY: press.y, target: reader.viewer.container,
                }) || reader.bookmarkPageIndex({clientX: press.x, clientY: press.y}) !== press.index) return;

        this.removeLayer();
        reader.closePalette();
        const bounds = reader.viewer.container.getBoundingClientRect();
        const insets = view._options.indicatorInsets || {};
        const { left, top } = reader.indicators.anchor(press.index)
            || bookmarkFrameAnchor(bounds, bounds, insets);
        const height = Math.min(COLORS.length * 44 + 24, bounds.bottom - top - Math.max(12, insets.bottom || 0));
        if (height < 66) return;
        const instant = !!view._options.deviceProfile?.eReader
            || win.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const current = bookmarkColor(annotation || { color: view._options.bookmarkColor ?? DEFAULT_BOOKMARK_COLOR }).toLowerCase();

        const layer = doc.createElement('div');
        layer.className = 'motero-bookmark-picker';
        const flag = doc.createElement('div');
        flag.className = 'motero-bookmark-ribbon';
        flag.setAttribute('role', 'dialog');
        flag.setAttribute('aria-modal', 'true');
        flag.setAttribute('aria-label', reader.de ? 'Lesezeichenfarbe' : 'Bookmark color');
        flag.toggleAttribute('data-instant', instant);
        const hostStyle = win.parent.getComputedStyle(win.parent.document.documentElement);
        for (const name of ['--color-background', '--color-border', '--accent-blue']) {
            const value = hostStyle.getPropertyValue(name);
            if (value) flag.style.setProperty(name, value);
        }
        flag.style.setProperty('--flag-top', top + 'px');
        flag.style.setProperty('--flag-left', left + 'px');
        flag.style.setProperty('--flag-width', BOOKMARK_FLAG_WIDTH + 'px');
        flag.style.setProperty('--flag-collapsed-height', BOOKMARK_FLAG_HEIGHT + 'px');
        flag.style.setProperty('--flag-height', height + 'px');
        flag.style.setProperty('--flag-color', current);
        const swatches = doc.createElement('div');
        swatches.className = 'motero-bookmark-ribbon-colors';
        const labels = reader.de ? NAMES.de : NAMES.en;
        COLORS.forEach((color, index) => {
            const button = doc.createElement('button');
            button.type = 'button';
            button.dataset.color = color;
            button.setAttribute('aria-label', labels[index]);
            button.setAttribute('aria-pressed', String(color === current));
            const swatch = doc.createElement('span');
            swatch.style.setProperty('--swatch-color', color);
            button.append(swatch);
            swatches.append(button);
        });
        const style = doc.createElement('style');
        style.textContent = ribbonStyles;
        flag.append(swatches);
        layer.append(style, flag);
        this.layer = layer;
        this.openAnchor = { left, top, index: press.index };
        this.isOpen = true;
        let freshPress = false;
        layer.addEventListener('pointerdown', () => { freshPress = true; });
        flag.tabIndex = -1;
        layer.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.dismiss(true);
                return;
            }
            if (event.key !== 'Tab') return;
            const items = Array.from(swatches.children);
            const focused = items.indexOf(doc.activeElement);
            if (focused > 0 && event.shiftKey || focused >= 0 && focused < items.length - 1 && !event.shiftKey) return;
            event.preventDefault();
            items[event.shiftKey ? items.length - 1 : 0].focus();
        });
        layer.addEventListener('pointercancel', event => {
            // Native vertical scrolling of the palette cancels the touch pointer.
            if (!swatches.contains(event.target)) this.dismiss();
        });
        layer.addEventListener('click', event => {
            const choice = event.target.closest('button[data-color]');
            if (!this.isOpen || !freshPress && event.detail !== 0) return;
            if (choice) {
                const { color } = choice.dataset;
                reader.addBookmark(press.index, { color, id: press.annotationID }).then(id => {
                    if (id) view._options.onBookmarkColorChosen?.(id, color);
                }).catch(console.error);
                this.dismiss(true);
            }
            else if (event.target === layer) this.dismiss(true);
        });
        layer.addEventListener('contextmenu', event => event.preventDefault());
        reader.indicators.setPalettePage(press.index);
        doc.documentElement.append(layer);
        if (!instant) flag.getBoundingClientRect();
        flag.setAttribute('data-expanded', '');
        flag.focus({ preventScroll: true });
        view._options.onBookmarkColorsOpen?.(true);
    }

    checkAnchor() {
        if (!this.isOpen || !this.openAnchor) return;
        const current = this.reader.indicators.anchor(this.openAnchor.index);
        if (!current || Math.abs(current.top - this.openAnchor.top) > 2
                || Math.abs(current.left - this.openAnchor.left) > 2) this.dismiss();
    }

    dismiss(animate = false) {
        if (this.press) {
            this.press.cancelled = true;
            this.win.clearTimeout(this.press.timer);
        }
        if (!this.layer) return false;
        if (this.isOpen) this.reader.view._options.onBookmarkColorsOpen?.(false);
        this.isOpen = false;
        const flag = this.layer.querySelector('.motero-bookmark-ribbon');
        if (animate && !flag.hasAttribute('data-instant') && flag.hasAttribute('data-expanded')) {
            flag.removeAttribute('data-expanded');
            this.closeTimer = this.win.setTimeout(() => this.removeLayer(), TRANSITION_MS);
        }
        else this.removeLayer();
        return true;
    }

    removeLayer() {
        this.win.clearTimeout(this.closeTimer);
        if (!this.layer) return;
        this.layer.remove();
        this.layer = null;
        this.openAnchor = null;
        this.reader.indicators.setPalettePage(null);
    }

    destroy() {
        this.dismiss();
        this.doc.removeEventListener('visibilitychange', this.onVisibility);
        this.win.removeEventListener('blur', this.onBlur);
    }
}
