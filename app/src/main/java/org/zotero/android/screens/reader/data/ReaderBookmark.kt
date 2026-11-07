package org.zotero.android.screens.reader.data

import org.zotero.android.database.objects.AnnotationType

// Existing gray bookmarks and new blue bookmarks share their persisted marker.
// Color is editable, so it must not determine bookmark identity.
private val bookmarkPrefix = Regex("^(?:Bookmark|Lesezeichen)\\s*·\\s*", RegexOption.IGNORE_CASE)

fun ReaderAnnotation.isReaderBookmark(): Boolean =
    type == AnnotationType.note && bookmarkPrefix.containsMatchIn(comment)

fun ReaderAnnotation.bookmarkDetails(): String = comment.replaceFirst(bookmarkPrefix, "")
