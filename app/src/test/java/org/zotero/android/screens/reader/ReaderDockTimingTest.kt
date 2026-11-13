package org.zotero.android.screens.reader

import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.screens.reader.toolbar.dockTiming

class ReaderDockTimingTest {
    @Test fun `a narrower phone preview replaces tools before the dock contracts`() {
        val timing = dockTiming(344f, 240f)
        assertEquals(0, timing.contentDelay)
        assertEquals(180, timing.widthDelay)
    }
    @Test fun `a wide BOOX preview expands before replacing annotation tools`() {
        val timing = dockTiming(344f, 560f)
        assertEquals(0, timing.widthDelay)
        assertEquals(140, timing.contentDelay)
        val returning = dockTiming(560f,344f)
        assertEquals(180,returning.widthDelay)
        assertEquals(0,returning.contentDelay)
    }
}
