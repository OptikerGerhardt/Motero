import test from 'node:test';
import assert from 'node:assert/strict';
import { bookmarkFlagRect } from '../../src/common/reader-bookmark.mjs';
test('bookmark flag stays on the physical page corner under zoom and rotation',()=>{
 assert.deepEqual(bookmarkFlagRect({width:600,scale:1}),[556,16,584,44]);
 assert.deepEqual(bookmarkFlagRect({width:1200,scale:2}),[1112,32,1168,88]);
 assert.deepEqual(bookmarkFlagRect({width:800,scale:1}),[756,16,784,44]);
});

test('viewport bookmark inset clears system bars and rounded screen corners even without chrome',async()=>{
 const {readerIndicatorPosition}=await import('../../src/common/reader-bookmark.mjs');
 const p=readerIndicatorPosition({top:0,left:0,width:393,height:900},{top:32,right:0});
 assert.deepEqual(p,{top:48,left:339});
 assert.equal(readerIndicatorPosition({top:0,left:0,width:393,height:900}).top,40,'hidden system bars retain a safe initial fallback');
 const notch=readerIndicatorPosition({top:0,left:0,width:800,height:500},{top:24,right:30});
 assert.ok(notch.left+34<=800-50);assert.ok(notch.top>=40);
});

test('the inset bookmark remains tappable on a short landscape viewport without stealing lower page turns',async()=>{
 const {readerBookmarkCorner,readerIndicatorPosition}=await import('../../src/common/reader-bookmark.mjs');
 const viewport={top:0,left:0,width:900,height:500},insets={top:32};
 const flag=readerIndicatorPosition(viewport,insets);
 assert.equal(readerBookmarkCorner(viewport,insets,flag.left+17,flag.top+17),true);
 assert.equal(readerBookmarkCorner(viewport,insets,890,250),false);
 assert.equal(readerBookmarkCorner(viewport,insets,20,30),false);
});
