package org.zotero.android.screens.reader

import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.screens.reader.toolbar.readerToolDockLayout

class ReaderToolDockLayoutTest {
    @Test fun `PDF shell follows seven tools or eight with Redo`() {
        val phone = readerToolDockLayout(377f, false)
        assertEquals(344f, phone.width, 0f); assertFalse(phone.redo)
        val wide = readerToolDockLayout(800f, false)
        assertEquals(392f, wide.width, 0f); assertTrue(wide.redo)
        assertEquals(300f, readerToolDockLayout(300f, false).width, 0f)
    }
    @Test fun `EPUB stays compact and both layouts adapt when rotating`() {
        assertEquals(248f, readerToolDockLayout(280f, true).width, 0f)
        assertEquals(296f, readerToolDockLayout(800f, true).width, 0f)
        for (width in listOf(240f, 280f, 344f, 392f, 800f)) for(epub in listOf(false,true)) {
            val layout = readerToolDockLayout(width, epub)
            assertTrue(layout.width <= width)
            assertEquals(layout, readerToolDockLayout(width, epub))
        }
    }
}
