package org.zotero.android.screens.reader

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import org.zotero.android.R
import org.zotero.android.pdf.reader.sidebar.PdfReaderSidebarDivider

@Composable
internal fun BoxScope.ReaderBottomPanel(viewModel: ReaderViewModel, viewState: ReaderViewState) {
    Column(Modifier.fillMaxWidth().height(48.dp).align(Alignment.BottomStart)
        .background(MaterialTheme.colorScheme.surfaceContainer)) {
        PdfReaderSidebarDivider()
        Row(Modifier.fillMaxWidth().weight(1f), verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = viewModel::showAnnotationTagFilter,
                contentPadding = PaddingValues(horizontal = 8.dp)) {
                val count = viewState.annotationFilter?.tags?.size ?: 0
                Text(stringResource(R.string.boox_filter_tags) + if (count > 0) " ($count)" else "")
            }
            LazyRow(Modifier.weight(1f), contentPadding = PaddingValues(end = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(0.dp),
                verticalAlignment = Alignment.CenterVertically) {
                items(viewModel.annotationFilterColors(), key = { it }) { color ->
                    ReaderFilterColorButton(color, viewState.annotationFilter?.colors?.contains(color) == true) {
                        viewModel.toggleAnnotationFilterColor(color)
                    }
                }
            }
        }
    }
}
