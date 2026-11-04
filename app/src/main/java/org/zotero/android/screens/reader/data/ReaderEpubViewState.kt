package org.zotero.android.screens.reader.data

import com.google.gson.JsonObject
import org.zotero.android.screens.reader.web.data.CreateReaderViewState

/** Local typography and precise CFI offset. The synced last page stays a plain CFI. */
data class ReaderEpubViewState(val cfi: String, val scale: Double?, val cfiElementOffset: Double?) {
    fun restoreInto(state: CreateReaderViewState) {
        state.scale = scale?.takeIf { it.isFinite() && it > 0 }
        // Never apply an old local offset to a new position synced from another device.
        if (state.cfi == cfi) state.cfiElementOffset = cfiElementOffset?.takeIf { it.isFinite() }
    }
    companion object {
        fun fromJson(state: JsonObject): ReaderEpubViewState? {
            val cfi = state["cfi"]?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }
                ?.asString?.takeIf { it.isNotBlank() } ?: return null
            fun number(name: String): Double? = state[name]
                ?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isNumber }?.asDouble?.takeIf { it.isFinite() }
            return ReaderEpubViewState(cfi, number("scale")?.takeIf { it > 0 }, number("cfiElementOffset"))
        }
    }
}
