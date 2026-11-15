package org.zotero.android.ereader

import android.view.KeyEvent
import org.junit.Assert.*
import org.junit.Test

class ReaderBackKeysTest {
    @Test fun `Back and Escape are intercepted once with paired releases`() {
        for (code in listOf(KeyEvent.KEYCODE_BACK, KeyEvent.KEYCODE_ESCAPE)) {
            val keys = ReaderBackKeys(); var count = 0
            assertTrue(keys.handle(code, KeyEvent.ACTION_DOWN, 0) { count++ })
            assertTrue(keys.handle(code, KeyEvent.ACTION_DOWN, 1) { count++ })
            assertEquals(1, count)
            assertTrue(keys.handle(code, KeyEvent.ACTION_UP, 0, null))
            assertFalse(keys.handle(code, KeyEvent.ACTION_UP, 0, null))
        }
    }
    @Test fun `unprotected dialogs IME and page keys keep normal dispatch`() {
        val keys = ReaderBackKeys()
        assertFalse(keys.handle(KeyEvent.KEYCODE_BACK, KeyEvent.ACTION_DOWN, 0, null))
        assertFalse(keys.handle(KeyEvent.KEYCODE_ESCAPE, KeyEvent.ACTION_DOWN, 0, null))
        assertFalse(keys.handle(KeyEvent.KEYCODE_VOLUME_DOWN, KeyEvent.ACTION_DOWN, 0) { error("must not exit") })
    }
}
