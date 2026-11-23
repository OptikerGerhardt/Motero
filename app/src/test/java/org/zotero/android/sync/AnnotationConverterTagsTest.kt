package org.zotero.android.sync

import com.google.gson.JsonParser
import org.junit.Assert.assertEquals
import org.junit.Test

class AnnotationConverterTagsTest {
    @Test
    fun pdfBridgeParsesTagOnlyEditsAndExplicitRemoval() {
        val data = JsonParser.parseString("""
            {"id":"HIGHLIGHT","type":"highlight","pageLabel":"1","sortIndex":"001",
             "dateCreated":"2026-11-21T12:00:00.000Z","dateModified":"2026-11-21T12:00:00.000Z",
             "color":"#ffd400","position":{"pageIndex":0,"rects":[]},"text":"quote",
             "tags":[{"name":"review","color":"#cc0000"},{"name":"test"}]}
        """.trimIndent()).asJsonObject
        val added = requireNotNull(AnnotationConverterV2.annotation(data, "user", true))
        assertEquals(listOf(Tag("review", "#cc0000"), Tag("test", "")), added.tags)

        data.add("tags", JsonParser.parseString("[]"))
        val removed = requireNotNull(AnnotationConverterV2.annotation(data, "user", true))
        assertEquals(emptyList<Tag>(), removed.tags)
        assertEquals(added.text, removed.text)
    }
}
