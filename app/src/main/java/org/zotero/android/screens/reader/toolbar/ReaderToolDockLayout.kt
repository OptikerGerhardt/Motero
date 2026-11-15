package org.zotero.android.screens.reader.toolbar

internal data class ReaderToolDockLayout(val width: Float, val redo: Boolean)

internal fun readerToolDockLayout(available: Float, epub: Boolean): ReaderToolDockLayout {
    val slots = if (epub) 5 else 7 // Undo, tools, options
    val redo = available >= (slots + 1) * 48f + 8f
    return ReaderToolDockLayout(minOf(available, (slots + if (redo) 1 else 0) * 48f + 8f), redo)
}
