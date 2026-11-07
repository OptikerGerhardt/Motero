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
    if(mode===0) assert.equal(result.boxes[1].y-result.boxes[0].y-result.boxes[0].height,12);
    if(mode===1) assert.equal(result.boxes[1].x-result.boxes[0].x-result.boxes[0].width,12);
    if(mode===2) {assert.equal(result.boxes[1].x-result.boxes[0].x-result.boxes[0].width,12);assert.ok(result.boxes[2].y>result.boxes[1].y+result.boxes[1].height);}
});
