package org.zotero.android.database

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.realm.Realm
import io.realm.RealmConfiguration
import io.realm.kotlin.createObject
import io.realm.kotlin.where
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.zotero.android.database.objects.ItemTypes
import org.zotero.android.database.objects.RCustomLibraryType
import org.zotero.android.database.objects.RItem
import org.zotero.android.database.objects.RItemChanges
import org.zotero.android.database.objects.UpdatableChangeType
import org.zotero.android.database.requests.EditTagsForItemDbRequest
import org.zotero.android.database.requests.key
import org.zotero.android.sync.LibraryIdentifier
import org.zotero.android.sync.Tag
import java.util.Date
import java.util.UUID

/**
 * Instrumented Realm transaction + durable reload check.
 *
 * Uses a unique on-disk test Realm, not inMemory(): in-memory Realm data vanishes
 * after the last instance closes and cannot establish save/reopen persistence.
 * This checks the real DB request, not the ReaderViewModel/reader callback path.
 */
@RunWith(AndroidJUnit4::class)
class RealmTagPersistenceInstrumentedTest {
    private val libraryId = LibraryIdentifier.custom(RCustomLibraryType.myLibrary)
    private val annotationKey = "CIANNOTATION"
    private lateinit var configuration: RealmConfiguration

    @Before
    fun setUp() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        Realm.init(context)
        configuration = RealmConfiguration.Builder()
            .directory(context.cacheDir)
            .name("tag-regression-${UUID.randomUUID()}.realm")
            .build()

        Realm.getInstance(configuration).use { realm ->
            realm.executeTransaction {
                val item = realm.createObject<RItem>()
                item.key = annotationKey
                item.rawType = ItemTypes.annotation
                item.customLibraryKey = RCustomLibraryType.myLibrary.name
                item.dateAdded = Date(0L)
                item.dateModified = Date(0L)
                item.changeType = UpdatableChangeType.sync.name
            }
        }
    }

    @After
    fun tearDown() {
        Realm.deleteRealm(configuration)
    }

    private fun edit(key: String = annotationKey, tags: List<Tag>) {
        RealmDbStorage(configuration).perform(EditTagsForItemDbRequest(key, libraryId, tags))
    }

    private fun readTags(key: String = annotationKey): List<Pair<String, String>> =
        Realm.getInstance(configuration).use { realm ->
            realm.where<RItem>().key(key, libraryId).findFirst()
                ?.tags.orEmpty()
                .mapNotNull { assignment ->
                    assignment.tag?.let { it.name to it.color }
                }
                .sortedBy { it.first }
        }

    @Test
    fun tagOnlyAddRemoveAndClearSurviveClosingAndReopeningRealm() {
        edit(tags = listOf(Tag("ordinary", ""), Tag("quick", "#0088ff")))
        assertEquals(listOf("ordinary" to "", "quick" to "#0088ff"), readTags())

        // Tag-only update, without any annotation field, color or comment change.
        edit(tags = listOf(Tag("quick", "#0088ff")))
        assertEquals(listOf("quick" to "#0088ff"), readTags())

        edit(tags = emptyList())
        assertEquals(emptyList<Pair<String, String>>(), readTags())
    }

    @Test
    fun repeatedTagEditIsIdempotentAndMarksItemForSync() {
        val assigned = listOf(Tag("manual", ""))
        edit(tags = assigned)
        edit(tags = assigned)
        assertEquals(listOf("manual" to ""), readTags())
        Realm.getInstance(configuration).use { realm ->
            val item = realm.where<RItem>().key(annotationKey, libraryId).findFirst()!!
            assertEquals(UpdatableChangeType.user.name, item.changeType)
            assertTrue(item.changedFields.contains(RItemChanges.tags))
        }
    }

    @Test
    fun missingAnnotationDoesNotAlterAnotherAnnotation() {
        edit(tags = listOf(Tag("initial", "")))
        edit(key = "MISSING", tags = listOf(Tag("wrong", "")))
        assertEquals(listOf("initial" to ""), readTags())
    }

    @Test
    fun failedRealmTransactionRollsBackTagMutation() {
        edit(tags = listOf(Tag("unchanged", "")))
        try {
            Realm.getInstance(configuration).use { realm ->
                realm.executeTransaction {
                    EditTagsForItemDbRequest(annotationKey, libraryId, listOf(Tag("rolled-back", "")))
                        .process(realm)
                    error("Force rollback of this test transaction")
                }
            }
            throw AssertionError("Transaction should have failed")
        } catch (expected: IllegalStateException) {
            assertEquals("Force rollback of this test transaction", expected.message)
        }
        assertEquals(listOf("unchanged" to ""), readTags())
    }
    private fun syncState(key: String = annotationKey): Pair<String, Int> =
        Realm.getInstance(configuration).use { realm ->
            val item = requireNotNull(realm.where<RItem>().key(key, libraryId).findFirst())
            item.changeType to item.changes.size
        }

    @Test
    fun existingLibraryTagColorIsNotOverwrittenByAnnotationPayload() {
        edit(tags = listOf(Tag("Quick", "#112233")))
        val before = syncState()

        edit(tags = listOf(Tag("Quick", "#aabbcc")))
        assertEquals(listOf("Quick" to "#112233"), readTags())
        assertEquals(before, syncState())

        // Exercise the shared RTag lookup as well as the existing assignment.
        val siblingKey = "SIBLINGANNOTATION"
        Realm.getInstance(configuration).use { realm ->
            realm.executeTransaction {
                val sibling = realm.createObject<RItem>()
                sibling.key = siblingKey
                sibling.rawType = ItemTypes.annotation
                sibling.customLibraryKey = RCustomLibraryType.myLibrary.name
                sibling.dateAdded = Date(0L)
                sibling.dateModified = Date(0L)
                sibling.changeType = UpdatableChangeType.sync.name
            }
        }
        edit(key = siblingKey, tags = listOf(Tag("Quick", "#aabbcc")))
        assertEquals(listOf("Quick" to "#112233"), readTags(siblingKey))
        assertEquals(listOf("Quick" to "#112233"), readTags())
        assertEquals(before, syncState())
        assertEquals(UpdatableChangeType.user.name, syncState(siblingKey).first)
    }

    @Test
    fun explicitClearRolledBackWhenFollowingAnnotationWriteFails() {
        edit(tags = listOf(Tag("preserved", "#778899")))
        val before = syncState()
        val failingWrite = object : DbRequest {
            override val needsWrite = true
            override fun process(database: Realm) {
                error("annotation update rejected after tag clear")
            }
        }
        // Exercise the real batch coordinator, and ensure the test releases
        // its Realm even on failure before checking durable state.
        val coordinator = RealmDbCoordinator().init(configuration)
        try {
            coordinator.perform(listOf(
                EditTagsForItemDbRequest(annotationKey, libraryId, emptyList()),
                failingWrite,
            ))
            throw AssertionError("Batch should have failed")
        } catch (expected: IllegalStateException) {
            assertEquals("annotation update rejected after tag clear", expected.message)
        } finally {
            coordinator.invalidate()
        }
        assertEquals(listOf("preserved" to "#778899"), readTags())
        assertEquals(before, syncState())

        edit(tags = emptyList())
        assertEquals(emptyList<Pair<String, String>>(), readTags())
        assertEquals(before.second + 1, syncState().second)
    }
}
