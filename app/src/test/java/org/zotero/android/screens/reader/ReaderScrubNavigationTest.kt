package org.zotero.android.screens.reader

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.screens.reader.scrubber.ReaderScrubNavigation

@OptIn(ExperimentalCoroutinesApi::class)
class ReaderScrubNavigationTest {
    @Test fun `drag feedback can change rapidly while navigation is limited to 250 ms`() = runTest {
        val pages = mutableListOf<Int>()
        val nav = ReaderScrubNavigation(this, { pages.add(it) }) { testScheduler.currentTime }
        nav.request(1); advanceTimeBy(20); nav.request(2); advanceTimeBy(20); nav.request(3)
        assertEquals(listOf(1), pages)
        advanceTimeBy(210); runCurrent(); assertEquals(listOf(1, 3), pages)
    }
    @Test fun `release and tap flush the latest page immediately without a stale delayed jump`() = runTest {
        val pages = mutableListOf<Int>()
        val nav = ReaderScrubNavigation(this, { pages.add(it) }) { testScheduler.currentTime }
        nav.request(1); advanceTimeBy(10); nav.request(2); nav.request(9); nav.flush()
        assertEquals(listOf(1, 9), pages)
        advanceTimeBy(1000); runCurrent(); assertEquals(listOf(1, 9), pages)
    }
    @Test fun `a new gesture drops unfinished work and begins immediately`() = runTest {
        val pages = mutableListOf<Int>()
        val nav = ReaderScrubNavigation(this, { pages.add(it) }) { testScheduler.currentTime }
        nav.request(1); nav.request(2); nav.reset(); nav.request(6)
        advanceTimeBy(1000); runCurrent(); assertEquals(listOf(1, 6), pages)
    }
}
