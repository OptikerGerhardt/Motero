// Portable Android input ownership. No stroke/document data is logged or stored.
// Runs in capture before fitting, edge taps, selection and PDF.js touch handling.
export class MobilePenInput {
    constructor(win, { profile = {}, onTakeover = () => {}, onSignal = () => {}, onEraser = () => {} } = {}) {
        this.win = win; this.profile = profile; this.onTakeover = onTakeover;
        this.onSignal = onSignal; this.onEraser = onEraser;
        this.contacts = new Set(); this.blocked = new Set(); this.owner = null;
        this.until = 0; this.eraser = false; this.button = false; this.physical = false;
        this.listeners = [];
        for (const name of ['pointerdown','pointermove','pointerup','pointercancel','pointerover']) this.listen(name, e => this.pointer(e));
        for (const name of ['touchstart','touchmove','touchend','touchcancel']) this.listen(name, e => this.touch(e));
        this.listen('blur', () => { if (this.owner !== null) this.onTakeover(); this.reset(); });
        this.listen('lostpointercapture', e => {
            if (this.owner !== e.pointerId) return;
            this.onTakeover(); this.owner = null; this.until = Date.now()+300; this.setEraser(false);
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
    pointer(e) {
        const down = e.type === 'pointerdown', up = e.type === 'pointerup' || e.type === 'pointercancel';
        if (e.pointerType === 'pen') {
            this.onSignal(e);
            if (down) {
                // A new real pen contact recovers a lost release and takes over a palm.
                this.onTakeover(); this.owner = e.pointerId;
                for (const id of this.contacts) this.blocked.add(id);
            }
            if (this.owner !== null && this.owner !== e.pointerId) { this.stop(e); return; }
            const physical = e.button === 5 || !!(e.buttons & 32);
            const button = !!(e.buttons & (this.profile.buttonMask === 4 ? 4 : 2));
            if (this.profile.eraserButtonMode === 'toggle') {
                if (button && !this.button) this.toggle = !this.toggle;
            }
            else this.toggle = false;
            this.button = button; this.physical = physical;
            this.setEraser(physical || !!this.toggle || (this.profile.eraserButtonMode !== 'toggle' && button));
            if (up) {
                this.owner = null; this.until = Date.now() + 300;
                // Restore after the final point is consumed, never before the eraser commit.
                this.win.setTimeout(() => {
                    if (this.owner === null && this.profile.eraserButtonMode !== 'toggle') { this.button = false; this.setEraser(false); }
                }, 0);
            }
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
        if (this.busy || this.blocked.size || ids.some(id => this.blocked.has(id))) this.stop(e);
    }
    setEraser(active) { if (this.eraser !== active) { this.eraser = active; this.onEraser(active); } }
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
        this.owner = null; this.contacts.clear(); this.blocked.clear(); this.until = 0;
        this.button = false; this.toggle = false; this.physical = false; this.setEraser(false);
    }
    destroy() { this.reset(); for (const [target,name,fn] of this.listeners) target.removeEventListener(name,fn,true); this.listeners = []; this.style?.remove(); }
}
