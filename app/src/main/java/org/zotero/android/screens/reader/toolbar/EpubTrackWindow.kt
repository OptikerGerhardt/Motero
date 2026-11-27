package org.zotero.android.screens.reader.toolbar

import org.zotero.android.screens.reader.data.EpubProgressMarker

internal data class EpubTrackWindow(
    val start: Float,
    val end: Float,
    val markers: List<EpubProgressMarker>,
    val previous: EpubProgressMarker? = null,
    val next: EpubProgressMarker? = null,
) {
    fun project(fraction: Float): Float = ((fraction - start) / (end - start)).coerceIn(0f, 1f)
    fun unproject(position: Float): Float = start + position.coerceIn(0f, 1f) * (end - start)
}

internal fun epubTrackWindow(markers: List<EpubProgressMarker>, current: Float): EpubTrackWindow {
    val chapters = markers.filter { it.kind == "chapter" }.sortedBy { it.fraction }
    val visibleCount = 7
    if (chapters.size <= visibleCount) return EpubTrackWindow(0f, 1f, markers)

    val currentChapter = chapters.indexOfLast { it.fraction <= current }.coerceAtLeast(0)
    val from = (currentChapter - visibleCount / 2).coerceIn(0, chapters.size - visibleCount)
    val to = from + visibleCount
    val previous = chapters.getOrNull(from - 1)
    val next = chapters.getOrNull(to)
    val start = previous?.let { (it.fraction + chapters[from].fraction) / 2 } ?: 0f
    val end = next?.let { (it.fraction + chapters[to - 1].fraction) / 2 } ?: 1f
    val visible = chapters.subList(from, to) + markers.filter { it.kind != "chapter" && it.fraction in start..end }
    // Multiple table-of-contents entries can point to exactly the same page.
    return if (end > start) EpubTrackWindow(start, end, visible, previous, next)
        else EpubTrackWindow(0f, 1f, visible, previous, next)
}
