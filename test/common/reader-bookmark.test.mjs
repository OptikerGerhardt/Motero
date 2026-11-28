import test from 'node:test';
import assert from 'node:assert/strict';
import { isReaderBookmark, hasBookmarkTag, isLegacyReaderBookmark,
    removeLegacyBookmarkPrefix, isGeneratedBookmarkComment, bookmarkToggleOff, bookmarkColor, BOOKMARK_TAG } from '../../src/common/reader-bookmark.mjs';

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
    assert.equal(removeLegacyBookmarkPrefix('Bookmark · 10:30\nOwn notes'), '10:30\nOwn notes');
    assert.equal(removeLegacyBookmarkPrefix('Ordinary note'), 'Ordinary note');
});

test('Bookmark indicator color falls back safely for invalid annotation colors', () => {
    assert.equal(bookmarkColor({ color: '#ff6666' }), '#ff6666');
    assert.equal(bookmarkColor({ color: 'red' }), '#000000');
    assert.equal(bookmarkColor({ color: 'javascript:evil' }), '#000000');
});

test('only an untouched generated bookmark timestamp can be safely deleted', () => {
    const dateCreated = '2026-11-20T16:30:11.000Z';
    const formatted = new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'short', timeStyle: 'short'
    }).format(new Date(dateCreated));
    const basic = {
        type: 'note', dateCreated, tags: [{ name: 'Bookmark' }],
        comment: 'Bookmark · ' + formatted
    };
    assert.equal(isGeneratedBookmarkComment(basic, 'de-DE'), true);
    assert.equal(isGeneratedBookmarkComment({
        ...basic, comment: basic.comment + '\\nSeminar annotation'
    }, 'de-DE'), false);
    assert.equal(isGeneratedBookmarkComment({
        ...basic, comment: 'Bookmark · My own comment'
    }, 'de-DE'), false);
    assert.equal(isGeneratedBookmarkComment({
        ...basic, dateCreated: null
    }, 'de-DE'), false);
    assert.equal(isGeneratedBookmarkComment({
        ...basic, comment: 'A long note'
    }, 'de-DE'), false);
    assert.equal(isGeneratedBookmarkComment({
        ...basic, comment: 'Lesezeichen · ' + formatted,
        tags: []
    }, 'de-DE'), true);
});

test('corner shortcut deletes untouched markers but keeps user content or other tags', () => {
    const dateCreated = '2026-11-20T16:30:11.000Z';
    const timestamp = new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'short', timeStyle: 'short'
    }).format(new Date(dateCreated));
    const marker = { type: 'note', dateCreated, color: '#ff6666', tags: [{name:'Bookmark'}],
        comment: 'Bookmark · ' + timestamp };
    assert.deepEqual(bookmarkToggleOff(marker, 'de-DE'), {delete: true});
    assert.deepEqual(bookmarkToggleOff({
        ...marker, comment: marker.comment + '\\nOriginal research'
    }, 'de-DE'), {
        delete: false, changes: {tags: [], comment: timestamp + '\\nOriginal research'}
    });
    assert.deepEqual(bookmarkToggleOff({
        ...marker, tags: [{name: 'Bookmark'}, {name:'Important'}]
    }, 'de-DE'), {
        delete: false, changes: {tags:[{name:'Important'}], comment:timestamp}
    });
    assert.deepEqual(bookmarkToggleOff({
        ...marker, comment:'Custom comment', tags:[{name:'Bookmark'}]
    }, 'de-DE'), {
        delete: false, changes: {tags:[], comment:'Custom comment'}
    });
});
