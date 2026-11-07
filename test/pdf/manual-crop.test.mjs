import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validCrop, normalizeCrops, cropForPage, updateCrop, dragCrop } from '../../src/pdf/manual-crop.mjs';
import { rotateReadingBounds } from '../../src/pdf/reading-layout.mjs';
const all = [.1,.15,.9,.85], odd = [.2,.1,.8,.9], even = [.05,.2,.75,.8];
test('all pages use the base crop and PDF page 1 is odd', () => {
 const crops={all,odd,even};
 assert.deepEqual(cropForPage(crops,0),odd);
 assert.deepEqual(cropForPage(crops,1),even);
 assert.deepEqual(cropForPage({all,odd},3),all);
 assert.deepEqual(cropForPage({odd},2),odd);
 assert.equal(cropForPage({odd},1),null);
});
test('all explicitly replaces parity overrides; changing one parity preserves the other', () => {
 assert.deepEqual(updateCrop({all,odd},'even',even),{all,odd,even});
 assert.deepEqual(updateCrop({all,odd,even},'all',all),{all});
 assert.throws(()=>updateCrop({},'page3',all));
});
test('invalid, reversed, non-finite and too-small crop rectangles are rejected', () => {
 for(const rect of [[0,0,2,1],[.9,0,.1,1],[0,NaN,1,1],[0,0,Infinity,1],[0,0,.01,1],['0',0,1,1],null]) assert.equal(validCrop(rect),false);
 assert.deepEqual(normalizeCrops({all,odd:[0,0,3,1],even:null,unknown:all}),{all});
});
test('dragging inside the frame preserves its size and clamps to the page', () => {
 dragCrop(all,'move',1,1).forEach((value,i)=>assert.ok(Math.abs(value-[.2,.3,1,1][i])<1e-12));
 const moved=dragCrop(all,'move',-1,-1);
 assert.equal(moved[0],0);assert.equal(moved[1],0);
 assert.ok(Math.abs(moved[2]-.8)<1e-12);
});
test('corner dragging cannot invert the frame or leave the page', () => {
 const nw=dragCrop(all,'nw',1,-1),se=dragCrop(all,'se',-1,1);
 assert.equal(nw[1],0);assert.ok(nw[2]-nw[0]>=.02-1e-12);
 assert.equal(se[3],1);assert.ok(se[2]-se[0]>=.02-1e-12);
});
test('manual geometry returns to the same natural coordinates after every view rotation', () => {
 for(const angle of [0,90,180,270]) {
  const displayed=rotateReadingBounds(odd,angle);
  const natural=rotateReadingBounds(displayed,-angle);
  natural.forEach((value,i)=>assert.ok(Math.abs(value-odd[i])<1e-12));
 }
});
