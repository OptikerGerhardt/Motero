package org.zotero.android.screens.reader

import kotlin.math.abs

/** Repeatable fine pen widths; large marker sizes need fewer positions. */
internal val readerInkWidths: List<Float> =
    (5..10).map { it / 10f } + (5..12).map { it / 4f } +
    (7..12).map { it / 2f } + (7..12).map { it.toFloat() } +
    (7..12).map { it * 2f } + 25f

internal fun snapInkWidth(value: Float): Float =
    readerInkWidths.minBy { abs(it - value.coerceIn(.5f, 25f)) }
