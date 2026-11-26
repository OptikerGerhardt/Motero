package org.zotero.android.screens.reader.data

import org.zotero.android.database.objects.AnnotationType

// Tag membership identifies a bookmark. Keep the legacy prefix recognizer to
// preserve pre-migration bookmarks without rewriting users' note content.
private val bookmarkPrefix = Regex("^(?:Bookmark|Lesezeichen)\\s*·\\s*", RegexOption.IGNORE_CASE)
const val BOOKMARK_TAG = "Bookmark"

fun ReaderAnnotation.isReaderBookmark(): Boolean =
    type == AnnotationType.note &&
        (tags.any { it.name.trim().equals(BOOKMARK_TAG, ignoreCase = true) } ||
            bookmarkPrefix.containsMatchIn(comment))

fun ReaderAnnotation.bookmarkDetails(): String = comment.replaceFirst(bookmarkPrefix, "")
