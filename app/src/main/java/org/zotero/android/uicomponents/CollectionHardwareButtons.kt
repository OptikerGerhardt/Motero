package org.zotero.android.uicomponents

import kotlinx.coroutines.launch
import androidx.activity.compose.LocalActivity
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import org.zotero.android.screens.dashboard.DashboardActivity

@Composable
internal fun CollectionHardwareButtons(state: LazyListState, enabled: Boolean = true) {
    val dashboard = LocalActivity.current as? DashboardActivity ?: return
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val scope = rememberCoroutineScope()
    val distance = with(LocalDensity.current) { 120 * density }
    DisposableEffect(dashboard, lifecycle, state, enabled, distance) {
        val handler: (Boolean) -> Unit = { next -> scope.launch { state.scrollBy(if (next) distance else -distance) } }
        fun update() {
            if (enabled && lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) dashboard.collectionScrollHandler = handler
            else if (dashboard.collectionScrollHandler === handler) dashboard.collectionScrollHandler = null
        }
        val observer = LifecycleEventObserver { _, _ -> update() }
        lifecycle.addObserver(observer); update()
        onDispose { lifecycle.removeObserver(observer); if (dashboard.collectionScrollHandler === handler) dashboard.collectionScrollHandler = null }
    }
}
