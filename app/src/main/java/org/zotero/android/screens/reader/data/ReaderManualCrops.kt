package org.zotero.android.screens.reader.data

import com.google.gson.JsonObject

/** Local view geometry, scoped to a library and attachment. Never changes the PDF or sync annotations. */
data class ReaderManualCrops(
    val all: List<Double>? = null,
    val odd: List<Double>? = null,
    val even: List<Double>? = null,
) {
    companion object {
        fun fromJson(value: JsonObject): ReaderManualCrops? = runCatching {
            require(value.keySet().all { it in setOf("all", "odd", "even") })
            fun rect(key: String): List<Double>? {
                val raw = value[key] ?: return null
                require(raw.isJsonArray && raw.asJsonArray.size() == 4)
                val r = raw.asJsonArray.map {
                    require(it.isJsonPrimitive && it.asJsonPrimitive.isNumber)
                    it.asDouble.also { number -> require(number.isFinite()) }
                }
                require(r[0] >= 0 && r[1] >= 0 && r[2] <= 1 && r[3] <= 1
                    && r[2] - r[0] >= .02 && r[3] - r[1] >= .02)
                return r
            }
            ReaderManualCrops(rect("all"), rect("odd"), rect("even"))
        }.getOrNull()
    }
}
