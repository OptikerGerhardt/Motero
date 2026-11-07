package org.zotero.android.screens.tagpicker

import org.zotero.android.sync.Tag
import java.util.Locale

internal data class TagUsage(val tag: Tag, val documentCount: Int = 0, val libraryCount: Int = 0)
internal data class TagMatches(val tags: List<Tag>, val completion: Tag?)

/** Immutable per-picker index: sorting and normalization happen once per database snapshot. */
internal class TagSuggestions(private val usages: List<TagUsage>) {
    private val entries = usages.distinctBy { it.tag.name }.sortedWith(
        compareByDescending<TagUsage> { it.documentCount }.thenByDescending { it.libraryCount }
            .thenBy { it.tag.name.lowercase(Locale.ROOT) }.thenBy { it.tag.name }
    ).map { it.tag to it.tag.name.lowercase(Locale.ROOT) }
    val allTags = entries.map { it.first }.associateBy { it.name }

    private val normalizedExact = entries.groupBy { it.second }.mapValues { it.value.first().first }
    fun exact(text: String): Tag? = allTags[text] ?: normalizedExact[text.lowercase(Locale.ROOT)]
    fun withTags(tags: Collection<Tag>) = TagSuggestions(usages + tags.filter { it.name !in allTags }.map { TagUsage(it) })

    fun search(text: String, selected: Set<String>, limit: Int = 8): TagMatches {
        val query = text.trim().lowercase(Locale.ROOT)
        val tags = ArrayList<Tag>(limit)
        var completion: Tag? = null
        for ((tag, normalized) in entries) {
            if (tag.name in selected || !normalized.contains(query)) continue
            if (tags.size < limit) tags.add(tag)
            if (completion == null && query.isNotEmpty() && tag.name.startsWith(text.trim(), true)) completion = tag
            if (tags.size >= limit && (completion != null || query.isEmpty())) break
        }
        return TagMatches(tags, completion)
    }
}
