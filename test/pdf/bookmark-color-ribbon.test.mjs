import test from 'node:test';
import assert from 'node:assert/strict';
import {
    BOOKMARK_COLORS, BOOKMARK_LONG_PRESS_MS, bookmarkPressMoved,
    bookmarkRibbonDuration, bookmarkRibbonGeometry
} from '../../src/pdf/bookmark-color-ribbon.mjs';
import { BookmarkGesture } from '../../src/pdf/bookmark-gesture.mjs';

test('bookmark flag palette matches Zotero and never changes global color', () => {
    assert.deepEqual(BOOKMARK_COLORS, [
        '#ffd400','#ff6666','#5fb236','#2ea8e5','#a28ae5',
        '#e56eee','#f19837','#aaaaaa','#000000'
    ]);
    assert.equal(new Set(BOOKMARK_COLORS).size, 9);
    assert.ok(Object.isFrozen(BOOKMARK_COLORS));
});

test('e-reader and reduced-motion preferences disable ALL ribbon animation', () => {
    assert.equal(bookmarkRibbonDuration(true), 0);
    assert.equal(bookmarkRibbonDuration(true, false), 0);
    assert.equal(bookmarkRibbonDuration(false, true), 0);
    assert.equal(bookmarkRibbonDuration(false, false), 180);
});

test('bookmark flag geometry is anchored and fits portrait/landscape', () => {
    for (const [width,height,top] of [[420,900,0],[820,340,0],[420,460,42]]) {
        const rect = {left:0,top,width,height,right:width,bottom:top+height};
        const position = bookmarkRibbonGeometry(rect,{top:24,right:4},{width,height:top+height});
        assert.ok(position.left >= 0);
        assert.ok(position.left + position.width <= width);
        assert.ok(position.top >= 0);
        assert.ok(position.top + position.height <= top + height);
        assert.ok(position.height >= 82);
    }
});

test('gestures tolerate small finger jitter, but cancel on pan', () => {
    const press = { x: 420, y: 30 };
    assert.equal(bookmarkPressMoved(press, {clientX:426,clientY:34}), false);
    assert.equal(bookmarkPressMoved(press, {clientX:429,clientY:34}), true);
});

function mockedGesture({readonly=false, tags=[], color='#ffd400'}={}) {
    const timers = new Map();
    let counter = 0;
    const view = {
        _options:{indicatorInsets:{}, bookmarkColor:'#000000',deviceProfile:{eReader:true}},
        _tool:{type:'pointer'}, _readOnly:readonly, _destroyed:false,
        _annotations:tags.length ? [{
            id:'ABCD1234',type:'note',position:{pageIndex:2},tags,color,comment:'Own note'
        }] : [],
        _pageFitting:{centeredPageIndex:()=>2}, _readerPriorityDown:{time:0},
        _clearPendingBackdropTap(){}, _clearPointerAction(){},
        _chromeTapGuard:{reset(){}}, _directHighlight:{reset(){}},
    };
    const boox = {
        view, win:{
            setTimeout(fn){const key=++counter;timers.set(key,fn);return key},
            clearTimeout(key){timers.delete(key)}
        },
        viewer:{currentPageNumber:3,container:{
            contains(){return true},
            getBoundingClientRect(){return {left:0,top:0,width:500,height:800,right:500,bottom:800}}
        }},
        isOverview(){return false}
    };
    const gesture = new BookmarkGesture(boox);
    const event={type:'pointerdown',isPrimary:true,pointerId:11,pointerType:'touch',
        target:{},clientX:482,clientY:26};
    return {gesture,boox,view,event,timers};
}

test('short press does not open a palette, long press does not generate a short tap', () => {
    const {gesture,event,timers,view} = mockedGesture();
    let opened = -1;
    gesture.open=page=>{opened=page};
    assert.equal(gesture.arm(event),true);
    assert.equal(gesture.finish(event),false);
    assert.equal(opened,-1);
    assert.equal(timers.size,0);
    assert.equal(gesture.arm(event),true);
    assert.equal(timers.size,1);
    [...timers.values()][0]();
    assert.equal(opened,2);
    assert.equal(view._readerPriorityDown,null);
    assert.equal(gesture.finish(event),true);
});

test('move, cancel, second pointer and read-only disallow unsafe actions', () => {
    const {gesture,event,timers,view} = mockedGesture();
    let opened=0;
    gesture.open=()=>opened++;
    assert.equal(gesture.arm(event),true);
    gesture.move({...event,clientX:event.clientX+9});
    assert.equal(gesture.press,null);
    assert.equal(timers.size,0);
    assert.equal(opened,0);
    assert.equal(gesture.arm(event),true);
    gesture.cancel(event);
    assert.equal(timers.size,0);
    assert.equal(gesture.finish(event),false);
    assert.equal(gesture.arm({...event,isPrimary:false,pointerId:22}),false);
    view._readOnly=true;
    assert.equal(gesture.arm(event),false);
});

test('read-only existing bookmark never starts a recolor gesture', () => {
    const {gesture,event,view} = mockedGesture({tags:[{name:'Bookmark'}]});
    view._annotations[0].readOnly=true;
    assert.equal(gesture.arm(event),false);
});

test('long press timer respects configured threshold', () => {
    assert.equal(BOOKMARK_LONG_PRESS_MS,450);
    const {gesture,event} = mockedGesture();
    gesture.open=()=>{};
    gesture.arm(event);
    gesture.press.time=Date.now()-BOOKMARK_LONG_PRESS_MS-10;
    assert.equal(gesture.finish(event),true);
});
