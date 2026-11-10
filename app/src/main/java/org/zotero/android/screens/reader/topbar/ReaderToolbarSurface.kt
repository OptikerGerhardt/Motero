package org.zotero.android.screens.reader.topbar

import org.zotero.android.ereader.rejectPenPalms
import androidx.compose.animation.animateColor
import androidx.compose.animation.core.animateDp
import org.zotero.android.ereader.deviceTween as tween
import androidx.compose.animation.core.updateTransition
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp

/** One hierarchy keeps icon groups and focus intact as the sidebar opens. */
@Composable
internal fun ReaderToolbarSurface(
    floating: Boolean,
    leading: @Composable RowScope.() -> Unit,
    trailing: @Composable RowScope.() -> Unit,
) {
    val transition = updateTransition(floating, label = "reader header layout")
    val inset by transition.animateDp({ tween(220) }, "header edge inset") { if (it) 8.dp else 0.dp }
    val radius by transition.animateDp({ tween(220) }, "header corner radius") { if (it) 16.dp else 0.dp }
    val container by transition.animateColor({ tween(220) }, "header group color") {
        if (it) MaterialTheme.colorScheme.surfaceContainer else MaterialTheme.colorScheme.surface
    }
    val backdrop by transition.animateColor({ tween(220) }, "header background") {
        if (it) Color.Transparent else MaterialTheme.colorScheme.surface
    }
    Row(Modifier.fillMaxWidth().background(backdrop)
        .then(if (!floating) Modifier.pointerInput(Unit) {
            // Empty space in the full-width sidebar header is also chrome.
            // Child buttons consume their own taps before this parent handler.
            detectTapGestures(onTap = {}, onLongPress = {}, onDoubleTap = {})
        } else Modifier)
        .windowInsetsPadding(WindowInsets.statusBarsIgnoringVisibility.union(WindowInsets.displayCutout)
            .only(WindowInsetsSides.Top + WindowInsetsSides.Horizontal))
        .padding(horizontal = inset, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Surface(modifier = Modifier.rejectPenPalms(), shape = RoundedCornerShape(radius), color = container) {
            Row(Modifier.padding(4.dp), verticalAlignment = Alignment.CenterVertically, content = leading)
        }
        Spacer(Modifier.weight(1f))
        Surface(modifier = Modifier.rejectPenPalms(), shape = RoundedCornerShape(radius), color = container) {
            Row(Modifier.padding(4.dp), verticalAlignment = Alignment.CenterVertically, content = trailing)
        }
    }
}
