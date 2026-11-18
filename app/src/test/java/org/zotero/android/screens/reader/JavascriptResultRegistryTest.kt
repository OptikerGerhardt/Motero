package org.zotero.android.screens.reader

import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.screens.reader.web.JavascriptResultRegistry

class JavascriptResultRegistryTest {
    @Test fun `a normal callback completes once`() {
        val registry = JavascriptResultRegistry(); val values = mutableListOf<String>()
        val reply = registry.register({ values.add(it) }); reply("ok"); reply("late"); registry.failAll()
        assertEquals(listOf("ok"), values)
    }
    @Test fun `renderer loss completes all pending callers and ignores their later results`() {
        val registry = JavascriptResultRegistry(); val values = mutableListOf<String>()
        val first = registry.register({ values.add(it) }); val second = registry.register({ values.add(it) })
        registry.failAll(); first("old"); second("old"); registry.failAll()
        assertEquals(listOf("null", "null"), values)
    }
    @Test fun `old renderer replies cannot complete callbacks of a replacement renderer`() {
        val registry = JavascriptResultRegistry(); val values = mutableListOf<String>()
        val old = registry.register({ values.add(it) }); registry.failAll()
        val current = registry.register({ values.add(it) }); old("stale"); current("new")
        assertEquals(listOf("null", "new"), values)
    }
    @Test fun `a cancelled caller cannot prevent completion of other pending callers`() {
        val registry = JavascriptResultRegistry(); val values = mutableListOf<String>()
        registry.register { error("cancelled") }; registry.register({ values.add(it) }); registry.failAll()
        assertEquals(listOf("null"), values)
    }
}
