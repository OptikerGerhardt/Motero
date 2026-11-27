// Shared by PDF and EPUB so their touch activation stays consistent.
export const HIGHLIGHT_HOLD_DELAY = 200;
// Gesture state is kept separate from PDF coordinates and Android's native selection.
export class HoldToHighlight {
	constructor({ canStart, prepare, start, update, finish, cancel, tap,
		schedule = (callback, delay) => setTimeout(callback, delay),
		unschedule = timer => clearTimeout(timer), delay = HIGHLIGHT_HOLD_DELAY, slop = 10 }) {
		Object.assign(this, { canStart, prepare, start, update, finish, cancel, tap,
			schedule, unschedule, delay, slop });
		this.pointers = new Set();
		this.state = null;
		this.multitouch = false;
	}

	get active() {
		return !!this.state?.active;
	}

	down(event, immediate = false) {
		if (!['touch', 'pen'].includes(event.pointerType)) {
			return false;
		}
		this.pointers.add(event.pointerId);
		if (this.pointers.size > 1) {
			this.abort();
			this.multitouch = true;
			return true;
		}
		if (this.multitouch || (event.button !== 0 && !(immediate && (event.buttons & 1 || event.pressure > 0)))
				|| !this.canStart(event, immediate)) {
			return this.multitouch;
		}
		let state = this.state = { event, active: false, moved: false, immediate };
		const activate = async () => {
			state.timer = null;
			try {
				let prepared = await this.prepare(event, immediate);
				if (this.state !== state || (!immediate && state.moved) || this.multitouch) return;
				if (!prepared) {
					if (immediate) this.abort();
					return;
				}
				state.active = true;
				this.start(prepared, event);
				if (state.latestMove) this.update(state.latestMove);
				if (state.released) this.up(state.released);
			}
			catch {
				if (this.state === state) this.abort();
			}
		};
		if (immediate) activate();
		else state.timer = this.schedule(activate, this.delay);
		return true;
	}

	move(event) {
		let state = this.state;
		if (!state || event.pointerId !== state.event.pointerId) {
			return this.multitouch;
		}
		if (state.immediate) {
			state.latestMove = event;
			state.moved ||= Math.hypot(event.clientX - state.event.clientX,
				event.clientY - state.event.clientY) > 1;
		}
		if (state.active) {
			this.update(event);
		}
		else if (!state.immediate && Math.hypot(event.clientX - state.event.clientX,
			event.clientY - state.event.clientY) > this.slop) {
			state.moved = true;
			this.unschedule(state.timer);
			state.timer = null;
		}
		return true;
	}

	up(event) {
		this.pointers.delete(event.pointerId);
		if (this.multitouch) {
			this.multitouch = this.pointers.size > 0;
			return true;
		}
		let state = this.state;
		if (!state || event.pointerId !== state.event.pointerId) {
			return false;
		}
		if (state.immediate) {
			if (!state.moved) {
				this.abort();
				return true;
			}
			if (!state.active) {
				state.released = event;
				return true;
			}
		}
		this.unschedule(state.timer);
		this.state = null;
		if (state.active) {
			this.update(event);
			this.finish(event);
		}
		else if (!state.immediate && !state.moved) {
			this.tap(state.event, event);
		}
		return true;
	}

	interrupted(event) {
		this.pointers.delete(event.pointerId);
		if (this.state?.event.pointerId === event.pointerId) {
			this.abort();
		}
		if (!this.pointers.size) {
			this.multitouch = false;
		}
	}

	abort() {
		let state = this.state;
		this.state = null;
		if (state) {
			this.unschedule(state.timer);
			if (state.active) {
				this.cancel();
			}
		}
	}

	reset() {
		this.abort();
		this.pointers.clear();
		this.multitouch = false;
	}
}
