package org.zotero.android.screens.reader

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import org.junit.Test
import org.mockito.Mockito

class ReaderClipboardTest {
    @Test fun `copies the complete original text including newlines Unicode and long passages`() {
        val text = "Originaltext — Fußnote α 😀\n".repeat(1000)
        val context = Mockito.mock(Context::class.java)
        val clipboard = Mockito.mock(ClipboardManager::class.java)
        val clip = Mockito.mock(ClipData::class.java)
        Mockito.`when`(context.getSystemService(Context.CLIPBOARD_SERVICE)).thenReturn(clipboard)
        Mockito.mockStatic(ClipData::class.java).use { factory ->
            factory.`when`<ClipData> { ClipData.newPlainText("", text) }.thenReturn(clip)
            copyReaderAnnotationQuote(context, text)
            factory.verify { ClipData.newPlainText("", text) }
            Mockito.verify(clipboard).setPrimaryClip(clip)
        }
    }

    @Test fun `blank original text does not replace the existing clipboard`() {
        val context = Mockito.mock(Context::class.java)
        copyReaderAnnotationQuote(context, "  \n")
        Mockito.verifyNoInteractions(context)
    }
}
