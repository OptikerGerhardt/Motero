package org.zotero.android.screens.reader.data

data class EpubProgressMarker(
    val kind: String,
    val locator: String,
    val title: String,
    val fraction: Float,
    val color: String?,
    val id: String = locator,
    val parentId: String? = null,
    val rootId: String? = null,
    val depth: Int = 0,
)
