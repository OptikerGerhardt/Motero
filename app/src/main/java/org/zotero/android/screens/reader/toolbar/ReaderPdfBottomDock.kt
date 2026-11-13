package org.zotero.android.screens.reader.toolbar

import org.zotero.android.ereader.rejectPenPalms
import androidx.compose.animation.core.animateDpAsState
import org.zotero.android.ereader.deviceTween as tween
import androidx.compose.animation.core.Animatable
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
        val targetWidth = if (tools) toolWidth.value else previewWidth.value
        val animatedWidth = remember { Animatable(targetWidth) }
        val animatedSlide = remember { Animatable(if (tools) 1f else 0f) }
        // Sequence from the actual animated width. Reversing mid-transition or
        // receiving more thumbnails cannot turn an expansion into early clipping.
        LaunchedEffect(tools, targetWidth) {
            val timing = dockTiming(animatedWidth.value, targetWidth)
            val targetSlide = if (tools) 1f else 0f
            if (timing.widthDelay == 0) {
                if (animatedWidth.value != targetWidth) animatedWidth.animateTo(targetWidth, tween(timing.contentDelay))
                if (animatedSlide.value != targetSlide) animatedSlide.animateTo(targetSlide, tween(180))
            } else {
                if (animatedSlide.value != targetSlide) animatedSlide.animateTo(targetSlide, tween(timing.widthDelay))
                if (animatedWidth.value != targetWidth) animatedWidth.animateTo(targetWidth, tween(140))
            }
        }
        val width = animatedWidth.value.dp
        val slide = animatedSlide.value
        val optionTool = state.activeTool ?: state.pdfOptionsTool
        val optionSize = if (optionTool == org.zotero.android.screens.reader.data.ReaderAnnotationTool.ink ||
            optionTool == org.zotero.android.screens.reader.data.ReaderAnnotationTool.text) 96.dp else 48.dp
        val optionsHeight by animateDpAsState(
            if (tools && state.pdfToolOptionsVisible) optionSize else 0.dp,
            tween(180), label = "dock options height")
        val travelPx = with(density) { 60.dp.toPx() }
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
            ReaderPageIndicatorLabel(visible = !tools, viewModel = scrubber)
            Surface(Modifier.width(width).rejectPenPalms(), shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surfaceContainer) {
                Column {
                    Box(Modifier.fillMaxWidth().height(optionsHeight).clipToBounds(), contentAlignment = Alignment.BottomCenter) {
                        if (tools && state.pdfToolOptionsVisible || optionsHeight > 0.dp) {
                            ReaderPdfToolOptions(viewModel, state, Modifier.fillMaxWidth().height(optionSize))
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

internal data class DockTiming(val widthDelay: Int, val contentDelay: Int)
internal fun dockTiming(from: Float, to: Float): DockTiming =
    if (to > from) DockTiming(0, 140) else DockTiming(180, 0)
