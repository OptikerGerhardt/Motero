import test from 'node:test';
import assert from 'node:assert/strict';
import { ReadingGeometryCache } from '../../src/pdf/reading-geometry-cache.mjs';
const page = index => ({ index, aspect:.75, bounds:[.1,.1,.9,.9], withMarginalia:[.05,.1,.95,.9], marginalia:[[.02,.2,.04,.3]], image:{ private:'must not persist' }, lines:['private text'] });
function storage() { const values = new Map(); return { getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),values }; }
test('reopen reuses geometry and keeps documents isolated without saving page content',()=>{
    const s=storage(), a=new ReadingGeometryCache(s,'first',300);a.put(page(4));a.flush();
    assert.deepEqual(new ReadingGeometryCache(s,'first',300).get(4).bounds,[.1,.1,.9,.9]);
    assert.equal(new ReadingGeometryCache(s,'second',300).get(4),undefined);
    assert.equal(new ReadingGeometryCache(s,'first',301).get(4),undefined);
    assert.ok(![...s.values.values()][0].includes('private'));
});
test('bounded cache rejects invalid geometry and survives unavailable storage',()=>{
    const s=storage(), a=new ReadingGeometryCache(s,'id',300);
    for(let i=0;i<200;i++)a.put(page(i));
    a.put({...page(200),bounds:[0,0,NaN,1]}); a.flush();
    const b=new ReadingGeometryCache(s,'id',300);
    assert.equal(b.pages.size,128);assert.equal(b.get(200),undefined);
    assert.doesNotThrow(()=>new ReadingGeometryCache({getItem(){throw Error();}},'id',3).flush());
    assert.doesNotThrow(()=>new ReadingGeometryCache({getItem:()=>'{bad',setItem(){throw Error();}},'id',3).flush());
});
test('cached learning contains only validated geometry, never repeated header text',()=>{
    const s=storage(),a=new ReadingGeometryCache(s,'id',300);
    const profiles={profiles:[[.1,.1,.9,.9],[.1,.1,.9,.9]],width:.8};
    a.setLearning({aspect:.75,profiles,withMarginalia:profiles,model:{repeated:new Set(['personal header']),bodyHeight:.02,headerBands:[{y0:.04,y1:.06,text:'private'}]}});
    a.flush();const b=new ReadingGeometryCache(s,'id',300);
    assert.equal(b.learning.aspect,.75);assert.equal(b.learning.model.headerBands.length,1);
    assert.ok(![...s.values.values()][0].includes('personal'));
    assert.ok(![...s.values.values()][0].includes('private'));
});
