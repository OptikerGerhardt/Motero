import test from 'node:test';
import assert from 'node:assert/strict';
import { isBlackReaderBookmark } from '../../src/common/reader-bookmark.mjs';
test('only semantic black bookmarks receive the special flag',()=>{
    assert.ok(isBlackReaderBookmark({type:'note',color:'#000000',comment:'Bookmark · today'}));
    assert.ok(isBlackReaderBookmark({type:'note',color:'#000000',comment:'Lesezeichen · heute'}));
    assert.ok(!isBlackReaderBookmark({type:'note',color:'#000000',comment:'ordinary note'}));
    assert.ok(!isBlackReaderBookmark({type:'note',color:'#2ea8e5',comment:'Bookmark · yesterday'}));
});
