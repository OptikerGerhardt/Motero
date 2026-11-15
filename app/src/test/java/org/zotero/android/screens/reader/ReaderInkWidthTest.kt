package org.zotero.android.screens.reader

import org.junit.Assert.*
import org.junit.Test

class ReaderInkWidthTest {
    @Test fun `every selectable width can be restored exactly including 18 point 5`() {
        for (position in 1..50) {
            val persisted = position / 2f
            assertEquals(persisted, snapInkWidth(persisted), 0f)
        }
        assertEquals(18.5f, snapInkWidth(18.49f), 0f)
    }
    @Test fun `dragging produces small discrete widths within the supported range`() {
        assertEquals(.5f, snapInkWidth(-1f), 0f)
        assertEquals(25f, snapInkWidth(100f), 0f)
        assertEquals(2f, snapInkWidth(2.1f), 0f)
        assertEquals(2.5f, snapInkWidth(2.3f), 0f)
    }
}
