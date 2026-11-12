import assert from 'node:assert/strict';
import test from 'node:test';
import { HoldToHighlight } from '../../src/pdf/hold-to-highlight.mjs';

const down = { pointerId: 1, pointerType: 'touch', button: 0, clientX: 100, clientY: 100 };

function fixture(options = {}) {
	let timers = new Map();
	let nextID = 1;
	let calls = [];
	let gesture = new HoldToHighlight({
		canStart: () => true,
		prepare: () => ({ word: 'reading' }),
		start: word => calls.push(['start', word]),
		update: event => calls.push(['move', event.clientX, event.clientY]),
		finish: () => calls.push(['save']),
		cancel: () => calls.push(['cancel']),
		tap: () => calls.push(['tap']),
		schedule: (callback, delay) => { let id = nextID++; timers.set(id, { callback, delay }); return id; },
		unschedule: id => timers.delete(id),
		...options,
	});
	async function hold() {
		for (let [id, timer] of [...timers]) {
			timers.delete(id);
			assert.equal(timer.delay, 200);
			await timer.callback();
		}
	}
	return { gesture, calls, hold, timers };
}

test('a quick tap is forwarded without saving an annotation', async () => {
	let { gesture, calls, hold } = fixture();
	assert.equal(gesture.down(down), true);
	gesture.up(down);
	await hold();
	assert.deepEqual(calls, [['tap']]);
});

test('hold, drag, and lift previews the word and saves exactly once on release', async () => {
	let { gesture, calls, hold } = fixture();
	gesture.down(down);
	await hold();
	assert.equal(gesture.active, true);
	gesture.move({ ...down, clientX: 160, clientY: 140 });
	assert.equal(calls.some(([name]) => name === 'save'), false);
	gesture.up({ ...down, clientX: 170, clientY: 140 });
	gesture.up(down);
	assert.deepEqual(calls, [['start', { word: 'reading' }], ['move', 160, 140], ['move', 170, 140], ['save']]);
});

test('small hand jitter keeps the long press; a swipe cancels it', async () => {
	for (let [movement, expected] of [[5, ['start', 'move', 'save']], [15, []]]) {
		let { gesture, calls, hold } = fixture();
		gesture.down(down);
		gesture.move({ ...down, clientY: down.clientY + movement });
		await hold();
		gesture.up(down);
		assert.deepEqual(calls.map(([name]) => name), expected);
	}
});

test('a second finger before or after the hold aborts marking and consumes remaining lifts', async () => {
	for (let active of [false, true]) {
		let { gesture, calls, hold } = fixture();
		gesture.down(down);
		if (active) await hold();
		let second = { ...down, pointerId: 2 };
		gesture.down(second);
		assert.equal(gesture.up(second), true);
		assert.equal(gesture.up(down), true);
		await hold();
		assert.deepEqual(calls.map(([name]) => name), active ? ['start', 'cancel'] : []);
		assert.equal(gesture.multitouch, false);
	}
});

test('pointer cancellation and reader shutdown discard the preview without saving', async () => {
	for (let interrupt of [g => g.interrupted(down), g => g.reset()]) {
		let { gesture, calls, hold } = fixture();
		gesture.down(down);
		await hold();
		interrupt(gesture);
		gesture.up(down);
		assert.deepEqual(calls.map(([name]) => name), ['start', 'cancel']);
	}
});

test('slow text extraction cannot start highlighting after a lift, swipe, or second touch', async () => {
	for (let interrupt of [g => g.up(down), g => g.move({ ...down, clientX: 120 }),
		g => g.down({ ...down, pointerId: 2 }), g => g.reset()]) {
		let resolve;
		let { gesture, calls, hold } = fixture({ prepare: () => new Promise(r => { resolve = r; }) });
		gesture.down(down);
		let pending = hold();
		interrupt(gesture);
		resolve({ word: 'late' });
		await pending;
		assert.equal(calls.some(([name]) => name === 'start' || name === 'save'), false);
	}
});

test('finger and pen support the gesture; mouse, pen button, and ineligible targets keep their handling', async () => {
	for (let pointerType of ['touch', 'pen', 'mouse']) {
		let { gesture, calls, hold } = fixture();
		let event = { ...down, pointerType };
		gesture.down(event);
		await hold();
		gesture.up(event);
		assert.deepEqual(calls.map(([name]) => name), pointerType === 'mouse' ? [] : ['start', 'move', 'save']);
	}
	for (let options of [{ canStart: () => false }, {}]) {
		let { gesture, calls, hold } = fixture(options);
		let event = { ...down, button: 2 };
		assert.equal(gesture.down(event), false);
		await hold();
		gesture.up(event);
		assert.deepEqual(calls, []);
	}
});

test('a hold on an image or without extractable text never saves a highlight', async () => {
	let { gesture, calls, hold } = fixture({ prepare: () => null });
	gesture.down(down);
	await hold();
	gesture.up(down);
	assert.deepEqual(calls, [['tap']]);
});

test('a rejected extraction is discarded and the next gesture still works', async () => {
	let { gesture, calls, hold } = fixture({ prepare: async () => { throw new Error('unavailable'); } });
	gesture.down(down);
	await hold();
	gesture.up(down);
	assert.deepEqual(calls, []);
	gesture.prepare = () => ({ word: 'available' });
	gesture.down(down);
	await hold();
	gesture.up(down);
	assert.deepEqual(calls.map(([name]) => name), ['start', 'move', 'save']);
});
