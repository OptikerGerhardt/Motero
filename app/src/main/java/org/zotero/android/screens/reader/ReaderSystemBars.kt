package org.zotero.android.screens.reader

import android.view.View
import android.view.Window
import android.view.ViewTreeObserver
import androidx.compose.runtime.*
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.Lifecycle
import org.zotero.android.architecture.ui.ObserveLifecycleEvent

// Apply after Compose commits, and again when an editor/dialog returns focus.
// The PDF itself stays edge-to-edge; system bars only overlay it while visible.
@Composable
internal fun ReaderSystemBars(window: Window, view: View, chromeVisible: Boolean, isDark: Boolean) {
    val bars = WindowInsetsCompat.Type.systemBars()
    val controller = WindowCompat.getInsetsController(window, window.decorView)
    val synchronize = remember(window, view, chromeVisible, isDark) {
        Runnable {
            if (view.hasWindowFocus()) {
                controller.isAppearanceLightStatusBars = !isDark
                controller.isAppearanceLightNavigationBars = !isDark
                controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                if (chromeVisible) controller.show(bars) else controller.hide(bars)
            }
        }
    }
    SideEffect {
        view.removeCallbacks(synchronize)
        view.post(synchronize)
    }
    ObserveLifecycleEvent { event ->
        if (event == Lifecycle.Event.ON_RESUME) view.post(synchronize)
    }
    DisposableEffect(window, view, synchronize) {
        val observer = view.viewTreeObserver
        val listener = ViewTreeObserver.OnWindowFocusChangeListener { focused ->
            if (focused) view.post(synchronize)
        }
        observer.addOnWindowFocusChangeListener(listener)
        view.post(synchronize)
        onDispose {
            view.removeCallbacks(synchronize)
            if (observer.isAlive) observer.removeOnWindowFocusChangeListener(listener)
        }
    }
    DisposableEffect(window) {
        val statusLight = controller.isAppearanceLightStatusBars
        val navigationLight = controller.isAppearanceLightNavigationBars
        val behavior = controller.systemBarsBehavior
        onDispose {
            controller.isAppearanceLightStatusBars = statusLight
            controller.isAppearanceLightNavigationBars = navigationLight
            controller.systemBarsBehavior = behavior
            controller.show(bars)
        }
    }
}
