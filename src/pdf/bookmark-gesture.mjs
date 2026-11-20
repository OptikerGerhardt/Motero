import { isReaderBookmark, readerBookmarkCorner } from '../common/reader-bookmark.mjs';
import { BookmarkColorRibbon, BOOKMARK_LONG_PRESS_MS, bookmarkPressMoved } from './bookmark-color-ribbon.mjs';

export class BookmarkGesture {
    constructor(boox) {
        this.boox = boox;
        this.press = null;
        this.ribbon = null;
    }

    bookmark(pageIndex) {
        return this.boox.view._annotations.find(a => isReaderBookmark(a)
            && a.position?.pageIndex === pageIndex);
    }

    arm(event) {
        const { boox } = this;
        const view = boox.view;
        if (!['touch', 'pen'].includes(event.pointerType) || !event.isPrimary
            || view._readOnly || view._destroyed || view._tool.type !== 'pointer'
            || view._pageFitting?.editor || boox.isOverview() || this.ribbon
            || !boox.viewer.container.contains(event.target)) return false;
        const bounds = boox.viewer.container.getBoundingClientRect();
        if (!readerBookmarkCorner(bounds, view._options.indicatorInsets,
            event.clientX, event.clientY)) return false;
        const pageIndex = view._pageFitting?.centeredPageIndex()
            ?? boox.viewer.currentPageNumber - 1;
        const annotation = this.bookmark(pageIndex);
        if (annotation?.readOnly || annotation?.isExternal) return false;
        this.cancel();
        const press = { id: event.pointerId, x: event.clientX, y: event.clientY,
            time: Date.now(), pageIndex, fired: false };
        this.press = press;
        press.timer = boox.win.setTimeout(() => {
            if (this.press !== press || view._destroyed) return;
            press.fired = true;
            view._readerPriorityDown = null;
            view._clearPendingBackdropTap?.();
            view._chromeTapGuard?.reset();
            view._directHighlight?.reset();
            view._clearPointerAction?.();
            this.open(press.pageIndex);
        }, BOOKMARK_LONG_PRESS_MS);
        return true;
    }

    move(event) {
        if (this.press?.id === event.pointerId && bookmarkPressMoved(this.press, event)) {
            this.cancel();
            this.boox.view._readerPriorityDown = null;
        }
    }

    finish(event) {
        const press = this.press;
        if (!press || event.pointerId !== press.id) return false;
        this.boox.win.clearTimeout(press.timer);
        this.press = null;
        if (!press.fired && Date.now() - press.time >= BOOKMARK_LONG_PRESS_MS) {
            this.open(press.pageIndex);
            return true;
        }
        return press.fired;
    }

    cancel(event) {
        if (event && this.press?.id !== event.pointerId) return;
        this.boox.win.clearTimeout(this.press?.timer);
        this.press = null;
    }

    open(pageIndex) {
        const { boox } = this, view = boox.view;
        if (view._destroyed || view._readOnly || view._tool.type !== 'pointer'
            || boox.isOverview()) return;
        const annotation = this.bookmark(pageIndex);
        if (annotation?.readOnly || annotation?.isExternal) return;
        this.close(true);
        const ribbon = new BookmarkColorRibbon({
            win: boox.win, bounds: boox.viewer.container.getBoundingClientRect(),
            insets: view._options.indicatorInsets,
            color: annotation?.color || view._options.bookmarkColor,
            eReader: !!view._options.deviceProfile?.eReader,
            onSelect: color => {
                if (view._readOnly || view._destroyed) return;
                const current = this.bookmark(pageIndex);
                if (current) {
                    if (!current.readOnly && !current.isExternal
                        && current.color?.toLowerCase() !== color.toLowerCase()) {
                        // A tag and its user content are never changed when recoloring.
                        view._onUpdateAnnotations([{ id: current.id, color }]);
                    }
                } else {
                    // The color picker overrides only this new bookmark's color,
                    // not the global default set by the user in reader settings.
                    boox.placeBookmark(pageIndex, color, true).catch(console.error);
                }
            },
            onClose: () => {
                if (this.ribbon === ribbon) this.ribbon = null;
                boox.indicators?.schedule();
            }
        });
        this.ribbon = ribbon;
        boox.indicators?.schedule();
        ribbon.show();
    }

    close(immediately = false) {
        this.cancel();
        const ribbon = this.ribbon;
        if (!ribbon) return;
        this.ribbon = null;
        if (immediately) ribbon.destroy();
        else ribbon.dismiss();
        this.boox.indicators?.schedule();
    }
}
