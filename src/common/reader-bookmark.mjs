// The Bookmark tag is the canonical marker. Older notes using a localized
// comment prefix remain discoverable without rewriting their user data.
export const BOOKMARK_TAG = 'Bookmark';
export const isLegacyReaderBookmark = annotation => annotation?.type === 'note'
    && /^(?:Lesezeichen|Bookmark)\s*·\s*/i.test(annotation.comment || '');
export const hasBookmarkTag = annotation => annotation?.type === 'note'
    && Array.isArray(annotation.tags)
    && annotation.tags.some(tag => String(tag?.name ?? tag ?? '').trim().toLowerCase() === 'bookmark');
export const isReaderBookmark = annotation => annotation?.type === 'note'
    && (hasBookmarkTag(annotation) || isLegacyReaderBookmark(annotation));
export const isBlackReaderBookmark = annotation => isLegacyReaderBookmark(annotation)
    && /^#000000$/i.test(annotation.color || '');
export const removeLegacyBookmarkPrefix = comment =>
    String(comment || '').replace(/^(?:Lesezeichen|Bookmark)\s*·\s*/i, '');
export const bookmarkColor = annotation =>
    /^#[0-9a-f]{6}$/i.test(annotation?.color || '') ? annotation.color : '#000000';
export const BOOKMARK_FLAG_PATH = 'M5 2h14v20l-7-4.5-7 4.5z';

// Stable PDF-page corner in viewport coordinates, independent of saved note rects.
export function bookmarkFlagRect(viewport) {
    const scale=viewport.scale || 1, size=30*scale;
    const right=viewport.width-16*scale,top=16*scale;
    return [right-size,top,right,top+size];
}

// Reserved system-bar space remains safe even while chrome is hidden.
export function readerIndicatorPosition(viewport, insets = {}, size = 34) {
    // Android may deliver hidden-bar insets after the first rendered frame.
    const gap=Math.max(24,Number(insets.top)||0,Number(insets.right)||0)+8;
    return {top:viewport.top+Math.min(gap,Math.max(0,viewport.height-size-12)),
        left:viewport.left+Math.max(12,viewport.width-gap-size)};
}

export function readerBookmarkCorner(viewport, insets, x, y) {
    const flag=readerIndicatorPosition(viewport,insets);
    return x>=viewport.left+viewport.width/2 && x<=viewport.left+viewport.width
        && y>=viewport.top && y<=Math.min(viewport.top+viewport.height,
            Math.max(viewport.top+viewport.height/11,flag.top+34));
}
