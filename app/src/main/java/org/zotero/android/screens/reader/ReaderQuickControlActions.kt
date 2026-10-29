package org.zotero.android.screens.reader

import org.zotero.android.screens.reader.data.ReaderAnnotationsFilter
import org.zotero.android.sync.Tag

internal object ReaderQuickControlActions {
    fun toggleTag(current: List<Tag>, tag: Tag): List<Tag> =
        if (current.any { it.name == tag.name }) current.filterNot { it.name == tag.name }
        else current + tag

    fun toggleColor(filter: ReaderAnnotationsFilter?, color: String): ReaderAnnotationsFilter? {
        val colors = filter?.colors ?: emptySet()
        val updated = if (color in colors) colors - color else colors + color
        val tags = filter?.tags ?: emptySet()
        return if (updated.isEmpty() && tags.isEmpty()) null else ReaderAnnotationsFilter(updated, tags)
    }

    fun setFilterTags(filter: ReaderAnnotationsFilter?, tags: Set<String>): ReaderAnnotationsFilter? {
        val colors = filter?.colors ?: emptySet()
        return if (colors.isEmpty() && tags.isEmpty()) null else ReaderAnnotationsFilter(colors, tags)
    }
}
