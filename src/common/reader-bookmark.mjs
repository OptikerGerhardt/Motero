// Shared semantic recognition; ordinary black notes are not bookmarks.
export const isReaderBookmark = annotation => annotation?.type === 'note'
    && /^(?:Lesezeichen|Bookmark)\s*·\s*/i.test(annotation.comment || '');
export const isBlackReaderBookmark = annotation => isReaderBookmark(annotation)
    && /^#000000$/i.test(annotation.color || '');
export const BOOKMARK_FLAG_PATH = 'M5 2h14v20l-7-4.5-7 4.5z';
