package org.zotero.android.screens.reader

import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.foundation.layout.*
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.zotero.android.screens.reader.SidebarDivider
import org.zotero.android.screens.reader.scrubber.ReaderScrubberViewModel
import org.zotero.android.screens.reader.sidebar.ReaderSidebar

@Composable
internal fun ReaderSideBySideMode(
    viewModel: ReaderViewModel,
    viewState: ReaderViewState,
    scrubberViewModel: ReaderScrubberViewModel,
    annotationsLazyListState: LazyListState,
    annotationMaxSideSize: Int,
) {
    // The Reader owns its safe area once. Outer EPUB padding used to add a
    // second, asymmetric status-bar offset on tablets and on bar toggles.
    BoxWithConstraints(Modifier.fillMaxSize().clipToBounds()) {
        val sidebarWidth = minOf(330.dp, maxWidth * .45f)
        val target = if (viewState.showSideBar) sidebarWidth else 0.dp
        val visibleWidth by animateDpAsState(target, org.zotero.android.ereader.deviceTween(220), label = "reader sidebar placement")
        val density = LocalDensity.current
        Row(Modifier.fillMaxSize()) {
            Spacer(Modifier.width(target))
            Box(Modifier.weight(1f).fillMaxHeight().graphicsLayer {
                translationX = with(density) { (visibleWidth-target).toPx() }
            }) {
                ReaderBox(viewState = viewState, viewModel = viewModel,
                    scrubberViewModel = scrubberViewModel, isOverlayMode = false)
            }
        }
        if (viewState.showSideBar || visibleWidth > 0.dp) {
            Row(Modifier.width(sidebarWidth).fillMaxHeight().graphicsLayer {
                translationX = with(density) { (visibleWidth-sidebarWidth).toPx() }
            }) {
                Box(Modifier.weight(1f).fillMaxHeight()) {
                    ReaderSidebar(viewModel = viewModel, viewState = viewState,
                        annotationsLazyListState = annotationsLazyListState, annotationMaxSideSize = annotationMaxSideSize)
                }
                SidebarDivider(Modifier.width(1.dp).fillMaxHeight())
            }
        }
    }
}
