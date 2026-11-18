import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutReadingPages } from '../../src/pdf/cropped-page-layout.mjs';
const pages=[{index:0,width:300,height:400},{index:1,width:320,height:450},{index:2,width:200,height:250}];
for(const mode of [0,1,2]) test(`cropped layout ${mode} separates visible page frames without paper-margin gaps`,()=>{
    const result=layoutReadingPages(pages,{width:700,height:800,mode});
    assert.equal(result.boxes.length,3);
    for(const b of result.boxes) {
        assert.ok(b.x>=0 && b.y>=0);
        assert.ok(b.x+b.width<=result.width && b.y+b.height<=result.height);
    }
    for(let i=0;i<3;i++) for(let j=i+1;j<3;j++) {
        const a=result.boxes[i],b=result.boxes[j];
        assert.ok(a.x+a.width<=b.x || b.x+b.width<=a.x || a.y+a.height<=b.y || b.y+b.height<=a.y);
    }
    if(mode===0) assert.equal(result.boxes[1].y-result.boxes[0].y-result.boxes[0].height,8);
    if(mode===1) assert.equal(result.boxes[1].x-result.boxes[0].x-result.boxes[0].width,8);
    if(mode===2) {assert.equal(result.boxes[1].x-result.boxes[0].x-result.boxes[0].width,8);assert.ok(result.boxes[2].y>result.boxes[1].y+result.boxes[1].height);}
});


test('Continuous page separators grow without widening the gutter within a spread',()=>{
 const p=Array.from({length:4},(_,index)=>({index,width:200,height:400}));
 const r=layoutReadingPages(p,{width:900,height:800,mode:1,spreadMode:1,pageGap:16});
 assert.equal(r.boxes[1].x-r.boxes[0].x-200,8);
 assert.equal(r.boxes[2].x-r.boxes[1].x-200,16);
 assert.equal(r.boxes[3].x-r.boxes[2].x-200,8);
});

test('horizontal first and last single pages have enough room to center their visible content',()=>{
 for(const widths of [[180,260,140],[600,160,200]]) {
  const pages=widths.map((width,index)=>({index,width,height:400}));
  const r=layoutReadingPages(pages,{width:400,height:600,mode:1});
  for(const b of [r.boxes[0],r.boxes.at(-1)]) if(b.width<400) {
   const scroll=Math.max(0,Math.min(r.width-400,b.x+(b.width-400)/2));
   assert.ok(Math.abs(b.x+b.width/2-scroll-200)<.01);
  }
 }
});
