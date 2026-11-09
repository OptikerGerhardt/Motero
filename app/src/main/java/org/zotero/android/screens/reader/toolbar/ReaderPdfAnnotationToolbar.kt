package org.zotero.android.screens.reader.toolbar

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.setValue
import androidx.compose.foundation.border
import androidx.compose.foundation.selection.selectable
import androidx.compose.ui.semantics.Role
import org.zotero.android.database.objects.AnnotationsConfig
import org.zotero.android.database.objects.AnnotationType
import java.util.Locale
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
import org.zotero.android.screens.reader.data.ReaderAnnotationTool
import org.zotero.android.uicomponents.Drawables
import org.zotero.android.uicomponents.Strings

/** An overlay dock: opening tools never resizes the PDF viewport. */
@Composable
internal fun ReaderPdfAnnotationToolbar(viewModel: ReaderViewModel, state: ReaderViewState, modifier: Modifier = Modifier, enabled: Boolean = true) {
    val tools = listOf(
        Triple(ReaderAnnotationTool.note, Drawables.annotate_note, Strings.pdf_annotation_toolbar_note),
        Triple(ReaderAnnotationTool.text, Drawables.annotate_text, Strings.pdf_annotation_toolbar_text),
        Triple(ReaderAnnotationTool.image, Drawables.annotate_area, Strings.pdf_annotation_toolbar_image),
        Triple(ReaderAnnotationTool.ink, Drawables.annotate_ink, Strings.pdf_annotation_toolbar_ink),
        Triple(ReaderAnnotationTool.eraser, Drawables.annotate_eraser, Strings.pdf_annotation_toolbar_eraser),
    )
    Row(modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
        tools.forEachIndexed { index, (type, icon, title) ->
            if (index == 2) {
                IconButton(onClick = viewModel::undoAnnotation, enabled = enabled && state.canUndoAnnotation && !state.isReaderLoading,
                    modifier = Modifier.size(48.dp)) {
                    Icon(painterResource(Drawables.undo_24px), stringResource(R.string.reader_undo_annotation), Modifier.size(24.dp))
                }
            }
            IconToggleButton(checked = state.activeTool == type, onCheckedChange = { viewModel.togglePdfTool(type) }, enabled = enabled,
                modifier = Modifier.size(48.dp)) {
                Icon(painterResource(icon), stringResource(title), Modifier.size(24.dp))
            }
        }
        // A stable seventh slot keeps the dock from moving when tools change.
        val hex = state.activeTool?.let { state.toolColors[it] }
        val optionsLabel = stringResource(R.string.reader_tool_options)
        IconButton(onClick = viewModel::togglePdfToolOptions, enabled = enabled && state.activeTool != null,
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
    val tool = state.activeTool ?: return
    val eraser = tool == ReaderAnnotationTool.eraser
    val storedSize = when (tool) {
        ReaderAnnotationTool.ink -> state.inkWidth
        ReaderAnnotationTool.eraser -> state.eraserSize
        ReaderAnnotationTool.text -> state.textFontSize
        else -> null
    }
    val sizeLabel = stringResource(Strings.size)
    var draftSize by remember(tool, storedSize) { mutableFloatStateOf(storedSize ?: 2f) }
    Row(modifier.padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        if (!eraser) {
            val type = when (tool) {
                ReaderAnnotationTool.ink -> AnnotationType.ink
                ReaderAnnotationTool.text -> AnnotationType.text
                ReaderAnnotationTool.image -> AnnotationType.image
                else -> AnnotationType.note
            }
            Row(Modifier.weight(1f).horizontalScroll(rememberScrollState()), verticalAlignment = Alignment.CenterVertically) {
                AnnotationsConfig.colors(type).forEach { hex ->
                    val selected = state.toolColors[tool].equals(hex, ignoreCase = true)
                    Box(Modifier.size(40.dp).selectable(selected, role = Role.RadioButton,
                        onClick = { viewModel.setPdfToolColor(hex) })
                        .semantics { contentDescription = hex }, contentAlignment = Alignment.Center) {
                        Surface(Modifier.size(26.dp).then(if (selected) Modifier.border(2.dp,
                            MaterialTheme.colorScheme.primary, RoundedCornerShape(13.dp)) else Modifier)
                            .padding(if (selected) 3.dp else 0.dp),
                            shape = RoundedCornerShape(13.dp), color = Color(android.graphics.Color.parseColor(hex))) {}
                    }
                }
            }
        }
        if (storedSize != null) {
            Slider(value = draftSize, onValueChange = { draftSize = it },
                onValueChangeFinished = { viewModel.setPdfToolSize(draftSize) },
                valueRange = if (tool == ReaderAnnotationTool.text) 6f..72f else .5f..25f,
                modifier = (if (eraser) Modifier.weight(1f) else Modifier.width(88.dp))
                    .semantics { contentDescription = sizeLabel })
            Text(String.format(Locale.getDefault(), "%.1f", draftSize),
                style = MaterialTheme.typography.labelSmall, modifier = Modifier.width(30.dp),
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
