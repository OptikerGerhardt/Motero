package org.zotero.android.database.requests

import android.graphics.RectF
import io.realm.Realm
import io.realm.kotlin.where
import org.zotero.android.database.DbRequest
import org.zotero.android.database.objects.FieldKeys
import org.zotero.android.database.objects.RItem
import org.zotero.android.database.objects.RItemChanges
import org.zotero.android.database.objects.RItemField
import org.zotero.android.database.objects.RObjectChange
import org.zotero.android.database.objects.RRect
import org.zotero.android.database.objects.UpdatableChangeType
import org.zotero.android.sync.LibraryIdentifier
import java.util.Date

class EditAnnotationRectsDbRequestV2(
    private val key: String,
    private val libraryId: LibraryIdentifier,
    private val rects: List<RectF>,
    private val annotationText: String? = null,
) : DbRequest {
    override val needsWrite: Boolean
        get() = true

    override fun process(database: Realm) {
        val item = database.where<RItem>().key(this.key, this.libraryId).findFirst() ?: return
        if (item.deleted) return
        val changes = mutableListOf<RItemChanges>()
        if (rectsChanged(rects, item.rects)) {
            syncRects(rects, item, database)
            changes.add(RItemChanges.rects)
        }
        if (annotationText != null && syncText(annotationText, item, database)) {
            changes.add(RItemChanges.fields)
            item.dateModified = Date()
        }
        if (changes.isEmpty()) return
        item.changes.add(RObjectChange.create(changes = changes))
        item.changeType = UpdatableChangeType.user.name
    }

    private fun syncText(text: String, item: RItem, database: Realm): Boolean {
        val key = FieldKeys.Item.Annotation.text
        val existing = item.fields.where().key(key).isNull("baseKey").findFirst()
        if (existing?.value.orEmpty() == text) return false
        val field = existing ?: database.createEmbeddedObject(RItemField::class.java, item, "fields").apply {
            this.key = key
        }
        field.value = text
        field.changed = true
        return true
    }

    private fun syncRects(rects: List<RectF>, item: RItem, database: Realm) {
        item.rects.deleteAllFromRealm()

        for (rect in rects) {
            val rRect = database.createEmbeddedObject(RRect::class.java, item, "rects")
            rRect.minX = rect.left.toDouble()
            rRect.maxX = rect.right.toDouble()
            rRect.minY = rect.top.toDouble()
            rRect.maxY = rect.bottom.toDouble()
        }

    }

    private fun rectsChanged(rects: List<RectF>, itemRects: List<RRect>): Boolean {
        if (rects.size != itemRects.size) {
            return true
        }

        for (rect in rects) {
            if (itemRects.firstOrNull {
                    it.minX == rect.left.toDouble()
                            && it.minY == rect.top.toDouble()
                            && it.maxX == rect.right.toDouble()
                            && it.maxY == rect.bottom.toDouble()
                } == null) {
                return true
            }
        }

        return false
    }
}
