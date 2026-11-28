// Portable Android input ownership. No stroke/document data is logged or stored.
// Runs in capture before fitting, edge taps, selection and PDF.js touch handling.
export class MobilePenInput {
    constructor(win, { profile = {}, onTakeover = () => {}, onSignal = event => {}, onEraser = () => {}, onRoute = () => false, isReadingPen = () => false, isPenHighlighting = () => false } = {}) {
        this.win = win; this.profile = profile; this.onTakeover = onTakeover;
        this.onSignal = onSignal; this.onEraser = onEraser; this.onRoute = onRoute; this.isReadingPen = isReadingPen;
        this.isPenHighlighting = isPenHighlighting;
        this.contacts = new Set(); this.blocked = new Set(); this.owner = null;
        this.until = 0; this.eraser = false; this.button = false; this.physical = false;
        this.listeners = [];
        for (const name of ['pointerdown','pointermove','pointerup','pointercancel','pointerover']) this.listen(name, e => this.pointer(e));
        for (const name of ['touchstart','touchmove','touchend','touchcancel']) this.listen(name, e => this.touch(e));
        this.listen('blur', event => { if (event.target && event.target !== this.win) return; if (this.owner !== null) this.onTakeover(); this.reset(); });
        this.listen('lostpointercapture', e => {
            if (this.owner !== e.pointerId) return;
            this.onTakeover(); this.owner = null; this.until = Date.now()+300; this.setEraser(false);
        });
        for (const name of ['click', 'contextmenu']) this.listen(name, event => {
            if (event.pointerType === 'pen' && this.isReadingPen() && !this.isControl(event)) this.stop(event);
        });
        this.listen('pagehide', () => this.reset());
        this.listen('visibilitychange', () => { if (win.document.hidden) this.reset(); }, win.document);
        this.applyProfile(profile);
    }
    listen(name, fn, target = this.win) {
        target.addEventListener(name, fn, {capture:true,passive:false}); this.listeners.push([target,name,fn]);
    }
    get busy() { return this.owner !== null || Date.now() < this.until; }
    stop(e) { if (e.cancelable) e.preventDefault(); e.stopImmediatePropagation(); }
    isControl(event) {
        return event.target?.closest?.('.boox-highlight-palette, .boox-manual-crop, .motero-bookmark-picker, .motero-reading-progress, button, input, select, [role=toolbar]');
    }
    pointer(e) {
        const down = e.type === 'pointerdown', up = e.type === 'pointerup' || e.type === 'pointercancel';
        const control = this.isControl(e);
        if (control && (e.pointerType !== 'pen' || down || this.owner === null)) return;
        if (e.pointerType === 'pen') {
            this.onSignal(e);
            const epoch = this.penEpoch = (this.penEpoch || 0) + 1;
            const physical = e.button === 5 || !!(e.buttons & 32);
            if (down && (!this.isReadingPen() || physical)) {
                // A new drawing contact recovers a lost release from the last pen.
                this.onTakeover();
                this.owner = e.pointerId;
            }
            if (this.owner !== null && this.owner !== e.pointerId) { this.stop(e); return; }
            if (up) {
                if (this.owner !== null) this.until = Date.now() + 300;
                this.owner = null;
                const cancelled = e.type === 'pointercancel';
                const buttonStillHeld = !cancelled && !!(e.buttons & (this.profile.buttonMask === 4 ? 4 : 2));
                this.button = buttonStillHeld;
                this.physical = false;
                if (cancelled) this.toggle = false;
                this.pendingRelease = { event: e, epoch };
                // Keep a fallback for a release that never reaches the view.
                this.win.setTimeout(() => this.finishRelease(e), 0);
                if (this.onRoute(e)) this.stop(e);
                return;
            }
            const button = !!(e.buttons & (this.profile.buttonMask === 4 ? 4 : 2));
            if (this.profile.eraserButtonMode === 'toggle') {
                if (button && !this.button) this.toggle = !this.toggle;
            }
            else this.toggle = false;
            this.button = button; this.physical = physical;
            this.setEraser(physical || !!this.toggle || (this.profile.eraserButtonMode !== 'toggle' && button), physical);
            if (down && !this.isReadingPen() || this.isReadingPen() && this.isPenHighlighting()
                    && (down || e.type === 'pointermove' && (e.buttons & 1 || e.pressure > 0))) {
                this.owner = e.pointerId;
                for (const id of this.contacts) this.blocked.add(id);
            }
            if (this.onRoute(e)) this.stop(e);
            return;
        }
        if (e.pointerType === 'mouse' && down && this.owner !== null) { this.onTakeover(); this.reset(); }
        if (e.pointerType !== 'touch') return;
        if (down) { this.contacts.add(e.pointerId); if (this.busy) this.blocked.add(e.pointerId); }
        const suppress = this.blocked.has(e.pointerId) || this.busy;
        if (up) { this.contacts.delete(e.pointerId); this.blocked.delete(e.pointerId); }
        if (suppress) this.stop(e);
    }
    touch(e) {
        // Suppress a palm through its release; new fingers work normally afterwards.
        const ids = [...(e.touches || []), ...(e.changedTouches || [])].map(x => x.identifier);
        const stylusTouch = [...(e.changedTouches || [])].some(touch => touch.touchType === 'stylus');
        if (this.busy || this.blocked.size || stylusTouch && this.isReadingPen()) this.stop(e);
    }
    finishRelease(event) {
        const release = this.pendingRelease;
        if (release?.event !== event) return;
        this.pendingRelease = null;
        if (this.owner !== null || release.epoch !== this.penEpoch) return;
        this.setEraser(!!this.toggle || (this.profile.eraserButtonMode !== 'toggle' && this.button));
    }
    finishControlRelease(event) {
        if (this.pendingRelease?.event !== event || this.owner !== null) return;
        // Opening a control with the pen is complete. Keep suppressing
        // contacts already classified as palms, while allowing a fresh tap.
        this.until = 0;
        this.finishRelease(event);
    }
    setEraser(active, physical = false) {
        if (this.eraser === active && !!this.reportedPhysical === physical && !!this.reportedHeld === this.button) return;
        this.eraser = active;
        this.reportedPhysical = physical;
        this.reportedHeld = this.button;
        this.onEraser(active, physical, this.button);
    }
    applyProfile(profile) {
        this.profile = profile || {};
        const root = this.win.document.documentElement;
        if (!this.style) {
            this.style = this.win.document.createElement('style');
            this.style.textContent = `
                :root[data-e-reader] *, :root[data-e-reader] *::before, :root[data-e-reader] *::after {
                    animation-duration:0s!important;transition-duration:0s!important;scroll-behavior:auto!important;
                }
                :root[data-pen-active] .textLayer, :root[data-pen-exclusive] .textLayer {touch-action:auto!important;}
                :root[data-e-reader] button, :root[data-e-reader] input {border-color:currentColor;}
            `;
            this.win.document.head.append(this.style);
        }
        root.toggleAttribute('data-e-reader', !!this.profile.eReader);
        root.toggleAttribute('data-pen-exclusive', !!this.profile.penOnly);
    }
    reset() {
        this.penEpoch = (this.penEpoch || 0) + 1;
        this.pendingRelease = null;
        this.owner = null; this.contacts.clear(); this.blocked.clear(); this.until = 0;
        this.button = false; this.toggle = false; this.physical = false; this.setEraser(false);
    }
    destroy() { this.reset(); for (const [target,name,fn] of this.listeners) target.removeEventListener(name,fn,true); this.listeners = []; this.style?.remove(); }
}

/** Route stylus contact in toolbar pointer mode before the reader's tap handlers. */
export function routeReadingPen(view, event) {
    const options = view._options;
    const gesture = view._directHighlight?.gesture;
    if (event.type === 'pointerdown') {
        view._readingPen = null;
        if (!options.isReadingPen?.()) return false;
        view._readingPen = { id: event.pointerId, last: null };
    }
    const contact = view._readingPen;
    if (!contact || contact.id !== event.pointerId) return false;
    if (event.type === 'pointercancel' || !options.isReadingPen?.()) {
        gesture?.interrupted(event);
        view._readingPen = null;
        return true;
    }
    const armed = options.isPenHighlighting?.();
    if (event.type === 'pointerup') {
        if (contact.last) gesture?.up(armed ? event : contact.last);
        view._readingPen = null;
    } else if (event.type === 'pointermove' || event.type === 'pointerdown') {
        if (armed) {
            if (!contact.last) {
                gesture?.reset();
                // Use the coordinate at the press edge. Earlier neutral
                // movement must not become part of the annotation.
                gesture?.down(event, true);
            }
            else gesture?.move(event);
            contact.last = event;
        } else if (contact.last) {
            gesture?.up(contact.last);
            contact.last = null;
        }
    }
    return true;
}
