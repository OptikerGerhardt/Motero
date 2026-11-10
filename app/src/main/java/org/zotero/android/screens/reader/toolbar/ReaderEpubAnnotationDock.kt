package org.zotero.android.screens.reader.toolbar

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.unit.dp
import org.zotero.android.ereader.deviceTween
import org.zotero.android.ereader.rejectPenPalms
import org.zotero.android.screens.reader.ReaderViewModel
import org.zotero.android.screens.reader.ReaderViewState

/** EPUB supports text highlights, underlines and anchored notes, without PDF thumbnails. */
@Composable
internal fun ReaderEpubAnnotationDock(viewModel: ReaderViewModel, state: ReaderViewState) {
    val optionsHeight by animateDpAsState(if (state.pdfToolOptionsVisible) 60.dp else 0.dp, deviceTween(180), label = "epub tool options")
    Surface(Modifier.windowInsetsPadding(WindowInsets.navigationBarsIgnoringVisibility)
        .padding(horizontal = 8.dp, vertical = 12.dp).widthIn(max = 248.dp).rejectPenPalms(),
        shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surfaceContainer) {
        Column {
            Box(Modifier.fillMaxWidth().height(optionsHeight).clipToBounds()) {
                if (optionsHeight > 0.dp) ReaderPdfToolOptions(viewModel, state, Modifier.fillMaxWidth().height(60.dp))
            }
            ReaderPdfAnnotationToolbar(viewModel, state, Modifier.fillMaxWidth().height(60.dp))
        }
    }
}
