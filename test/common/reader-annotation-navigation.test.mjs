import test from 'node:test';
import assert from 'node:assert/strict';
import {navigateReaderAnnotation} from '../../src/common/reader-annotation-navigation.mjs';
const annotation={id:'a',position:{pageIndex:7}};
test('PDF selection and jumps enter the fitting page controller instead of a raw annotation destination',async()=>{
 const calls=[],view={_navigateToPage:async l=>calls.push(l),navigate:()=>assert.fail('raw PDF navigation would bypass cropping')};
 assert.equal(await navigateReaderAnnotation(view,annotation),true);
 assert.deepEqual(calls,[{pageIndex:7}]);
});
test('overview return and EPUB CFI positions retain their own navigation paths',async()=>{
 const calls=[],view={_booxReader:{isOverview:()=>true,enterPage:async i=>calls.push(i)},navigate:async l=>calls.push(l)};
 assert.equal(await navigateReaderAnnotation(view,annotation),true);
 const position={type:'FragmentSelector',value:'epubcfi(...)'};
 assert.equal(await navigateReaderAnnotation(view,{position}),true);
 assert.deepEqual(calls,[7,{position}]);
});
test('rapid selections serialize navigation and stale requests cannot position the wrong highlight',async()=>{
 let finish,active=0,max=0;const calls=[];
 const view={_navigateToPage:async l=>{active++;max=Math.max(max,active);calls.push(l.pageIndex);if(l.pageIndex===7)await new Promise(r=>finish=r);active--;}};
 const first=navigateReaderAnnotation(view,annotation);
 await new Promise(setImmediate);
 const second=navigateReaderAnnotation(view,{position:{pageIndex:3}});
 finish();assert.equal(await first,false);assert.equal(await second,true);
 assert.equal(max,1);assert.deepEqual(calls,[7,3]);
 view._destroyed=true;assert.equal(await navigateReaderAnnotation(view,annotation),false);
});

test('a cancelled page entry cannot center an invisible annotation on another page',async()=>{
 const view={_pageFitting:{viewer:{currentPageNumber:2,getPageView(){assert.fail('stale target must not be positioned');}}},_navigateToPage:async()=>false};
 assert.equal(await navigateReaderAnnotation(view,annotation),false);
});
