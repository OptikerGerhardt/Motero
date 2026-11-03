package org.zotero.android.screens.reader.settings

import java.util.Locale

/** Localized initials, with distinct prefixes when a translation shares initials. */
internal fun compactReaderOptionLabels(labels: List<String>): List<String> {
    val words = labels.map { Regex("[\\p{L}\\p{N}]+").findAll(it).map { match -> match.value }.toList() }
    val initials = words.map { parts -> parts.joinToString("") { it.take(1).uppercase(Locale.ROOT) } }
    val normalized = words.map { it.joinToString("") }
    return labels.indices.map { index ->
        val initial = initials[index]
        if (initial.isEmpty()) return@map labels[index]
        if (initials.count { it.equals(initial, ignoreCase = true) } == 1) return@map initial
        val word = normalized[index]
        (2..word.length).firstOrNull { count ->
            normalized.withIndex().none { (other, text) ->
                other != index && text.take(count).equals(word.take(count), ignoreCase = true)
            }
        }?.let { word.take(it) } ?: labels[index]
    }
}

/** Widths come from TextMeasurer with the current font, density and font scale. */
internal fun readerOptionLabel(full: String, compact: String, fullWidth: Int, availableWidth: Int): String =
    if (fullWidth <= availableWidth.coerceAtLeast(0)) full else compact
