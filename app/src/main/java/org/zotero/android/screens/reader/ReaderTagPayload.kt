package org.zotero.android.screens.reader

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import org.zotero.android.sync.Tag

/** Preserve assignments for omitted or malformed reader tag payloads.
 * Only a completely valid explicit array (including []) replaces existing tags.
 */
internal object ReaderTagPayload {
    /** Malformed save envelopes must not throw before the read-only/write gate. */
    fun annotationArrayOrNull(params: JsonObject): JsonArray? =
        params.get("annotations")?.takeIf { it.isJsonArray }?.asJsonArray

    /** Reader callbacks must not write annotation or tag data in read-only libraries. */
    fun canPersistAnnotationChanges(metadataEditable: Boolean): Boolean = metadataEditable

    fun parseOrPreserve(data: JsonObject, previous: List<Tag>): List<Tag> {
        val field = data.get("tags") ?: return previous
        if (!field.isJsonArray) return previous
        val parsed = mutableListOf<Tag>()
        for (entry in field.asJsonArray) {
            if (!entry.isJsonObject) return previous
            val obj = entry.asJsonObject
            val nameValue = obj.get("name")
            if (nameValue == null || !nameValue.isJsonPrimitive || !nameValue.asJsonPrimitive.isString) return previous
            val name = nameValue.asString
            if (name.isBlank()) return previous
            val colorValue = obj.get("color")
            if (colorValue != null && !colorValue.isJsonNull &&
                (!colorValue.isJsonPrimitive || !colorValue.asJsonPrimitive.isString)) return previous
            val color = if (colorValue == null || colorValue.isJsonNull) "" else colorValue.asString
            parsed.add(Tag(name = name, color = color))
        }
        return parsed
    }
}
