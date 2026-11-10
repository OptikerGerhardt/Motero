package org.zotero.android.ereader

import org.junit.Assert.*
import org.junit.Test

class PenButtonStateTest {
    @Test fun holdRestoresOnlyForTheOwningKey() {
        val s = PenButtonState()
        assertTrue(s.event("pen", 308, true, 0, false))
        assertTrue(s.event("other", 308, false, 0, false))
        assertFalse(s.event("pen", 308, false, 0, false))
    }
    @Test fun toggleIgnoresRepeatAndWaitsForReleaseBeforeAnotherPress() {
        val s = PenButtonState()
        assertTrue(s.event("pen", 308, true, 0, true))
        assertTrue(s.event("pen", 308, true, 1, true))
        assertTrue(s.event("pen", 308, true, 0, true))
        assertTrue(s.event("pen", 308, false, 0, true))
        assertFalse(s.event("pen", 308, true, 0, true))
    }
    @Test fun resetRecoversLostKeyUpAndADeviceChange() {
        val s = PenButtonState()
        s.event("pen", 308, true, 0, true);s.reset()
        assertFalse(s.active)
        assertTrue(s.event("new pen", 309, true, 0, false))
        s.reset();assertFalse(s.active)
    }
}
