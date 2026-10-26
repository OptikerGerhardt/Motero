package org.zotero.android.uicomponents

import androidx.activity.compose.LocalActivity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import org.zotero.android.screens.dashboard.DashboardActivity

@Composable
internal fun ReaderHardwareButtons(enabled: Boolean, onTurnPage: (Boolean) -> Unit) {
    val dashboard = LocalActivity.current as? DashboardActivity ?: return
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val callback = rememberUpdatedState(onTurnPage)
    DisposableEffect(dashboard, lifecycle, enabled) {
        val handler: (Boolean) -> Unit = { callback.value(it) }
        fun update() {
            if (enabled && lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) {
                dashboard.readerPageTurnHandler = handler
            } else if (dashboard.readerPageTurnHandler === handler) {
                dashboard.readerPageTurnHandler = null
            }
        }
        val observer = LifecycleEventObserver { _, _ -> update() }
        lifecycle.addObserver(observer)
        update()
        onDispose {
            lifecycle.removeObserver(observer)
            if (dashboard.readerPageTurnHandler === handler) dashboard.readerPageTurnHandler = null
        }
    }
}
