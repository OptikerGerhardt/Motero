package org.zotero.android.screens.reader.toolbar

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.gestures.snapping.rememberSnapFlingBehavior
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.foundation.selection.selectable
import androidx.compose.ui.semantics.Role
import org.zotero.android.database.objects.AnnotationsConfig
import org.zotero.android.database.objects.AnnotationType
import kotlin.math.roundToInt
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import org.zotero.android.R
import org.zotero.android.screens.reader.ReaderViewModel
import org.zotero.android.screens.reader.ReaderViewState
import org.zotero.android.screens.reader.snapInkWidth
import org.zotero.android.screens.reader.readerInkWidths
import androidx.compose.ui.graphics.graphicsLayer
import org.zotero.android.screens.reader.data.ReaderAnnotationTool
import org.zotero.android.uicomponents.Drawables
import org.zotero.android.uicomponents.Strings

/** An overlay dock: opening tools never resizes the PDF viewport. */
@Composable
internal fun ReaderPdfAnnotationToolbar(viewModel: ReaderViewModel, state: ReaderViewState, modifier: Modifier = Modifier, enabled: Boolean = true, showRedo: Boolean = false) {
    val tools = if (state.fileType == org.zotero.android.screens.reader.data.ReaderFileType.EPUB) listOf(
        Triple(ReaderAnnotationTool.highlight, Drawables.annotate_highlight, Strings.pdf_annotation_toolbar_highlight),
        Triple(ReaderAnnotationTool.underline, Drawables.annotate_underline, Strings.pdf_annotation_toolbar_underline),
        Triple(ReaderAnnotationTool.note, Drawables.annotate_note, Strings.pdf_annotation_toolbar_note),
    ) else listOf(
        Triple(ReaderAnnotationTool.note, Drawables.annotate_note, Strings.pdf_annotation_toolbar_note),
        Triple(ReaderAnnotationTool.text, Drawables.annotate_text, Strings.pdf_annotation_toolbar_text),
        Triple(ReaderAnnotationTool.image, Drawables.annotate_area, Strings.pdf_annotation_toolbar_image),
        Triple(ReaderAnnotationTool.ink, Drawables.annotate_ink, Strings.pdf_annotation_toolbar_ink),
        Triple(ReaderAnnotationTool.eraser, Drawables.annotate_eraser, Strings.pdf_annotation_toolbar_eraser),
    )
    Row(modifier.fillMaxHeight().horizontalScroll(rememberScrollState()).padding(horizontal = 4.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
        val historyEnabled = enabled && !state.isReaderLoading
        Box(Modifier.size(48.dp).clip(CircleShape)
            .combinedClickable(enabled = historyEnabled && (state.canUndoAnnotation || state.canRedoAnnotation),
                onClickLabel = stringResource(R.string.reader_undo_annotation),
                onLongClickLabel = stringResource(R.string.reader_redo_annotation),
                onClick = viewModel::undoAnnotation, onLongClick = viewModel::redoAnnotation), contentAlignment = Alignment.Center) {
            Icon(painterResource(Drawables.undo_24px), stringResource(R.string.reader_undo_annotation), Modifier.size(24.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = if (historyEnabled && (state.canUndoAnnotation || state.canRedoAnnotation)) 1f else .38f))
        }
        if (showRedo) IconButton(onClick = viewModel::redoAnnotation,
            enabled = historyEnabled && state.canRedoAnnotation, modifier = Modifier.size(48.dp)) {
            Icon(painterResource(Drawables.undo_24px), stringResource(R.string.reader_redo_annotation),
                Modifier.size(24.dp).graphicsLayer { scaleX = -1f })
        }
        tools.forEach { (type, icon, title) ->
            IconToggleButton(checked = state.activeTool == type, onCheckedChange = { viewModel.togglePdfTool(type) }, enabled = enabled,
                modifier = Modifier.size(48.dp)) {
                Icon(painterResource(icon), stringResource(title), Modifier.size(24.dp))
            }
        }
        // Keep the options slot present when the active tool changes.
        val hex = if (state.activeTool == null) state.bookmarkColor else state.toolColors[state.activeTool]
        val optionsLabel = stringResource(if (state.activeTool == null) R.string.reader_bookmark_default_color else R.string.reader_tool_options)
        IconButton(onClick = viewModel::togglePdfToolOptions, enabled = enabled,
            modifier = Modifier.size(48.dp).semantics { contentDescription = optionsLabel }) {
            Surface(Modifier.size(24.dp), shape = RoundedCornerShape(12.dp),
                color = hex?.let { runCatching { Color(android.graphics.Color.parseColor(it)) }.getOrNull() }
                    ?: MaterialTheme.colorScheme.onSurfaceVariant) {}
        }
    }
}

/** The native Zotero palette and size controls, in the dock instead of a modal. */
@Composable
internal fun ReaderPdfToolOptions(viewModel: ReaderViewModel, state: ReaderViewState, modifier: Modifier = Modifier) {
    val tool = state.activeTool
    val eraser = tool == ReaderAnnotationTool.eraser
    val storedSize = when (tool) {
        ReaderAnnotationTool.ink -> state.inkWidth
        ReaderAnnotationTool.eraser -> state.eraserSize
        ReaderAnnotationTool.text -> state.textFontSize
        else -> null
    }
    val sizeLabel = stringResource(Strings.size)
    var draftSize by remember(tool, storedSize) { mutableFloatStateOf(storedSize ?: 2f) }
    val type = when (tool) {
        ReaderAnnotationTool.ink -> AnnotationType.ink
        ReaderAnnotationTool.text -> AnnotationType.text
        ReaderAnnotationTool.image -> AnnotationType.image
        else -> AnnotationType.note
    }
    val colors = if (tool == null) AnnotationsConfig.allColors else AnnotationsConfig.colors(type)
    val currentColor = if (tool == null) state.bookmarkColor else state.toolColors[tool]
    BoxWithConstraints(modifier.padding(horizontal = 4.dp)) {
        val slot = maxOf(40.dp, maxWidth / colors.size.coerceAtLeast(1))
        val paletteInset = if (eraser) 0.dp else (slot - 26.dp) / 2
        Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.Center) {
            if (!eraser) {
                val paletteScroll = rememberLazyListState()
                LazyRow(Modifier.fillMaxWidth().height(48.dp), state = paletteScroll, verticalAlignment = Alignment.CenterVertically,
                    flingBehavior = rememberSnapFlingBehavior(paletteScroll)) {
                    items(colors.size) { i -> ReaderToolColor(colors[i], currentColor, slot, viewModel::setPdfToolColor) }
                }
            }
            if (storedSize != null || eraser) Row(Modifier.fillMaxWidth().height(48.dp).padding(start = paletteInset), verticalAlignment = Alignment.CenterVertically) {
                if (storedSize != null) {
                    val ink = tool == ReaderAnnotationTool.ink
                    Slider(value = if (ink) readerInkWidths.indexOf(snapInkWidth(draftSize)).toFloat() else draftSize,
                        onValueChange = { draftSize = if (ink) readerInkWidths[it.roundToInt().coerceIn(readerInkWidths.indices)] else it },
                        steps = if (ink) readerInkWidths.size - 2 else 0,
                        onValueChangeFinished = { viewModel.setPdfToolSize(draftSize) },
                        valueRange = if (ink) 0f..readerInkWidths.lastIndex.toFloat() else if (tool == ReaderAnnotationTool.text) 6f..72f else .5f..25f,
                        modifier = Modifier.weight(1f)
                            .semantics { contentDescription = sizeLabel })
                    Text(java.text.NumberFormat.getNumberInstance().apply { maximumFractionDigits = 2 }.format(draftSize),
                        style = MaterialTheme.typography.labelSmall, modifier = Modifier.width(40.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                if (eraser) {
                    SingleChoiceSegmentedButtonRow {
                        listOf("area" to R.string.reader_area_eraser, "stroke" to R.string.reader_stroke_eraser).forEachIndexed { i, (mode, label) ->
                            SegmentedButton(selected = state.eraserMode == mode, onClick = { viewModel.setPdfEraserMode(mode) },
                                shape = SegmentedButtonDefaults.itemShape(i, 2), icon = {}) {
                                Text(stringResource(label), style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ReaderToolColor(hex: String, current: String?, slot: androidx.compose.ui.unit.Dp, onSelect: (String) -> Unit) {
    val selected = current.equals(hex, ignoreCase = true)
    Box(Modifier.width(slot).height(40.dp).clip(CircleShape)
        .selectable(selected, role = Role.RadioButton, onClick = { onSelect(hex) })
        .semantics { contentDescription = hex }, contentAlignment = Alignment.Center) {
        Canvas(Modifier.size(26.dp)) {
            drawCircle(Color(android.graphics.Color.parseColor(hex)))
            if (selected) drawCircle(Color.White, radius = 10.dp.toPx(), style = Stroke(2.dp.toPx()))
        }
    }
}
