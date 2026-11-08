package org.zotero.android.screens.reader

import android.view.ViewGroup
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.toArgb
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.material3.Button
import androidx.compose.ui.Alignment
import androidx.compose.ui.res.stringResource
import org.zotero.android.R
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import org.zotero.android.architecture.ui.CustomLayoutSize
import org.zotero.android.screens.reader.web.ReaderCustomWebView

@Composable
fun ReaderWebView(viewModel: ReaderViewModel, modifier: Modifier = Modifier) {
    val layoutType = CustomLayoutSize.calculateLayoutType()
    val isTablet = layoutType.isTablet()
    val textFont = MaterialTheme.typography.bodyMedium
    val state by viewModel.viewStates.observeAsState(ReaderViewState())
    val background = MaterialTheme.colorScheme.surface.toArgb()
    if (state.rendererFailed) {
        Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(stringResource(R.string.reader_recovery_failed))
            Button(onClick = viewModel::retryReaderRenderer) { Text(stringResource(R.string.reader_retry)) }
        }
        return
    }
    key(state.rendererGeneration) {
    AndroidView(
        modifier = modifier,
        factory = { context ->
            val webView = ReaderCustomWebView(context)
            webView.setBackgroundColor(background)
            webView.layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            webView.onUserGestureDetected = { viewModel.onDocumentUserGestureDetected() }
            viewModel.initOnce(isTablet = isTablet, textFont = textFont)
            viewModel.initEveryTime(webView = webView)
            webView
        },
        onRelease = { it.stopLoading(); it.destroy() },
        update = { it.setBackgroundColor(background) }
    )
    }
}
