package org.zotero.android.screens.reader.toolbar

import androidx.compose.animation.core.animateDp
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.updateTransition
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import org.zotero.android.screens.reader.ReaderViewModel
import org.zotero.android.screens.reader.ReaderViewState
import org.zotero.android.screens.reader.scrubber.ReaderPageIndicatorLabel
import org.zotero.android.screens.reader.scrubber.ReaderPageScrubber
import org.zotero.android.screens.reader.scrubber.ReaderScrubberViewModel
import org.zotero.android.screens.reader.scrubber.ReaderScrubberViewState

/** A single bottom-anchored surface; mode changes never resize the PDF viewport. */
@Composable
internal fun ReaderPdfBottomDock(viewModel: ReaderViewModel, state: ReaderViewState, scrubber: ReaderScrubberViewModel) {
    val previews by scrubber.viewStates.observeAsState(ReaderScrubberViewState())
    val tools = state.showCreationToolbar
    val density = LocalDensity.current
    BoxWithConstraints(Modifier.fillMaxWidth().windowInsetsPadding(WindowInsets.navigationBarsIgnoringVisibility)
        .padding(horizontal = 8.dp, vertical = 12.dp), contentAlignment = Alignment.BottomCenter) {
        val previewWidth = minOf(maxWidth * .8f, 560.dp,
            (previews.thumbnailCache.size.coerceAtLeast(1) * 38 + 10).dp).coerceAtLeast(48.dp)
        val toolWidth = minOf(maxWidth, 344.dp)
        val transition = updateTransition(tools, label = "reader dock mode")
        // Complete the width change before swapping layers, whether the target
        // is wider (phone) or narrower (tablet/e-reader).
        val width by transition.animateDp(transitionSpec = {
            tween(durationMillis = 140)
        }, label = "dock width") { if (it) toolWidth else previewWidth }
        val slide by transition.animateFloat(transitionSpec = {
            tween(durationMillis = 180, delayMillis = 140)
        }, label = "dock tools slide") { if (it) 1f else 0f }
        val optionsHeight by animateDpAsState(
            if (tools && state.pdfToolOptionsVisible) 60.dp else 0.dp,
            tween(180), label = "dock options height")
        val travelPx = with(density) { 60.dp.toPx() }
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
            ReaderPageIndicatorLabel(visible = !tools, viewModel = scrubber)
            Surface(Modifier.width(width), shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surfaceContainer) {
                Column {
                    Box(Modifier.fillMaxWidth().height(optionsHeight).clipToBounds(), contentAlignment = Alignment.BottomCenter) {
                        if (tools && state.pdfToolOptionsVisible || optionsHeight > 0.dp) {
                            ReaderPdfToolOptions(viewModel, state, Modifier.fillMaxWidth().height(60.dp))
                        }
                    }
                    Box(Modifier.fillMaxWidth().height(60.dp).clipToBounds()) {
                        // Keep the scrubber mounted while tools are visible:
                        // measured slots and landmark requests survive the return.
                        ReaderPageScrubber(viewModel = scrubber,
                            enabled = !tools,
                            modifier = Modifier.align(Alignment.Center).width(previewWidth)
                                .graphicsLayer { translationY = -travelPx * slide })
                        if (slide > 0f || tools) ReaderPdfAnnotationToolbar(viewModel, state,
                            modifier = Modifier.fillMaxWidth().height(60.dp)
                                .graphicsLayer { translationY = travelPx * (1f - slide) }, enabled = tools)
                    }
                }
            }
        }
    }
}
