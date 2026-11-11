package org.zotero.android.screens.reader

import android.view.ViewGroup
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.lifecycle.map
import androidx.lifecycle.distinctUntilChanged
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
    val recovery = remember(viewModel) {
        viewModel.viewStates.map { it.rendererGeneration to it.rendererFailed }.distinctUntilChanged()
    }
    val state by recovery.observeAsState(0 to false)
    org.zotero.android.ereader.DeviceProfileStore.initialize(androidx.compose.ui.platform.LocalContext.current)
    val deviceProfile by org.zotero.android.ereader.DeviceProfileStore.state.collectAsState()
    androidx.compose.runtime.DisposableEffect(viewModel) {
        val handler: (Boolean) -> Unit = { active -> viewModel.setHardwareEraser(active) }
        org.zotero.android.ereader.DeviceInput.onEraser = handler
        onDispose {
            org.zotero.android.ereader.DeviceInput.reset()
            if (org.zotero.android.ereader.DeviceInput.onEraser === handler) org.zotero.android.ereader.DeviceInput.onEraser = null
        }
    }
    androidx.compose.runtime.LaunchedEffect(deviceProfile) { viewModel.applyDeviceProfile(deviceProfile) }
    val context = androidx.compose.ui.platform.LocalContext.current.applicationContext
    androidx.compose.runtime.DisposableEffect(context, viewModel) {
        val callback = object : android.content.ComponentCallbacks2 {
            override fun onConfigurationChanged(configuration: android.content.res.Configuration) = Unit
            override fun onLowMemory() = viewModel.trimReaderMemory()
            override fun onTrimMemory(level: Int) {
                if (level == android.content.ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW ||
                    level == android.content.ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL ||
                    level >= android.content.ComponentCallbacks2.TRIM_MEMORY_BACKGROUND) viewModel.trimReaderMemory()
            }
        }
        context.registerComponentCallbacks(callback)
        onDispose { context.unregisterComponentCallbacks(callback) }
    }
    val background = MaterialTheme.colorScheme.surface.toArgb()
    if (state.second) {
        Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(stringResource(R.string.reader_recovery_failed))
            Button(onClick = viewModel::retryReaderRenderer) { Text(stringResource(R.string.reader_retry)) }
        }
        return
    }
    key(state.first) {
    AndroidView(
        modifier = modifier,
        factory = { context ->
            val webView = ReaderCustomWebView(android.view.ContextThemeWrapper(context, R.style.ReaderWebViewThemeOverlay))
            webView.setReaderBackground(background)
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
        update = { it.setReaderBackground(background) }
    )
    }
}
