import test from 'node:test';
import assert from 'node:assert/strict';
import { nextScrollCrossesPage } from '../../src/pdf/viewport-indicators.js';
import { bookmarkFlagRect } from '../../src/common/reader-bookmark.mjs';
const fixture=()=>({view:{_pageNavigation:{mode:'jumped'}},viewer:{pagesCount:4,currentPageNumber:1,spreadMode:0,container:{scrollTop:300}},limits:{min:0,max:300}});
test('next-page hint appears at the last scroll stop, never before or in Continuous',()=>{
 const {view,viewer,limits}=fixture();assert.equal(nextScrollCrossesPage(view,viewer,limits),true);
 viewer.container.scrollTop=200;assert.equal(nextScrollCrossesPage(view,viewer,limits),false);
 viewer.container.scrollTop=300;view._pageNavigation.mode='continuous';assert.equal(nextScrollCrossesPage(view,viewer,limits),false);
});
test('next column and final document page are not announced as another PDF page',()=>{
 const {view,viewer,limits}=fixture();view._pageFitting={columnActive:true,column:{index:0,columns:[[],[]]}};
 assert.equal(nextScrollCrossesPage(view,viewer,limits),false);
 view._pageFitting.column.index=1;assert.equal(nextScrollCrossesPage(view,viewer,limits),true);
 viewer.currentPageNumber=4;assert.equal(nextScrollCrossesPage(view,viewer,limits),false);
 viewer.currentPageNumber=3;viewer.spreadMode=1;assert.equal(nextScrollCrossesPage(view,viewer,limits),false);
});
test('bookmark flag stays on the physical page corner under zoom and rotation',()=>{
 assert.deepEqual(bookmarkFlagRect({width:600,scale:1}),[564,4,592,32]);
 assert.deepEqual(bookmarkFlagRect({width:1200,scale:2}),[1128,8,1184,64]);
 assert.deepEqual(bookmarkFlagRect({width:800,scale:1}),[764,4,792,32]);
});
