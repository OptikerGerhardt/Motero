import test from 'node:test';
import assert from 'node:assert/strict';
import { MobilePenInput } from '../../src/common/mobile-pen-input.mjs';

function fixture(profile = {}) {
    const listeners = new Map(), attrs = new Set(), erasers = [];
    const target = {addEventListener(n,f){(listeners.get(n)||listeners.set(n,[]).get(n)).push(f);},removeEventListener(){}};
    const win = {...target, setTimeout, document:{...target,hidden:false,head:{append(){}},
        createElement(){return {remove(){}};},documentElement:{toggleAttribute(n,on){if(on)attrs.add(n);else attrs.delete(n);}}}};
    let takeovers = 0;
    const input = new MobilePenInput(win,{profile,onEraser:a=>erasers.push(a),onTakeover:()=>takeovers++});
    function send(type, pointerType, pointerId = 1, extra = {}) {
        const e = {type,pointerType,pointerId,button:0,buttons:type==='pointerup'?0:1,cancelable:true,
            stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};
        for (const f of listeners.get(type)||[]) { f(e); if(e.stopped)break; }
        return e;
    }
    return {input, send, attrs, erasers, takeovers:()=>takeovers};
}

test('a pen takes over an earlier finger; palms cannot move or release its stroke', () => {
    const f=fixture();
    assert.equal(f.send('pointerdown','touch',5).stopped,false);
    f.send('pointerdown','pen',8);
    assert.equal(f.takeovers(),1);
    assert.equal(f.send('pointermove','touch',5).stopped,true);
    assert.equal(f.send('pointerup','touch',5).stopped,true);
    assert.equal(f.input.owner,8);
    assert.equal(f.send('pointerup','pen',8).stopped,false);
    assert.equal(f.input.owner,null);
    f.input.destroy();
});

test('all palm contacts remain suppressed until lifted, beyond the 300 ms guard', t => {
    t.mock.timers.enable({apis:['Date'],now:1000});
    const f=fixture();f.send('pointerdown','pen',8);f.send('pointerdown','touch',4);
    f.send('pointerup','pen',8);
    t.mock.timers.tick(350);
    assert.equal(f.send('pointermove','touch',4).stopped,true);
    assert.equal(f.send('pointerup','touch',4).stopped,true);
    assert.equal(f.send('pointerdown','touch',7).stopped,false);
    f.input.destroy();
});

test('fresh fingers are guarded for 300 ms; normal scrolling has no delay after that', t => {
    t.mock.timers.enable({apis:['Date'],now:1000});
    const f=fixture();f.send('pointerdown','pen',1);f.send('pointerup','pen',1);
    assert.equal(f.send('pointerdown','touch',2).stopped,true);f.send('pointerup','touch',2);
    t.mock.timers.tick(301);
    assert.equal(f.send('pointerdown','touch',3).stopped,false);
    assert.equal(f.send('pointermove','touch',3).stopped,false);f.input.destroy();
});

test('a palm native touch stream cannot start a pinch during pen ownership', () => {
    const f=fixture();f.send('pointerdown','pen',1);
    assert.equal(f.send('touchstart',null,0,{touches:[{identifier:2}]}).stopped,true);
    assert.equal(f.send('touchmove',null,0,{touches:[{identifier:2},{identifier:3}]}).stopped,true);
    f.input.reset();assert.equal(f.send('touchstart',null,0,{touches:[{identifier:4}]}).stopped,false);f.input.destroy();
});

test('hold and physical eraser restore the tool after release; toggle changes only on press edges', async () => {
    const f=fixture();f.send('pointerdown','pen',1,{buttons:3});assert.deepEqual(f.erasers,[true]);
    f.send('pointermove','pen',1,{buttons:3});assert.deepEqual(f.erasers,[true]);
    f.send('pointerup','pen',1);await new Promise(r=>setTimeout(r,0));assert.deepEqual(f.erasers,[true,false]);
    f.send('pointerdown','pen',1,{button:5,buttons:32});assert.equal(f.input.eraser,true);f.input.reset();assert.equal(f.input.eraser,false);
    f.input.applyProfile({eraserButtonMode:'toggle'});
    f.send('pointerdown','pen',1,{buttons:3});f.send('pointermove','pen',1,{buttons:3});f.send('pointerup','pen',1);
    assert.equal(f.input.eraser,true);
    f.send('pointerdown','pen',1,{buttons:3});assert.equal(f.input.eraser,false);f.input.destroy();
});

test('focus loss and cancellation recover ownership and eraser; profile does not change theme', () => {
    const f=fixture({eReader:true,penOnly:true});
    assert.ok(f.attrs.has('data-e-reader'));assert.ok(f.attrs.has('data-pen-exclusive'));
    f.send('pointerdown','pen',1,{buttons:3});f.send('blur');
    assert.equal(f.input.owner,null);assert.equal(f.input.eraser,false);
    assert.equal(f.send('pointerdown','touch',4).stopped,false);
    f.input.applyProfile({eReader:false,penOnly:false});assert.equal(f.attrs.size,0);f.input.destroy();
});
