package org.zotero.android.screens.reader

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test
import org.mockito.ArgumentMatchers.*
import org.mockito.Mockito
import org.zotero.android.architecture.Defaults
import org.zotero.android.database.objects.RCustomLibraryType
import org.zotero.android.files.DataMarshaller
import org.zotero.android.screens.reader.data.ReaderManualCrops
import org.zotero.android.sync.LibraryIdentifier

class ReaderManualCropStorageTest {
    private class Store {
        val values = mutableMapOf<String, String>()
        val context = Mockito.mock(Context::class.java)
        val prefs = Mockito.mock(SharedPreferences::class.java)
        val editor = Mockito.mock(SharedPreferences.Editor::class.java, Mockito.RETURNS_SELF)
        val defaults: Defaults
        init {
            Mockito.`when`(context.getSharedPreferences(anyString(), anyInt())).thenReturn(prefs)
            Mockito.`when`(prefs.edit()).thenReturn(editor)
            Mockito.`when`(prefs.all).thenAnswer { values.toMap() }
            Mockito.`when`(prefs.getString(anyString(), nullable(String::class.java))).thenAnswer {
                values[it.getArgument<String>(0)] ?: it.getArgument<String?>(1)
            }
            Mockito.`when`(editor.putString(anyString(), nullable(String::class.java))).thenAnswer {
                val key = it.getArgument<String>(0); val value = it.getArgument<String?>(1)
                if (value == null) values.remove(key) else values[key] = value
                editor
            }
            Mockito.`when`(editor.remove(anyString())).thenAnswer { values.remove(it.getArgument<String>(0)); editor }
            defaults = Defaults(context, DataMarshaller(Gson()))
        }
    }
    @Test fun `crop persists after reopen and is isolated by library and attachment`() {
        val s=Store(); val group=LibraryIdentifier.group(7); val other=LibraryIdentifier.group(8)
        val crop=ReaderManualCrops(all=listOf(.1,.1,.9,.9))
        s.defaults.setManualCrops(group,"SAMEKEY",crop)
        val reopened=Defaults(s.context,DataMarshaller(Gson()))
        assertEquals(crop,reopened.getManualCrops(group,"SAMEKEY"))
        assertNull(reopened.getManualCrops(other,"SAMEKEY"))
        assertNull(reopened.getManualCrops(LibraryIdentifier.custom(RCustomLibraryType.myLibrary),"SAMEKEY"))
        assertNull(reopened.getManualCrops(group,"OTHERKEY"))
        reopened.setManualCrops(group,"SAMEKEY",ReaderManualCrops())
        assertEquals(ReaderManualCrops(),reopened.getManualCrops(group,"SAMEKEY"))
    }
    @Test fun `invalid saved data falls back safely and logout clears every crop`() {
        val s=Store();val group=LibraryIdentifier.group(7)
        s.defaults.setManualCrops(group,"PDF",ReaderManualCrops(odd=listOf(.1,.1,.9,.9)))
        val key=s.values.keys.single();s.values[key]="invalid JSON"
        assertNull(s.defaults.getManualCrops(group,"PDF"))
        s.defaults.setManualCrops(group,"PDF",ReaderManualCrops())
        s.defaults.setManualCrops(LibraryIdentifier.group(8),"PDF",ReaderManualCrops())
        s.defaults.reset()
        assertTrue(s.values.keys.none { it.startsWith("manualCrop_") })
    }
}
