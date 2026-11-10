import test from 'node:test';
import assert from 'node:assert/strict';
import {ReadingWorkQueue} from '../../src/pdf/reading-work-queue.mjs';
test('pen input pauses queued background analysis while foreground work and resumption remain available', async () => {
    const q=new ReadingWorkQueue(2),started=[];
    q.pauseBackground(true);
    const background=q.run('neighbor',async()=>{started.push('background');return 2;},5);
    const foreground=q.run('reading',async()=>{started.push('foreground');return 1;},0);
    assert.equal(await foreground,1);assert.deepEqual(started,['foreground']);
    q.pauseBackground(false);assert.equal(await background,2);assert.deepEqual(started,['foreground','background']);q.close();
});
