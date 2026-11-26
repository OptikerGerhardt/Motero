package org.zotero.android.screens.reader.toolbar

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import org.zotero.android.R
import org.zotero.android.ereader.deviceTween
import org.zotero.android.ereader.rejectPenPalms
import org.zotero.android.screens.reader.ReaderViewModel
import org.zotero.android.screens.reader.ReaderViewState
import org.zotero.android.screens.reader.data.EpubProgressMarker
import kotlin.math.abs

@Composable
internal fun ReaderEpubAnnotationDock(viewModel: ReaderViewModel, state: ReaderViewState) {
    val tools = state.showCreationToolbar
    BoxWithConstraints(Modifier.fillMaxWidth().windowInsetsPadding(WindowInsets.navigationBarsIgnoringVisibility)
        .padding(horizontal = 8.dp, vertical = 12.dp), contentAlignment = Alignment.BottomCenter) {
        val layout = readerToolDockLayout(maxWidth.value, epub = true)
        val previewWidth = minOf(maxWidth * .8f, 560.dp)
        val toolWidth = layout.width.dp
        val (width, slide) = readerDockTransition(if (tools) toolWidth else previewWidth, tools)
        val optionsHeight by animateDpAsState(
            if (tools && state.pdfToolOptionsVisible) 48.dp else 0.dp,
            deviceTween(180), label = "epub tool options",
        )
        val travelPx = with(LocalDensity.current) { 60.dp.toPx() }
        Surface(Modifier.width(width).rejectPenPalms(),
            shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surfaceContainer) {
            Column {
                Box(Modifier.fillMaxWidth().height(optionsHeight).clipToBounds()) {
                    if (optionsHeight > 0.dp) ReaderPdfToolOptions(viewModel, state, Modifier.fillMaxWidth().height(48.dp))
                }
                Box(Modifier.fillMaxWidth().height(60.dp).clipToBounds()) {
                    EpubProgressTrack(viewModel, state, !tools,
                        Modifier.align(Alignment.Center).width(previewWidth).height(60.dp)
                            .graphicsLayer { translationY = -travelPx * slide })
                    if (slide > 0f || tools) ReaderPdfAnnotationToolbar(viewModel, state,
                        Modifier.align(Alignment.Center).width(minOf(width, toolWidth)).height(60.dp)
                            .graphicsLayer { translationY = travelPx * (1 - slide) },
                        enabled = tools, showRedo = layout.redo && width >= toolWidth)
                }
            }
        }
    }
}

@Composable
private fun EpubProgressTrack(viewModel: ReaderViewModel, state: ReaderViewState, enabled: Boolean, modifier: Modifier) {
    val markers = state.epubProgressMarkers
    val color = MaterialTheme.colorScheme.onSurface
    val bookmark = painterResource(R.drawable.ic_reader_bookmark)
    val title = stringResource(R.string.reader_epub_navigation)
    val chapterLabel = stringResource(R.string.reader_epub_chapter)
    val bookmarkLabel = stringResource(R.string.reader_epub_bookmark)
    fun markerLabel(marker: EpubProgressMarker): String =
        marker.title.ifBlank { if (marker.kind == "bookmark") bookmarkLabel else chapterLabel }
    var choices by remember { mutableStateOf(emptyList<EpubProgressMarker>()) }
    LaunchedEffect(enabled, markers) { choices = emptyList() }
    val current = (state.epubPageIndex ?: 0).toFloat() / ((state.epubPageCount ?: 1) - 1).coerceAtLeast(1)
    Box(modifier) {
        val interaction = if (enabled) Modifier
            .semantics {
                contentDescription = state.pageProgress?.let { "$title. $it" } ?: title
                customActions = markers.map { marker ->
                    CustomAccessibilityAction(markerLabel(marker)) {
                        viewModel.navigateEpubProgress(marker.fraction, marker)
                        true
                    }
                }
            }
            .pointerInput(markers) {
                detectTapGestures { point ->
                    val inset = 20.dp.toPx()
                    val trackWidth = (size.width - 2 * inset).coerceAtLeast(1f)
                    val hits = markers.filter { abs(point.x - (inset + it.fraction * trackWidth)) <= 24.dp.toPx() }
                        .sortedBy { abs(point.x - (inset + it.fraction * trackWidth)) }
                    if (hits.size > 1) choices = hits
                    else viewModel.navigateEpubProgress((point.x - inset) / trackWidth, hits.firstOrNull())
                }
            } else Modifier
        Canvas(Modifier.fillMaxSize().then(interaction)) {
            val inset = 20.dp.toPx()
            val trackWidth = (size.width - 2 * inset).coerceAtLeast(1f)
            val centerY = size.height / 2
            fun x(fraction: Float) = inset + trackWidth * fraction.coerceIn(0f, 1f)
            val divisions = (trackWidth / 10.dp.toPx()).toInt().coerceAtLeast(1)
            for (dot in 0..divisions) {
                drawCircle(color.copy(alpha = .44f), 1.5.dp.toPx(), Offset(x(dot.toFloat() / divisions), centerY))
            }
            for (marker in markers.filter { it.kind == "chapter" }) {
                drawCircle(color, 3.5.dp.toPx(), Offset(x(marker.fraction), centerY))
            }
            val flagSize = 14.dp.toPx()
            for (marker in markers.filter { it.kind == "bookmark" }) {
                val tint = marker.color?.removePrefix("#")?.takeIf { it.length == 6 }?.toLongOrNull(16)
                    ?.let { Color((0xFF000000L or it).toInt()) } ?: color
                translate(x(marker.fraction) - flagSize / 2, centerY - flagSize / 2) {
                    with(bookmark) { draw(Size(flagSize, flagSize), colorFilter = ColorFilter.tint(tint)) }
                }
            }
            val markerX = x(current)
            val gap = 8.dp.toPx()
            val tipSize = 3.dp.toPx()
            for (direction in listOf(-1, 1)) {
                val tipY = centerY + direction * gap
                val triangle = Path().apply {
                    moveTo(markerX, tipY)
                    lineTo(markerX - tipSize, tipY + direction * tipSize)
                    lineTo(markerX + tipSize, tipY + direction * tipSize)
                    close()
                }
                drawPath(triangle, color)
            }
        }
        DropdownMenu(expanded = enabled && choices.isNotEmpty(), onDismissRequest = { choices = emptyList() }) {
            choices.forEach { marker ->
                DropdownMenuItem(text = { Text(markerLabel(marker)) }, onClick = {
                    choices = emptyList()
                    viewModel.navigateEpubProgress(marker.fraction, marker)
                })
            }
        }
    }
}
