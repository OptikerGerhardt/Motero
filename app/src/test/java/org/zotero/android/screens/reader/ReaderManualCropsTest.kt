package org.zotero.android.screens.reader

import com.google.gson.Gson
import com.google.gson.JsonParser
import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.screens.reader.data.ReaderManualCrops

class ReaderManualCropsTest {
    private fun parse(json: String) = ReaderManualCrops.fromJson(JsonParser.parseString(json).asJsonObject)
    @Test fun `all and independent parity crops survive JSON persistence`() {
        val crop = parse("""{"all":[0.1,0.1,0.9,0.9],"odd":[0.2,0.1,0.8,0.9]}""")!!
        assertNull(crop.even)
        assertEquals(crop, parse(Gson().toJson(crop)))
        assertEquals(ReaderManualCrops(), parse("{}"))
    }
    @Test fun `invalid native bridge geometry is rejected instead of overriding the last saved crop`() {
        for (json in listOf("""{"all":[0,0,2,1]}""", """{"odd":[0.8,0,0.2,1]}""",
            """{"even":[0,0,0.01,1]}""", """{"all":["0",0,1,1]}""", """{"all":null}""",
            """{"all":[0,0,1]}""", """{"unknown":[0,0,1,1]}""")) assertNull(json, parse(json))
    }
}
