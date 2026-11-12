import test from 'node:test';
import assert from 'node:assert/strict';
import {typicalReadingFrame} from '../../src/pdf/blank-page-frame.mjs';
import {analyzeReadingGeometry} from '../../src/pdf/reading-geometry.mjs';

test('only a demonstrably white text-free raster is a blank page',()=>{
    const page={index:1,aspect:1,width:100,height:100,lines:[],image:{width:100,height:100,channels:4,data:new Uint8ClampedArray(40000).fill(255)}};
    assert.equal(analyzeReadingGeometry(page,{}).blank,true);
    for (let i=2000;i<4000;i++) { page.image.data[i*4]=20; page.image.data[i*4+1]=20; page.image.data[i*4+2]=20; }
    assert.equal(analyzeReadingGeometry(page,{}).blank,false,'an image without a text layer remains content');
    page.image.data.fill(255);page.lines=[{text:'Visible OCR text',rect:[.1,.2,.9,.22]}];
    assert.equal(analyzeReadingGeometry(page,{}).blank,false,'a failed or incomplete raster cannot erase extracted text');
});
test('blank frames inherit a robust physical crop rather than a larger media-box percentage',()=>{
    const samples=[{width:800,height:1000,bounds:[.1,.1,.9,.9]},
        {width:1600,height:2000,bounds:[.3,.3,.7,.7]},
        {width:8000,height:10000,bounds:[0,0,1,1],blank:true}];
    const frame=typicalReadingFrame(samples);
    assert.ok(Math.abs(frame.width-640)<1e-9);assert.ok(Math.abs(frame.height-800)<1e-9);
    assert.equal(typicalReadingFrame(samples.filter(s=>s.blank)),null);
});
