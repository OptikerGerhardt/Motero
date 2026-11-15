package org.zotero.android.screens.reader

import org.junit.Assert.*
import org.junit.Test

class ReaderInkWidthTest {
    @Test fun `all preset widths restore exactly and increase without duplicates`() {
        assertEquals(readerInkWidths.sorted().distinct(), readerInkWidths)
        readerInkWidths.forEach { assertEquals(it, snapInkWidth(it), 0f) }
        assertEquals(.5f, snapInkWidth(-1f), 0f)
        assertEquals(25f, snapInkWidth(100f), 0f)
    }
    @Test fun `fine pens have smaller increments than broad markers`() {
        assertEquals(.6f, snapInkWidth(.59f), 0f)
        assertEquals(1.25f, snapInkWidth(1.24f), 0f)
        assertEquals(18f, snapInkWidth(18.49f), 0f)
        assertTrue(readerInkWidths.zipWithNext().first().let { it.second-it.first } <
            readerInkWidths.zipWithNext().last().let { it.second-it.first })
    }
}
