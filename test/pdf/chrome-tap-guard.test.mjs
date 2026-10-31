import assert from 'node:assert/strict';
import test from 'node:test';
import { PDFChromeTapGuard } from '../../src/pdf/chrome-tap-guard.mjs';

function fixture() {
	let timers = new Map(), replayed = [], dismissed = 0, counter = 0;
	let view = { _readerChromeVisible: true, _tool: { type: 'pointer' },
		_iframeWindow: { setTimeout: f => { timers.set(++counter, f); return counter; }, clearTimeout: id => timers.delete(id) },
		_clearPendingBackdropTap() {}, _clearPointerAction() {},
		_onDismissReaderChrome: () => dismissed++, _handlePointerDown: event => replayed.push(event),
	};
	let guard = new PDFChromeTapGuard(view);
	let event = (patch = {}) => ({ type: 'pointerdown', pointerType: 'touch', pointerId: 1,
		isPrimary: true, button: 0, clientX: 50, clientY: 60, timeStamp: 100,
		target: { closest: selector => selector === '#viewerContainer' }, ...patch });
	return { view, guard, event, replayed, timers, dismissed: () => dismissed };
}

test('first annotation tap dismisses chrome without replaying selection, next tap passes through', () => {
	let f = fixture(), down = f.event(), up = f.event({ type: 'pointerup', timeStamp: 180 });
	assert.equal(f.guard.down(down), true);
	assert.equal(f.guard.up(up), true);
	assert.equal(f.guard.up(up), true); // capture and bubbling see the same event
	assert.equal(f.dismissed(), 1); assert.equal(f.replayed.length, 0); assert.equal(f.timers.size, 0);
	assert.equal(f.guard.down(f.event()), false);
});

test('swipes, long holds and a second pointer replay the original down and keep their gestures', () => {
	for (let gesture of ['swipe', 'hold', 'pinch']) {
		let f = fixture(), down = f.event(); f.guard.down(down);
		if (gesture === 'swipe') assert.equal(f.guard.move(f.event({ clientY: 100 })), false);
		if (gesture === 'hold') [...f.timers.values()][0]();
		if (gesture === 'pinch') assert.equal(f.guard.down(f.event({ pointerId: 2, isPrimary: false })), false);
		assert.deepEqual(f.replayed, [down]); assert.equal(f.dismissed(), 0); assert.equal(f.guard.pending, null);
	}
});

test('direct highlighter keeps its own hold timer; only its short pointer tap dismisses chrome', () => {
	let f = fixture(); f.view._directHighlight = { enabled: true, canStart: () => true };
	assert.equal(f.guard.down(f.event()), false);
	assert.equal(f.guard.consumeTap(f.event(), f.event({ timeStamp: 600 })), false);
	assert.equal(f.guard.consumeTap(f.event(), f.event({ timeStamp: 180 })), true);
	assert.equal(f.dismissed(), 1);
});

test('cancellation clears delayed actions and active drawing tools remain interactive', () => {
	let f = fixture();f.guard.down(f.event());f.guard.reset();
	assert.equal(f.timers.size, 0);assert.equal(f.guard.up(f.event()), false);assert.equal(f.dismissed(), 0);
	f.view._tool.type = 'highlight';assert.equal(f.guard.down(f.event()), false);
});
