import test from 'node:test';
import assert from 'node:assert/strict';
import {pageLineBalance} from '../../src/dom/epub/page-frame.mjs';
test('unused fractional text line is shared equally above and below the EPUB frame',()=>{
 for(const height of [600,900,1200])for(const margin of [20,64,91])for(const line of [18,24,31.2]) {
  const balance=pageLineBalance(height,margin,line),usable=height-2*(margin+balance);
  assert.ok(balance>=0 && balance<line/2+.01);
  assert.ok(Math.abs(usable/line-Math.round(usable/line))<.001);
 }
});
test('full bleed and degenerate EPUB frames remain unchanged',()=>{
 assert.equal(pageLineBalance(900,0,24),0);assert.equal(pageLineBalance(20,10,24),0);
 assert.equal(pageLineBalance(900,20,NaN),0);
});

test('unequal system insets balance text within the actual readable region',()=>{
 const top=24,bottom=88,h=900,line=27,b=pageLineBalance(h,top,line,bottom);
 const usable=h-top-bottom-2*b;
 assert.ok(Math.abs(usable/line-Math.round(usable/line))<.001);
 assert.equal(((top+b)+(h-bottom-b))/2,(h+top-bottom)/2);
});
