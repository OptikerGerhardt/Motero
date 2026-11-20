import test from 'node:test';
import assert from 'node:assert/strict';
import { isReaderBookmark, hasBookmarkTag, isLegacyReaderBookmark, isBlackReaderBookmark,
    removeLegacyBookmarkPrefix, bookmarkColor, BOOKMARK_TAG } from '../../src/common/reader-bookmark.mjs';

test('Bookmark tag is canonical irrespective of note color or comment', () => {
    assert.equal(BOOKMARK_TAG, 'Bookmark');
    for (const color of ['#000000', '#2ea8e5', '#ff6666']) {
        const note = { type: 'note', color, comment: 'Research note', tags: [{ name: 'bookMARK' }] };
        assert.ok(hasBookmarkTag(note));
        assert.ok(isReaderBookmark(note));
        assert.equal(bookmarkColor(note), color);
    }
    assert.ok(isReaderBookmark({ type: 'note', tags: ['Bookmark'], comment: '' }));
    assert.ok(!isReaderBookmark({ type: 'highlight', tags: [{ name: 'Bookmark' }] }));
    assert.ok(!isReaderBookmark({ type: 'note', color: '#000000', comment: 'ordinary note', tags: [] }));
});

test('Legacy prefixes remain recognized without making ordinary notes bookmarks', () => {
    assert.ok(isReaderBookmark({ type: 'note', color: '#aaaaaa', comment: 'Lesezeichen · gestern' }));
    assert.ok(isLegacyReaderBookmark({ type: 'note', color: '#2ea8e5', comment: 'Bookmark · yesterday' }));
    assert.ok(isBlackReaderBookmark({ type: 'note', color: '#000000', comment: 'Bookmark · today' }));
    assert.ok(!isBlackReaderBookmark({ type: 'note', color: '#2ea8e5', comment: 'Bookmark · yesterday' }));
    assert.equal(removeLegacyBookmarkPrefix('Bookmark · 10:30\nOwn notes'), '10:30\nOwn notes');
    assert.equal(removeLegacyBookmarkPrefix('Ordinary note'), 'Ordinary note');
});

test('Bookmark indicator color falls back safely for invalid annotation colors', () => {
    assert.equal(bookmarkColor({ color: '#ff6666' }), '#ff6666');
    assert.equal(bookmarkColor({ color: 'red' }), '#000000');
    assert.equal(bookmarkColor({ color: 'javascript:evil' }), '#000000');
});
