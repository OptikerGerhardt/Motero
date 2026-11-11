import test from 'node:test';
import assert from 'node:assert/strict';
import {readingUnit,completeReadingUnits} from '../../src/pdf/reading-unit.mjs';
import {layoutReadingPages} from '../../src/pdf/cropped-page-layout.mjs';
import {readerResourceBudget} from '../../src/common/reader-resource-budget.mjs';
test('spread parity preserves the cover and final unpaired pages',()=>{
 assert.deepEqual(Array.from({length:5},(_,i)=>readingUnit(i,5,1)),[[0,1],[0,1],[2,3],[2,3],[4]]);
 assert.deepEqual(Array.from({length:5},(_,i)=>readingUnit(i,5,2)),[[0],[1,2],[1,2],[3,4],[3,4]]);
 assert.deepEqual(readingUnit(3,5,0),[3]);
});
test('a complete spread is a reading unit, not an overview of two units',()=>{
 const frames=[{left:0,top:0,right:190,bottom:300},{left:202,top:0,right:392,bottom:300},
  {left:0,top:312,right:190,bottom:612},{left:202,top:312,right:392,bottom:612}];
 assert.equal(completeReadingUnits(frames,{left:0,top:0,right:400,bottom:300},1),1);
 assert.equal(completeReadingUnits(frames,{left:0,top:0,right:400,bottom:620},1),2);
});
test('vertical, horizontal and wrapped layouts never split a spread, including mixed page heights',()=>{
 for(const spreadMode of [1,2])for(const mode of [0,1,2]){
  const pages=Array.from({length:7},(_,index)=>({index,width:170,height:index%2?250:300}));
  const {boxes}=layoutReadingPages(pages,{width:400,height:600,mode,spreadMode});
  for(let i=0;i<pages.length;){const unit=readingUnit(i,pages.length,spreadMode);
   if(unit.length===2){const [a,b]=unit.map(i=>boxes[i]);assert.equal(a.x+a.width+12,b.x);assert.equal(a.y+a.height/2,b.y+b.height/2);}
   i=unit.at(-1)+1;
  }
 }
});
test('e-reader and low memory hints coordinate bounded image and geometry budgets',()=>{
 const standard=readerResourceBudget({},8);
 for(const hint of [{eReader:true},{lowMemory:true},{memoryClassMb:128}]){
  const b=readerResourceBudget(hint,8);assert.ok(b.thumbnailBytes<standard.thumbnailBytes);
  assert.ok(b.cropPages<standard.cropPages);assert.equal(b.prefetchRadius,2);
 }
 assert.deepEqual(readerResourceBudget({},1),readerResourceBudget({eReader:true},8));
});
