package org.zotero.android.screens.reader

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/** A notification only: no Activity, WebView, image or document is retained. */
object ReaderMemoryPressure {
    private val mutable = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val events = mutable.asSharedFlow()
    fun notifyPressure() { mutable.tryEmit(Unit) }
}
