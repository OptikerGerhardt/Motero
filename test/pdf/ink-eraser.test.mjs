import test from 'node:test';
import assert from 'node:assert/strict';
import { eraseInk } from '../../src/pdf/lib/path.js';
const note = () => ({ id: 'ink', type: 'ink', image: 'old', position: { pageIndex: 0, width: 2,
    paths: [[0,0,10,0,20,0], [0,20,10,20,20,20]] } });
test('area eraser removes only the touched portion and leaves other strokes intact', () => {
    const original=note(), [changed]=eraseInk(10,0,4,[original],'area');
    assert.deepEqual(changed.position.paths,[[0,0],[20,0],[0,20,10,20,20,20]]);
    assert.equal(changed.image,undefined);
    assert.equal(original.position.paths[0].length,6);
});
test('stroke eraser removes the touched stroke rather than all ink in the annotation', () => {
    const [changed]=eraseInk(5,0,2,[note()],'stroke');
    assert.deepEqual(changed.position.paths,[[0,20,10,20,20,20]]);
});
test('stroke hit testing includes pen width and isolated dots without touching nearby strokes', () => {
    const dot={...note(),position:{pageIndex:0,width:4,paths:[[7,7]]}};
    assert.deepEqual(eraseInk(9,7,1,[dot],'stroke')[0].position.paths,[]);
    assert.deepEqual(eraseInk(100,100,4,[note()],'stroke'),[]);
});
