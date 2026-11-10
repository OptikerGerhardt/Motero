import test from 'node:test';
import assert from 'node:assert/strict';
import { wordOffsets } from '../../src/dom/common/mobile-word-range.mjs';

test('mobile word selection retains accents and attached sentence punctuation', () => {
    const text = 'Die Urteilskraft.» Danach';
    const [start,end] = wordOffsets(text,8);
    assert.equal(text.slice(start,end),'Urteilskraft.»');
});
test('adjacent punctuation does not swallow the following word', () => {
    const text = 'alpha,beta';
    const [start,end] = wordOffsets(text,2);
    assert.equal(text.slice(start,end),'alpha,');
});
test('blank lines and standalone punctuation are not text selections', () => {
    assert.equal(wordOffsets('   ',1),null);
    assert.equal(wordOffsets('…',0),null);
});
test('CJK selection uses language-aware segmentation instead of an entire paragraph', () => {
    const text = '你好世界。后面';
    const [start,end] = wordOffsets(text,2);
    assert.equal(text.slice(start,end),'世界');
});
