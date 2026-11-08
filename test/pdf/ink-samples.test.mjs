import test from 'node:test';
import assert from 'node:assert/strict';
import { appendInkSamples } from '../../src/pdf/ink-samples.mjs';
import { smoothPath } from '../../src/pdf/lib/path.js';
const project=e=>[e.clientX,e.clientY];
test('coalesced points and release endpoint are retained without duplicates',()=>{
    const path=[1,2];appendInkSamples(path,{clientX:5,clientY:6,getCoalescedEvents:()=>[{clientX:1,clientY:2},{clientX:3,clientY:4}]},project);
    assert.deepEqual(path,[1,2,3,4,5,6]);
});
test('short strokes, dots and exact final endpoints survive smoothing',()=>{
    for (const path of [[1,2],[1,2,1.1,2.1],[1,2,1.1,2.1,1.2,2.2]]) {
        const smooth=smoothPath(path);assert.deepEqual(smooth.slice(0,2),path.slice(0,2));assert.deepEqual(smooth.slice(-2),path.slice(-2));
    }
});
test('malformed and predicted input is not persisted',()=>{
    const path=[1,2];appendInkSamples(path,{clientX:3,clientY:4,getCoalescedEvents:()=>[{clientX:NaN,clientY:5}],getPredictedEvents:()=>[{clientX:99,clientY:99}]},project);
    assert.deepEqual(path,[1,2,3,4]);
});


test('queued pen hover cannot add ink, while a zero-button release keeps its endpoint',()=>{
    const path=[1,2];
    appendInkSamples(path,{type:'pointermove',buttons:0,clientX:99,clientY:99},project);
    assert.deepEqual(path,[1,2]);
    appendInkSamples(path,{type:'pointerup',buttons:0,clientX:3,clientY:4},project);
    assert.deepEqual(path,[1,2,3,4]);
});
