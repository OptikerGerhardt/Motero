package org.zotero.android.screens.reader

import android.graphics.Rect
import android.os.Build
import android.view.View
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalView

/** Android limits exclusions; preserve system navigation and restore ownership on exit. */
@Composable
internal fun ReaderGestureProtection(enabled: Boolean) {
    val view = LocalView.current
    DisposableEffect(view, enabled) {
        if (Build.VERSION.SDK_INT < 29 || !enabled) return@DisposableEffect onDispose { }
        val previous = view.systemGestureExclusionRects
        fun apply() {
            val density = view.resources.displayMetrics.density
            val half = (100 * density).toInt()
            val edge = (24 * density).toInt()
            val center = view.height / 2
            view.systemGestureExclusionRects = listOf(
                Rect(0, (center - half).coerceAtLeast(0), edge, (center + half).coerceAtMost(view.height)),
                Rect((view.width - edge).coerceAtLeast(0), (center - half).coerceAtLeast(0), view.width, (center + half).coerceAtMost(view.height)),
            )
        }
        val listener = View.OnLayoutChangeListener { _, _, _, _, _, _, _, _, _ -> apply() }
        view.addOnLayoutChangeListener(listener)
        apply()
        onDispose { view.removeOnLayoutChangeListener(listener); view.systemGestureExclusionRects = previous }
    }
}
