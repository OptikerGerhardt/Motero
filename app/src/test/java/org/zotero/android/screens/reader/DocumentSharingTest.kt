package org.zotero.android.screens.reader

import android.content.ClipData
import android.content.Intent
import android.net.Uri
import org.junit.Assert.*
import org.junit.Test
import org.mockito.Mockito
import org.zotero.android.helpers.documentShareIntent
import org.zotero.android.helpers.documentShareMime

class DocumentSharingTest {
    @Test fun `PDF and EPUB use document MIME types and other files keep their type`() {
        assertEquals("application/pdf", documentShareMime("", "Study.PDF"))
        assertEquals("application/epub+zip", documentShareMime("application/octet-stream", "Study.epub"))
        assertEquals("text/plain", documentShareMime("text/plain", "notes.txt"))
        assertEquals("application/octet-stream", documentShareMime("", "document"))
    }
    @Test fun `share grants temporary read access to one content URI and never write access`() {
        val uri = Mockito.mock(Uri::class.java)
        val clip = Mockito.mock(ClipData::class.java)
        Mockito.mockStatic(ClipData::class.java).use { static ->
            static.`when`<ClipData> { ClipData.newRawUri("Study.pdf", uri) }.thenReturn(clip)
            Mockito.mockConstruction(Intent::class.java) { _, ctor -> assertEquals(listOf(Intent.ACTION_SEND), ctor.arguments()) }.use { created ->
                val intent = documentShareIntent(uri,"application/pdf","Study.pdf")
                assertSame(created.constructed().single(), intent)
                Mockito.verify(intent).setType("application/pdf")
                Mockito.verify(intent).putExtra(Intent.EXTRA_STREAM,uri)
                Mockito.verify(intent).setClipData(clip)
                Mockito.verify(intent).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                Mockito.verify(intent,Mockito.never()).addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            }
        }
    }
}
