package org.zotero.android.screens.reader.data

import android.content.Context
import android.content.Intent
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import org.zotero.android.R
import org.zotero.android.architecture.Defaults
import org.zotero.android.database.objects.Attachment
import org.zotero.android.database.objects.RItem
import org.zotero.android.database.objects.RCustomLibraryType
import org.zotero.android.files.FileStore
import org.zotero.android.screens.root.RootActivity
import org.zotero.android.sync.AttachmentCreator
import org.zotero.android.sync.LibraryIdentifier
import java.io.File

/** A launcher intent names an attachment in the current account. It never carries a file path. */
data class ReaderLaunchTarget(val accountId: Long, val groupId: Int?, val key: String) {
    val libraryId: LibraryIdentifier
        get() = groupId?.let { LibraryIdentifier.group(it) }
            ?: LibraryIdentifier.custom(RCustomLibraryType.myLibrary)

    fun encode(): String = "$accountId:${groupId ?: 0}:$key"

    fun launchIntent(context: Context): Intent = Intent(context, RootActivity::class.java)
        .setAction(ACTION).putExtra(EXTRA, encode())

    fun localDocument(item: RItem, fileStore: FileStore, defaults: Defaults): File? {
        if (item.deleted || item.trash || item.parent?.deleted == true || item.parent?.trash == true) return null
        val attachment = AttachmentCreator.attachment(
            item = item, fileStorage = fileStore, isForceRemote = false,
            urlDetector = null, defaults = defaults,
        )?.type as? Attachment.Kind.file ?: return null
        if (attachment.contentType != "application/pdf" && attachment.contentType != "application/epub+zip") return null
        val filename = attachment.filename
        if (filename.isBlank() || filename == "." || filename == ".." || filename.any { it == '/' || it == '\\' }) return null
        val directory = fileStore.attachmentDirectory(libraryId, key).canonicalFile
        return File(directory, filename).canonicalFile.takeIf { it.parentFile == directory && it.isFile }
    }

    fun requestShortcut(context: Context, title: String): Boolean {
        val shortcut = ShortcutInfoCompat.Builder(context, "document-${encode()}")
            .setIntent(launchIntent(context))
            .setShortLabel(title.take(36).ifBlank { key })
            .setLongLabel(title.take(128).ifBlank { key })
            .setIcon(IconCompat.createWithResource(context, R.drawable.ic_reader_bookmark))
            .build()
        return ShortcutManagerCompat.isRequestPinShortcutSupported(context)
            && runCatching { ShortcutManagerCompat.requestPinShortcut(context, shortcut, null) }.getOrDefault(false)
    }

    companion object {
        const val ACTION = "org.zotero.android.OPEN_SAVED_DOCUMENT"
        const val EXTRA = "saved_document"
        private val itemKey = Regex("[A-Z0-9]{8}")

        fun parse(encoded: String?): ReaderLaunchTarget? {
            val parts = encoded?.takeIf { it.length <= 42 }?.split(':') ?: return null
            if (parts.size != 3 || !itemKey.matches(parts[2])) return null
            val account = parts[0].toLongOrNull()?.takeIf { it > 0 } ?: return null
            val group = parts[1].toIntOrNull()?.takeIf { it >= 0 } ?: return null
            return ReaderLaunchTarget(account, group.takeIf { it > 0 }, parts[2])
        }

        fun from(accountId: Long, libraryId: LibraryIdentifier, key: String): ReaderLaunchTarget? {
            if (libraryId is LibraryIdentifier.custom && libraryId.type != RCustomLibraryType.myLibrary) return null
            return parse(ReaderLaunchTarget(accountId, (libraryId as? LibraryIdentifier.group)?.groupId, key).encode())
        }
    }
}

data class ReaderLaunchDestination(val params: String, val encodedPath: String, val replaceExisting: Boolean)
