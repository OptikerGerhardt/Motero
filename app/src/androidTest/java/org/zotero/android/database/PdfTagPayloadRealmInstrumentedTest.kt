package org.zotero.android.database

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.google.gson.JsonParser
import io.realm.Realm
import io.realm.RealmConfiguration
import io.realm.kotlin.createObject
import io.realm.kotlin.where
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.zotero.android.database.objects.ItemTypes
import org.zotero.android.database.objects.RCustomLibraryType
import org.zotero.android.database.objects.RItem
import org.zotero.android.database.objects.UpdatableChangeType
import org.zotero.android.database.requests.EditTagsForItemDbRequest
import org.zotero.android.database.requests.key
import org.zotero.android.sync.AnnotationConverterV2
import org.zotero.android.sync.LibraryIdentifier
import org.zotero.android.sync.Tag
import org.zotero.android.screens.reader.ReaderTagPayload
import java.util.Date
import java.util.UUID

/** PDF reader payload conversion through production tag request and disk-backed Realm.
 * Does not replace ReaderViewModel.saveAnnotations callback integration coverage.
 */
@RunWith(AndroidJUnit4::class)
class PdfTagPayloadRealmInstrumentedTest {
    private val libraryId = LibraryIdentifier.custom(RCustomLibraryType.myLibrary)
    private val key = "CIANNOTATION"
    private lateinit var configuration: RealmConfiguration

    @Before fun setUp() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        Realm.init(context)
        configuration = RealmConfiguration.Builder().directory(context.cacheDir)
            .name("pdf-tag-payload-${UUID.randomUUID()}.realm").build()
        Realm.getInstance(configuration).use { realm ->
            realm.executeTransaction {
                val item = realm.createObject<RItem>()
                item.key = key
                item.rawType = ItemTypes.annotation
                item.customLibraryKey = RCustomLibraryType.myLibrary.name
                item.dateAdded = Date(0L)
                item.dateModified = Date(0L)
                item.changeType = UpdatableChangeType.sync.name
            }
        }
    }

    @After fun tearDown() { Realm.deleteRealm(configuration) }

    private fun edit(tags: List<Tag>) {
        RealmDbStorage(configuration).perform(EditTagsForItemDbRequest(key, libraryId, tags))
    }

    private fun reload(): List<Pair<String, String>> =
        Realm.getInstance(configuration).use { realm ->
            realm.where<RItem>().key(key, libraryId).findFirst()?.tags.orEmpty()
                .mapNotNull { it.tag?.let { tag -> tag.name to tag.color } }
                .sortedBy { it.first }
        }

    private fun parse(tagsField: String?): org.zotero.android.pdf.data.PDFDocumentAnnotation {
        val json = JsonParser.parseString(
            """{"id":"CIANNOTATION","type":"note","pageLabel":"1",
            "comment":"updated","color":"#ffff00","sortIndex":"00001",
            "dateCreated":"2026-10-31T10:30:00.000Z",
            "dateModified":"2026-10-31T11:30:00.000Z",
            "position":{"pageIndex":0,"rects":[[1,2,3,4]]}}"""
        ).asJsonObject
        if (tagsField != null) json.add("tags", JsonParser.parseString(tagsField))
        return requireNotNull(AnnotationConverterV2.annotation(json, "Author", true))
    }

    @Test fun nameOnlyAndColoredTagsPersistAndExplicitEmptyClears() {
        val initial = parse("""[{"name":"quick"},{"name":"colored","color":"#123456"}]""")
        assertTrue(initial.hasTagsInPayload)
        edit(initial.tags)
        assertEquals(listOf("colored" to "#123456", "quick" to ""), reload())
        val removed = parse("[]")
        assertTrue(removed.hasTagsInPayload)
        edit(removed.tags)
        assertEquals(emptyList<Pair<String, String>>(), reload())
    }

    @Test fun omittedTagsRetainMemoryAndDurableAssignments() {
        val initial = parse("""[{"name":"keep","color":"#008800"}]""")
        edit(initial.tags)
        val partial = parse(null).preservingTagsFrom(initial)
        assertFalse(partial.hasTagsInPayload)
        assertEquals(initial.tags, partial.tags)
        // The production ReaderViewModel skips EditTagsForItemDbRequest on omission.
        assertEquals(listOf("keep" to "#008800"), reload())
    }

    @Test fun invalidReaderPayloadCannotModifyRealm() {
        edit(listOf(Tag("keep", "")))
        val invalid = JsonParser.parseString(
            """{"id":"CIANNOTATION","type":"unsupported","tags":[]}"""
        ).asJsonObject
        assertTrue(runCatching { AnnotationConverterV2.annotation(invalid, "Author", true) }.getOrNull() == null)
        assertEquals(listOf("keep" to ""), reload())
    }
    @Test fun repeatedIdenticalPayloadDoesNotCreateAdditionalSyncChanges() {
        val payload = parse("""[{"name":"stable","color":"#224466"}]""")
        edit(payload.tags)
        val before = Realm.getInstance(configuration).use { realm ->
            val item = requireNotNull(realm.where<RItem>().key(key, libraryId).findFirst())
            assertEquals(UpdatableChangeType.user.name, item.changeType)
            item.changes.size
        }
        edit(payload.tags)
        Realm.getInstance(configuration).use { realm ->
            val item = requireNotNull(realm.where<RItem>().key(key, libraryId).findFirst())
            assertEquals(before, item.changes.size)
            assertEquals(1, item.tags?.size)
        }
        assertEquals(listOf("stable" to "#224466"), reload())
    }

    @Test fun malformedTagArrayCannotSilentlyErasePersistedTags() {
        val original = parse("""[{"name":"keep","color":"#112233"}]""")
        edit(original.tags)
        val malformed = parse("""[{"color":"#ffffff"},null,42]""")
        // An explicit but entirely invalid tag array must not be treated as
        // an intentional [] clear operation by the save path.
        assertFalse(malformed.hasTagsInPayload && malformed.tags.isEmpty())
        assertEquals(listOf("keep" to "#112233"), reload())
    }

    @Test fun epubPartialMalformedAndExplicitEmptyPayloadsSurviveDiskReload() {
        val initial = listOf(Tag("quick", ""), Tag("colored", "#445566"))
        edit(initial)
        val omitted = JsonParser.parseString("""{"comment":"changed"}""").asJsonObject
        val malformed = JsonParser.parseString("""{"tags":[{"name":"valid"},null]}""").asJsonObject
        val wrongType = JsonParser.parseString("""{"tags":{"name":"invalid"}}""").asJsonObject
        val nameOnly = JsonParser.parseString("""{"tags":[{"name":"renamed"}]}""").asJsonObject
        val explicitEmpty = JsonParser.parseString("""{"tags":[]}""").asJsonObject
        for (payload in listOf(omitted, malformed, wrongType)) {
            val preserved = ReaderTagPayload.parseOrPreserve(payload, initial)
            assertEquals(initial, preserved)
            edit(preserved)
            assertEquals(listOf("colored" to "#445566", "quick" to ""), reload())
        }
        edit(ReaderTagPayload.parseOrPreserve(nameOnly, initial))
        assertEquals(listOf("renamed" to ""), reload())
        edit(ReaderTagPayload.parseOrPreserve(explicitEmpty, initial))
        assertEquals(emptyList<Pair<String, String>>(), reload())
    }


    @Test fun omittedAndInvalidEpubTagsDoNotCreateSyncChangesButExplicitEmptyDoes() {
        val initial = listOf(Tag("keep", "#445566"))
        edit(initial)
        fun changeCount(): Int = Realm.getInstance(configuration).use { realm ->
            requireNotNull(realm.where<RItem>().key(key, libraryId).findFirst()).changes.size
        }
        val before = changeCount()
        val omitted = JsonParser.parseString("""{"comment":"updated"}""").asJsonObject
        val malformed = JsonParser.parseString("""{"tags":[{"name":"other"},null]}""").asJsonObject
        for (payload in listOf(omitted, malformed)) {
            edit(ReaderTagPayload.parseOrPreserve(payload, initial))
            assertEquals(before, changeCount())
            assertEquals(listOf("keep" to "#445566"), reload())
        }
        val cleared = JsonParser.parseString("""{"tags":[]}""").asJsonObject
        edit(ReaderTagPayload.parseOrPreserve(cleared, initial))
        assertEquals(before + 1, changeCount())
        assertEquals(emptyList<Pair<String, String>>(), reload())
    }


    @Test fun malformedEpubTagFieldsNeverReplaceDiskAssignmentsOrQueueSync() {
        val original = listOf(Tag("keep", "#334455"))
        edit(original)
        fun changeCount(): Int = Realm.getInstance(configuration).use { realm ->
            requireNotNull(realm.where<RItem>().key(key, libraryId).findFirst()).changes.size
        }
        val before = changeCount()
        val invalidFields = listOf(
            """{"tags":[{"name":42}]}""",
            """{"tags":[{"name":"valid","color":42}]}""",
            """{"tags":[{"name":"valid"},{"name":""}]}""",
            """{"tags":[{"name":"valid"},false]}""",
            """{"tags":null}"""
        )
        for (json in invalidFields) {
            val payload = JsonParser.parseString(json).asJsonObject
            val preserved = ReaderTagPayload.parseOrPreserve(payload, original)
            assertEquals("Invalid EPUB payload must preserve assignments: $json", original, preserved)
            edit(preserved)
            assertEquals(listOf("keep" to "#334455"), reload())
            assertEquals("Invalid EPUB payload must not queue sync: $json", before, changeCount())
        }
    }

    @Test fun malformedPdfTagPayloadDoesNotClearTagsOrScheduleSync() {
        val original = parse("""[{"name":"keep","color":"#112233"}]""")
        edit(original.tags)
        fun changes(): Int = Realm.getInstance(configuration).use { realm ->
            requireNotNull(realm.where<RItem>().key(key, libraryId).findFirst()).changes.size
        }
        val before = changes()
        for (invalid in listOf(
            """{"name":"not-an-array"}""",
            """[{"name":"valid"},null]""",
            """[{"name":"valid"},{"name":""}]""",
            """[{"name":"valid","color":42}]"""
        )) {
            val payload = parse(invalid)
            assertFalse("Malformed tags must not be treated as explicit []: $invalid", payload.hasTagsInPayload)
            val preserved = payload.preservingTagsFrom(original)
            assertEquals(original.tags, preserved.tags)
            // Production PDF update only schedules EditTagsForItemDbRequest
            // when hasTagsInPayload is true. Reopen Realm to verify no mutation.
            assertEquals(listOf("keep" to "#112233"), reload())
            assertEquals(before, changes())
        }
    }

    @Test fun existingLibraryTagColorIsNotOverwrittenByAnnotationPayload() {
        // RTag is shared across all items in a library. Annotation tag edits
        // change assignments, not the library-wide color configuration.
        val first = parse("""[{"name":"Quick","color":"#112233"}]""")
        edit(first.tags)
        fun changes(): Int = Realm.getInstance(configuration).use { realm ->
            requireNotNull(realm.where<RItem>().key(key, libraryId).findFirst()).changes.size
        }
        val before = changes()
        val recolored = parse("""[{"name":"Quick","color":"#aabbcc"}]""")
        assertTrue(recolored.hasTagsInPayload)
        edit(recolored.tags)
        assertEquals(listOf("Quick" to "#112233"), reload())
        assertEquals(before, changes())
        edit(recolored.tags)
        assertEquals(before, changes())
        assertEquals(listOf("Quick" to "#112233"), reload())
    }
}
