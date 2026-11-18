package org.zotero.android.screens.reader.scrubber

import android.os.SystemClock
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** Keep live scrubber feedback separate from expensive document navigation. */
internal class ReaderScrubNavigation(
    private val scope: CoroutineScope,
    private val post: (Int) -> Unit,
    private val now: () -> Long = SystemClock::elapsedRealtime,
) {
    private var pending: Int? = null
    private var lastPost: Long? = null
    private var job: Job? = null

    fun request(page: Int) {
        pending = page
        val wait = lastPost?.let { (it + 250L - now()).coerceAtLeast(0L) } ?: 0L
        if (wait == 0L) { flush(); return }
        if (job?.isActive == true) return
        job = scope.launch { delay(wait); job = null; postPending() }
    }
    private fun postPending() {
        val page = pending ?: return
        pending = null
        lastPost = now()
        post(page)
    }
    fun flush() { job?.cancel(); job = null; postPending() }
    fun reset() { job?.cancel(); job = null; pending = null; lastPost = null }
}
