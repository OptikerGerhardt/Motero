package org.zotero.android.screens.reader.filter.data

import org.zotero.android.screens.reader.data.ReaderAnnotationsFilter
import org.zotero.android.sync.Tag

data class ReaderFilterArgs(
    val filter: ReaderAnnotationsFilter?,
    val availableColors: MutableList<String>,
    val libraryId: org.zotero.android.sync.LibraryIdentifier,
    val documentKey: String? = null,
    val availableTags: List<Tag>
)