package org.zotero.android.sync

import java.util.Locale
import kotlin.math.max

// The existing migration's exact ASCII format, without loading a PDF engine.
object AnnotationSortIndex {
    fun format(pageIndex: Int, textOffset: Int, minY: Int): String =
        String.format(Locale.US, "%05d|%06d|%05d", pageIndex, textOffset, max(0, minY))
}
