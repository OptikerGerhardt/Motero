package org.zotero.android.screens.reader.data

data class EpubProgressMarker(
    val kind: String,
    val locator: String,
    val title: String,
    val fraction: Float,
    val color: String?,
)
