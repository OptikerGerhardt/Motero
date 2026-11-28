package org.zotero.android.screens.reader.toolbar

import org.zotero.android.screens.reader.data.EpubProgressMarker

internal data class EpubTrackWindow(
    val start: Float,
    val end: Float,
    val markers: List<EpubProgressMarker>,
    val previous: List<EpubProgressMarker> = emptyList(),
    val next: List<EpubProgressMarker> = emptyList(),
) {
    fun project(fraction: Float): Float = ((fraction - start) / (end - start)).coerceIn(0f, 1f)
    fun unproject(position: Float): Float = start + position.coerceIn(0f, 1f) * (end - start)
}

internal fun epubTrackWindow(markers: List<EpubProgressMarker>, current: Float, markerBudget: Int = 7): EpubTrackWindow {
    val chapters = markers.filter { it.kind == "chapter" }
    if (chapters.size <= markerBudget) return EpubTrackWindow(0f, 1f, markers)

    val roots = chapters.groupBy { it.rootId ?: it.id }
    val rootStarts = roots.mapValues { (_, branch) -> branch.minOf { it.fraction } }
    val starts = rootStarts.values.distinct().sorted()
    val currentRootIndex = starts.indexOfLast { it <= current }.coerceAtLeast(0)
    val rootStart = starts[currentRootIndex]
    val localRoots = rootStarts.filterValues { it == rootStart }.keys
    val hasHierarchy = roots.values.any { it.size > 1 }
    val nextRoot = starts.getOrNull(currentRootIndex + 1)
    var start = if (currentRootIndex == 0) 0f else rootStart
    var limit = nextRoot
    if (!hasHierarchy) {
        val count = markerBudget.coerceIn(1, starts.size)
        val from = (currentRootIndex - count / 2).coerceIn(0, starts.size - count)
        start = if (from == 0) 0f else starts[from]
        limit = starts.getOrNull(from + count)
    } else {
        // Within an exceptionally dense branch, zoom into the immediate
        // subdivision containing the reader. Keep all levels in that span.
        var branch = chapters.filter { (it.rootId ?: it.id) in localRoots }
        while (branch.size > markerBudget) {
            val topDepth = branch.minOf { it.depth }
            val breaks = branch.filter { it.depth == topDepth + 1 }.map { it.fraction }
                .distinct().sorted().filter { it >= start && (limit == null || it < limit!!) }
            if (breaks.size < 2) break
            val index = breaks.indexOfLast { it <= current }.coerceAtLeast(0)
            val nextStart = breaks.getOrNull(index + 1) ?: limit
            if (index > 0) start = breaks[index]
            limit = nextStart
            branch = branch.filter { it.fraction >= start && (limit == null || it.fraction < limit!!) }
        }
    }
    val end = limit ?: 1f
    if (end <= start) return EpubTrackWindow(0f, 1f, markers)
    val visible = markers.filter { it.fraction >= start && (limit == null || it.fraction < end) }

    fun edgeMenu(heading: EpubProgressMarker): Boolean {
        val root = heading.rootId ?: heading.id
        // The adjacent part of the active top-level chapter stays expanded.
        // Elsewhere show the closest available heading to the root.
        return root in localRoots || heading.depth == roots.getValue(root).minOf { it.depth }
    }
    return EpubTrackWindow(start, end, visible,
        chapters.filter { it.fraction < start && edgeMenu(it) },
        if (limit == null) emptyList() else chapters.filter { it.fraction >= end && edgeMenu(it) })
}
