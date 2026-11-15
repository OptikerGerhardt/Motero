package org.zotero.android.screens.reader

import kotlin.math.roundToInt

/** The slider and persisted pen width use the same half-point positions. */
internal fun snapInkWidth(value: Float): Float =
    (value.coerceIn(.5f, 25f) * 2).roundToInt() / 2f
