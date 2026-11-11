import test from 'node:test';
import assert from 'node:assert/strict';
import {nearbyTextCaret} from '../../src/dom/common/lib/text-caret.mjs';
const node={nodeType:3,textContent:'visible text',isConnected:true};
const doc={createRange:()=>({setStart(){},setEnd(){},getClientRects:()=>[{left:40,right:80,top:300,bottom:320,width:40,height:20}]})};
test('an offscreen or first-line caret cannot replace the text under a line gap',()=>{
 const wrong={offsetNode:{...node,textContent:'beginning'},offset:0};
 const local={offsetNode:node,offset:3};
 const measured={createRange:()=>{let n;return{setStart(x){n=x},setEnd(){},getClientRects:()=>[{left:40,right:80,top:n===node?300:0,bottom:n===node?320:20,width:40,height:20}]}}};
 assert.equal(nearbyTextCaret(measured,60,325,(x,y)=>y<320?local:wrong),local);
});
test('empty fields retain the previous range by returning no spurious target',()=>{
 assert.equal(nearbyTextCaret(doc,60,100,()=>({offsetNode:node,offset:2})),null);
 assert.equal(nearbyTextCaret(doc,60,310,()=>({offsetNode:{nodeType:1},offset:0})),null);
});
test('the caret search is bounded independently of chapter size',()=>{
 let calls=0;const pos={offsetNode:node,offset:2};
 assert.equal(nearbyTextCaret(doc,60,310,()=>{calls++;return pos}),pos);assert.equal(calls,1);
 nearbyTextCaret(doc,0,0,()=>{calls++;return null});assert.equal(calls,8);
});
