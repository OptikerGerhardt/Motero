package org.zotero.android.helpers

import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import org.zotero.android.BuildConfig
import org.zotero.android.uicomponents.Strings
import java.io.File
import java.util.Locale

internal fun documentShareMime(contentType: String, filename: String): String = when {
    filename.lowercase(Locale.ROOT).endsWith(".pdf") -> "application/pdf"
    filename.lowercase(Locale.ROOT).endsWith(".epub") -> "application/epub+zip"
    contentType.isNotBlank() -> contentType
    else -> "application/octet-stream"
}

internal fun documentShareIntent(uri: Uri, mime: String, filename: String): Intent =
    Intent(Intent.ACTION_SEND).apply {
        type = mime
        putExtra(Intent.EXTRA_STREAM, uri)
        clipData = ClipData.newRawUri(filename, uri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

/** Shares the original file with temporary read permission; never grants write access. */
internal fun shareDocument(context: Context, file: File, mime: String) {
    require(file.isFile) { "Attachment is not downloaded" }
    val uri = FileProvider.getUriForFile(context, BuildConfig.APPLICATION_ID + ".provider", file)
    val intent = documentShareIntent(uri, documentShareMime(mime, file.name), file.name)
    context.startActivity(Intent.createChooser(intent, context.getString(Strings.boox_share_document)))
}
