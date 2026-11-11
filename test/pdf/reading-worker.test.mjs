import test from 'node:test';
import assert from 'node:assert/strict';
import {ReadingAnalysisWorker} from '../../src/pdf/reading-worker-client.js';
import {compactReadingImage} from '../../src/pdf/reading-image.mjs';
import {analyzeReadingGeometry} from '../../src/pdf/reading-geometry.mjs';
const fixture=(index=0,priority=0)=>({index,priority,aspect:1,width:50,height:50,textOnly:false,lines:[],image:{width:50,height:50,data:new Uint8ClampedArray(10000).fill(255)}});
class FakeWorker {
 static instances=[];
 constructor(){FakeWorker.instances.push(this);this.jobs=[];this.images=new Map();queueMicrotask(()=>this.onmessage({data:{ready:true}}));}
 postMessage(value,transfer=[]){if(value.releaseImage){this.images.delete(value.releaseImage);return;}this.jobs.push(structuredClone(value,{transfer}));}
 finish(){const job=this.jobs.shift();if(job.page.image)this.images.set(job.imageID,compactReadingImage(job.page.image));if(job.imageID)job.page.image=this.images.get(job.imageID);this.onmessage({data:{id:job.id,result:analyzeReadingGeometry(job.page,job.model)}});}
 terminate(){this.terminated=true;}
}
test('worker transfers raster ownership, publishes only geometry, and prioritizes foreground over waiting samples',async()=>{
 const original=globalThis.Worker;globalThis.Worker=FakeWorker;
 const client=new ReadingAnalysisWorker();
 try{
  const first=fixture(0,10),a=client.analyze(first,{});await new Promise(setImmediate);
  const worker=FakeWorker.instances.at(-1);assert.equal(first.image.data.byteLength,0);
  const b=client.analyze(fixture(1,10),{}),c=client.analyze(fixture(2,0),{});await new Promise(setImmediate);
  worker.finish();await a;
  assert.equal(worker.jobs[0].page.index,2);worker.finish();assert.equal((await c).index,2);
  worker.finish();const result=await b;assert.equal(result.index,1);assert.equal('image' in result,false);
 }finally{client.close();globalThis.Worker=original;}
});
test('a worker failure rejects in-flight transfers and subsequent work uses the portable fallback',async()=>{
 const original=globalThis.Worker;globalThis.Worker=FakeWorker;const client=new ReadingAnalysisWorker();
 try{
  const pending=client.analyze(fixture(),{});await new Promise(setImmediate);
  FakeWorker.instances.at(-1).onerror();await assert.rejects(pending,{name:'ReadingWorkerError'});
  const result=await client.analyze(fixture(4),{});assert.equal(result.index,4);
 }finally{client.close();globalThis.Worker=original;}
});
test('superseded queued analyses release their buffers without disturbing the running page',async()=>{
 const original=globalThis.Worker;globalThis.Worker=FakeWorker;const client=new ReadingAnalysisWorker();
 try{
  const a=client.analyze(fixture(0),{});await new Promise(setImmediate);
  const page=fixture(10,5),b=client.analyze(page,{});await new Promise(setImmediate);
  client.cancelWhere(index=>index>5);await assert.rejects(b,{name:'AbortError'});
  assert.ok(page.image.data.byteLength>0);FakeWorker.instances.at(-1).finish();await a;
 }finally{client.close();globalThis.Worker=original;}
});

test('closing before worker startup releases the waiting caller immediately',async()=>{
 const original=globalThis.Worker;
 globalThis.Worker=class {terminate(){this.stopped=true;}};
 const client=new ReadingAnalysisWorker();
 try {
  const pending=client.analyze(fixture(),{});client.close();
  await assert.rejects(pending,{name:'AbortError'});
 } finally {globalThis.Worker=original;}
});

test('concurrent learning and foreground requests transfer a shared raster once and release it after the last use',async()=>{
 const original=globalThis.Worker;globalThis.Worker=FakeWorker;const client=new ReadingAnalysisWorker();
 try{
  const page=fixture(3),a=client.analyze(page,{}),b=client.analyze(page,{});
  await new Promise(setImmediate);const worker=FakeWorker.instances.at(-1);
  assert.equal(page.image.data.byteLength,0);assert.equal(worker.jobs.length,1);
  worker.finish();await a;assert.equal(worker.images.size,1);assert.equal(worker.jobs[0].page.image,undefined);
  worker.finish();await b;assert.equal(worker.images.size,0);
 }finally{client.close();globalThis.Worker=original;}
});
