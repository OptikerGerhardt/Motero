import test from 'node:test';
import assert from 'node:assert/strict';
import {centeredPage,completePages} from '../../src/pdf/reading-interaction.mjs';
import {ReadingWorkQueue} from '../../src/pdf/reading-work-queue.mjs';
const viewport={left:0,top:0,right:400,bottom:800};
test('a previous-page fragment cannot receive the centered page bookmark',()=>{
 const pages=[{index:3,left:0,right:400,top:-600,bottom:70},{index:4,left:0,right:400,top:82,bottom:700},{index:5,left:0,right:400,top:712,bottom:1400}];
 assert.equal(centeredPage(pages,viewport),4);
 assert.equal(centeredPage(pages.map(p=>({...p,top:p.top-320,bottom:p.bottom-320})),viewport),5);
});
test('overview requires two complete full pages with only rounding tolerance',()=>{
 const pages=[{index:0,left:10,right:190,top:0,bottom:380},{index:1,left:10,right:190,top:392,bottom:802}];
 assert.equal(completePages(pages,viewport),2);
 assert.equal(completePages([{...pages[0]},{...pages[1],bottom:803}],viewport),1);
 assert.equal(completePages([{...pages[0],left:-3},{...pages[1]}],viewport),1);
});
test('analysis queue deduplicates pending jobs, bounds concurrency, and prioritizes the destination',async()=>{
 const q=new ReadingWorkQueue(2), releases=[], starts=[];
 const op=n=>()=>new Promise(r=>{starts.push(n);releases.push(()=>r(n));});
 const a=q.run(1,op(1)), b=q.run(2,op(2)), background=q.run(3,op(3),10), target=q.run(4,op(4),0);
 assert.equal(q.run(4,op(99)),target); await new Promise(setImmediate);
 assert.deepEqual(starts,[1,2]);assert.equal(q.running,2);
 releases.shift()();await new Promise(setImmediate);assert.deepEqual(starts,[1,2,4]);
 releases.shift()();await new Promise(setImmediate);assert.deepEqual(starts,[1,2,4,3]);
 releases.splice(0).forEach(f=>f());assert.deepEqual(await Promise.all([a,b,background,target]),[1,2,3,4]);
 await new Promise(setImmediate);assert.equal(q.jobs.size,0);q.close();
});
test('obsolete work and document close reject pending jobs and cancel active work',async()=>{
 const q=new ReadingWorkQueue(1);
 const a=q.run(1,signal=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(q.abortError()),{once:true})));
 const b=q.run(2,()=>42);const rejected=assert.rejects(b,{name:'AbortError'});
 await new Promise(setImmediate);q.cancelWhere(k=>k===2);await rejected;
 const stopped=assert.rejects(a,{name:'AbortError'});q.close();await stopped;
 await new Promise(setImmediate);assert.equal(q.jobs.size,0);assert.equal(q.running,0);
});
