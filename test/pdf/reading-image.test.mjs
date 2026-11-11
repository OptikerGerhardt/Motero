import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compactReadingImage} from '../../src/pdf/reading-image.mjs';
import {getReadingBounds,buildReadingModel} from '../../src/pdf/reading-layout.mjs';
export function cropCorpus(bounds=getReadingBounds,modelFor=buildReadingModel) {
 const results=[];let seed=54321;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed>>>24;};
 for(let n=0;n<96;n++){
  const width=100,height=140,data=new Uint8ClampedArray(width*height*4).fill(255);
  const put=(x,y,r,g,b)=>{const i=(y*width+x)*4;data[i]=r;data[i+1]=g;data[i+2]=b;};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   if(n%3===0)put(x,y,205,205,205);
   if(x>17&&x<80&&y>24&&y<115&&y%9<3)put(x,y,n%2?0:rand(),n%2?0:rand(),n%2?0:rand());
   if(n%4===0&&y===15&&x>15&&x<85)put(x,y,250,0,0);
   if(n%5===0&&x<8&&y>30&&y<100&&y%10<3)put(x,y,0,0,0);
   if(n%7===0&&rand()<2)put(x,y,rand(),rand(),rand());
  }
  const lines=n%3===0?[]:[{text:'12 — An author',rect:[.17,.06,.8,.1]},
   ...Array.from({length:8},(_,i)=>({text:'A substantial line of body text that belongs to this page.',rect:[.18,.2+i*.07,.8,.23+i*.07]})),
   {text:'Generated for private use',rect:[.2,.92,.8,.96]}];
  const model=modelFor([{index:0,lines},{index:2,lines},{index:4,lines}]);
  results.push(bounds({width,height,data},lines,model,0));
 }
 return createHash('sha256').update(JSON.stringify(results)).digest('hex');
}
test('compact analysis planes preserve grayscale and colored ink without retaining RGBA',()=>{
 const gray={width:2,height:1,data:new Uint8ClampedArray([210,210,210,255,0,0,0,255])};
 const a=compactReadingImage(gray);assert.equal(a.data.byteLength,2);assert.equal(a.red,null);assert.deepEqual([...a.data],[210,0]);
 const color=compactReadingImage({width:1,height:1,data:new Uint8ClampedArray([255,0,128,255])});
 assert.equal(color.data[0],0);assert.equal(color.red[0],255);
});
test('96 gray/color/noise/header/footer corpora retain the pre-worker crop geometry',()=>{
 assert.equal(cropCorpus(), '45da750134702115fd4bbc100c700c533145b38d94491224b73270fc8f266bd1');
});
