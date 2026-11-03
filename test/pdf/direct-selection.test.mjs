import test from 'node:test';
import assert from 'node:assert/strict';
import { extendTrailingPunctuation } from '../../src/pdf/direct-selection.mjs';
const chars = text => [...text].map((c,i)=>({c,rect:[i*6,0,i*6+6,12],inlineRect:[i*6,0,i*6+6,12],rotation:0}));
test('direct word selection retains an attached period, ellipsis and closing quote',()=>{
 for(const ending of ['.','?!','…','.”',');'])assert.equal(extendTrailingPunctuation(chars('word'+ending),4),4+ending.length);
});
test('punctuation never extends into another word or over a real space or line break',()=>{
 assert.equal(extendTrailingPunctuation(chars('word.next'),4),5);
 for(const prop of ['spaceAfter','lineBreakAfter','paragraphBreakAfter']){
  let c=chars('word.');c[3][prop]=true;assert.equal(extendTrailingPunctuation(c,4),4,prop);
 }
 let c=chars('word .');assert.equal(extendTrailingPunctuation(c,4),4);
});
test('separate lines, distant punctuation and auxiliary footnotes remain untouched',()=>{
 for(const change of [c=>{c[4].inlineRect=[24,20,30,32]},c=>{c[4].inlineRect=[40,0,46,12]},c=>{c[4].flowClass='auxiliary'},c=>{c[4].rotation=90}]){
  let c=chars('word.');change(c);assert.equal(extendTrailingPunctuation(c,4),4);
 }
});
test('rotated character geometry retains punctuation without crossing a line',()=>{
 for(const rotation of [90,180,270]){
  let c=chars('word.');c.forEach(x=>{x.rotation=rotation;if(rotation%180)x.inlineRect=[0,x.rect[0],12,x.rect[2]];});
  assert.equal(extendTrailingPunctuation(c,4),5);
 }
});
