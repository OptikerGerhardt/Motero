// Shared semantic recognition; ordinary black notes are not bookmarks.
export const isReaderBookmark = annotation => annotation?.type === 'note'
    && /^(?:Lesezeichen|Bookmark)\s*·\s*/i.test(annotation.comment || '');
export const isBlackReaderBookmark = annotation => isReaderBookmark(annotation)
    && /^#000000$/i.test(annotation.color || '');
export const BOOKMARK_FLAG_PATH = 'M6 3h12v18l-6-4-6 4z';
