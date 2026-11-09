import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFPageNavigation } from '../../src/pdf/page-navigation.js';

test('single-page visibility updates only the old and new page, even in a large document', () => {
    let mutations = 0, lookups = 0, overview = false;
    const classes = () => {
        const values = new Set();
        return { contains: x => values.has(x), add(x) { values.add(x); mutations++; },
            remove(x) { values.delete(x); mutations++; }, toggle(x, on) { on ? values.add(x) : values.delete(x); mutations++; } };
    };
    const pages = Array.from({length:2500}, (_,i) => ({id:i+1,div:{classList:classes()}}));
    const host = {classList:classes()};
    const viewer = {viewer:host,currentPageNumber:1200,getPageView(i) { lookups++; return pages[i]; },
        _getVisiblePages:()=>({views:[{id:1199},{id:1200},{id:1201}],ids:new Set([1199,1200,1201])})};
    const win = {document:{createElement:()=>({remove(){}}),head:{append(){}}},
        PDFViewerApplication:{pdfViewer:viewer,eventBus:{on(){},off(){}}},addEventListener(){},removeEventListener(){}};
    const view = {_iframeWindow:win,_options:{pageNavigation:'jumped'},_tool:{type:'pointer'},_booxReader:{isOverview:()=>overview}};
    const navigation = new PDFPageNavigation(view);
    assert.deepEqual(viewer._getVisiblePages().views.map(p=>p.id),[1200], 'PDF.js must not promote an invisible neighbor');
    const initial = mutations;
    for (let i=0;i<100;i++) navigation.sync();
    assert.equal(mutations,initial,'stationary scroll updates must not rewrite any page classes');
    assert.ok(lookups<=101,'visibility work must not scan all 2500 pages');
    viewer.currentPageNumber++;
    navigation.sync();
    assert.equal(mutations-initial,2,'only the previous and current page change');
    overview = true; navigation.sync();
    assert.equal(host.classList.contains('motero-jumped'),false);
    assert.equal(viewer._getVisiblePages().views.length,3,'overview retains every visible page');
    overview = false; navigation.sync();
    assert.equal(host.classList.contains('motero-jumped'),true);
    navigation.configure('continuous');
    assert.equal(host.classList.contains('motero-jumped'),false);
    navigation.destroy();
});

test('Jumped centers short pages but enters tall pages at the directional edge and preserves an in-page refit',()=>{
 const c={clientWidth:400,clientHeight:800,scrollLeft:0,scrollTop:2500};
 const fitting={layout:{boxes:[{x:0,y:2000,width:400,height:1400}]}}, viewer={container:c,currentPageNumber:1,getPageView:()=>({})};
 const n={mode:'jumped',viewer,view:{_pageFitting:fitting},clearSpacing(){}};
 const place=o=>PDFPageNavigation.prototype.centerCurrentPage.call(n,o);
 place({direction:1});assert.equal(c.scrollTop,2000);
 place({direction:-1});assert.equal(c.scrollTop,2600);
 c.scrollTop=2350;place({preservePosition:true});assert.equal(c.scrollTop,2350);
 fitting.layout.boxes[0].height=400;place({direction:1});assert.equal(c.scrollTop,1800);
 place({direction:-1});assert.equal(c.scrollTop,1800);
});
