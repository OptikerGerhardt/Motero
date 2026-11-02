package org.zotero.android.pdf.data

import android.graphics.PointF
import android.graphics.RectF
import org.zotero.android.database.objects.AnnotationType
import org.zotero.android.screens.reader.data.ReaderAnnotation
import org.zotero.android.sync.Library
import org.zotero.android.sync.LibraryIdentifier
import org.zotero.android.sync.Tag
import java.util.Date

data class PDFDocumentAnnotation(
    override val key: String,
    override val type: AnnotationType,
    val page: Int,
    override val pageLabel: String,
    val rects: List<RectF>,
    val paths: List<List<PointF>>,
    override val lineWidth: Float?,
    val author : String,
    val isAuthor : Boolean,
    override val color: String,
    override val comment: String,
    override val text: String?,
    override val fontSize: Float?,
    val rotation: Int?,
    override val sortIndex: String,
    override val dateAdded: Date,
    override val dateModified: Date,
    val isZoteroAnnotation: Boolean
): ReaderAnnotation {
    override fun isAuthor(currentUserId: Long): Boolean {
        return this.isAuthor
    }

    override val tags: List<Tag>
        get() = emptyList()

    override fun author(displayName: String, username: String): String {
        return this.author
    }

    override fun editability(currentUserId: Long, library: Library): AnnotationEditability {
        when (library.identifier) {
            is LibraryIdentifier.custom -> return AnnotationEditability.editable
            is LibraryIdentifier.group -> {
                if (!library.metadataEditable) {
                    AnnotationEditability.notEditable
                }
                return if (this.isAuthor) AnnotationEditability.editable else AnnotationEditability.deletable
            }
        }
    }
}