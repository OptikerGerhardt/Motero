package org.zotero.android.screens.reader.toolbar

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
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
internal fun ReaderPdfAnnotationToolbar(viewModel: ReaderViewModel, state: ReaderViewState) {
    val tools = listOf(
        Triple(ReaderAnnotationTool.note, Drawables.annotate_note, Strings.pdf_annotation_toolbar_note),
        Triple(ReaderAnnotationTool.text, Drawables.annotate_text, Strings.pdf_annotation_toolbar_text),
        Triple(ReaderAnnotationTool.ink, Drawables.annotate_ink, Strings.pdf_annotation_toolbar_ink),
        Triple(ReaderAnnotationTool.eraser, Drawables.annotate_eraser, Strings.pdf_annotation_toolbar_eraser),
        Triple(ReaderAnnotationTool.image, Drawables.annotate_area, Strings.pdf_annotation_toolbar_image),
    )
    Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surfaceContainer) {
        Row(Modifier.widthIn(max = 560.dp).horizontalScroll(rememberScrollState()).padding(4.dp),
            verticalAlignment = Alignment.CenterVertically) {
            tools.forEach { (type, icon, title) ->
                IconToggleButton(checked = state.activeTool == type, onCheckedChange = { viewModel.toggle(type) },
                    modifier = Modifier.size(48.dp)) {
                    Icon(painterResource(icon), stringResource(title), Modifier.size(24.dp))
                }
            }
            IconButton(onClick = viewModel::undoAnnotation, enabled = state.canUndoAnnotation && !state.isReaderLoading,
                modifier = Modifier.size(48.dp)) {
                Icon(painterResource(Drawables.undo_24px), stringResource(R.string.reader_undo_annotation), Modifier.size(24.dp))
            }
            // A stable seventh slot keeps the dock from moving when tools change.
            val hex = state.activeTool?.let { state.toolColors[it] }
            val optionsLabel = stringResource(R.string.reader_tool_options)
            IconButton(onClick = viewModel::showToolOptions, enabled = state.activeTool != null,
                modifier = Modifier.size(48.dp).semantics { contentDescription = optionsLabel }) {
                Surface(Modifier.size(24.dp), shape = RoundedCornerShape(12.dp),
                    color = hex?.let { runCatching { Color(android.graphics.Color.parseColor(it)) }.getOrNull() }
                        ?: MaterialTheme.colorScheme.onSurfaceVariant) {}
            }
        }
    }
}
