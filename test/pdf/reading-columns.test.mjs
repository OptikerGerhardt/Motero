import test from 'node:test';
import assert from 'node:assert/strict';
import {detectReadingColumns,detectRasterColumns} from '../../src/pdf/reading-columns.mjs';
const line=(text,x0,y0,x1,y1)=>({text,rect:[x0,y0,x1,y1]});
const rows=(x0,x1)=>Array.from({length:24},(_,i)=>line('A complete scientific sentence on this line.',x0,.15+i*.026,x1,.166+i*.026));
test('detects two prose columns with unequal line endings and full-width title',()=>{
 const lines=[...rows(.1,.46),...rows(.54,.9),line('Full-width article title',.15,.06,.85,.09)];
 const columns=detectReadingColumns(lines,[.1,.06,.9,.8]);
 assert.deepEqual(columns,[[.1,.06,.46,.8],[.54,.06,.9,.8]]);
});
test('ordinary prose, short lists and sparse pages stay single-column',()=>{
 for(const lines of [rows(.1,.9),rows(.1,.46).slice(0,4),[...rows(.1,.46),...rows(.7,.75)]]) assert.equal(detectReadingColumns(lines,[.1,.06,.9,.8]),null);
});
test('full-width prose in the column body prevents a false split',()=>{
 assert.equal(detectReadingColumns([...rows(.1,.46),...rows(.54,.9),line('This body line crosses the supposed gutter.',.1,.4,.9,.416)],[.1,.06,.9,.8]),null);
});
test('side references and vertical text never become reading columns',()=>{
 const margin=rows(.01,.06).map(l=>({...l,sideCandidate:true}));
 assert.equal(detectReadingColumns([...rows(.14,.86),...margin],[.01,.06,.9,.8]),null);
});

test('scan fallback requires two separated text-like regions and rejects a solid photograph',()=>{
 const width=600,height=800,data=new Uint8ClampedArray(width*height).fill(255);
 const image={width,height,data,channels:1};
 for(let y=80;y<720;y+=24)for(const start of [60,330])for(let x=start;x<start+210;x+=8)
  for(let dy=0;dy<10;dy++)for(let dx=0;dx<3;dx++)data[(y+dy)*width+x+dx]=20;
 const columns=detectRasterColumns(image,[.1,.1,.9,.9]);assert.equal(columns?.length,2);
 assert.ok(columns[0][2]<.5 && columns[1][0]>.5);
 data.fill(50);assert.equal(detectRasterColumns(image,[.1,.1,.9,.9]),null);
 data.fill(255);assert.equal(detectRasterColumns(image,[.1,.1,.9,.9]),null);
});
