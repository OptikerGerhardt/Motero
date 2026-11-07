package org.zotero.android.screens.tagpicker

import io.realm.Realm
import io.realm.RealmChangeListener
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.zotero.android.database.DbWrapperMain
import org.zotero.android.database.objects.RItem
import org.zotero.android.database.requests.ReadTagPickerTagsDbRequest
import org.zotero.android.sync.LibraryIdentifier
import org.zotero.android.sync.Tag
import javax.inject.Inject

internal class TagSuggestionRepository @Inject constructor(private val database: DbWrapperMain) {
    suspend fun load(library: LibraryIdentifier, document: String?, allowed: List<Tag>?): TagSuggestions =
        withContext(Dispatchers.IO) {
            Realm.getInstance(database.config).use { realm ->
                val provided = allowed?.associateBy { it.name }
                val usages = ReadTagPickerTagsDbRequest(library).process(realm).mapNotNull { tag ->
                    ensureActive()
                    if (provided != null && tag.name !in provided) return@mapNotNull null
                    val assignments = tag.tags.orEmpty().mapNotNull { it.item }
                        .filter { activeTagItem(it, library) }.distinctBy { it.key }
                    TagUsage(provided?.get(tag.name) ?: Tag(tag),
                        assignments.count { document != null && it.rawType == "annotation" && it.parent?.key == document },
                        assignments.size)
                }.toMutableList()
                val loadedNames = usages.map { it.tag.name }.toHashSet()
                provided?.values?.filter { it.name !in loadedNames }
                    ?.forEach { usages.add(TagUsage(it)) }
                TagSuggestions(usages)
            }
        }

    /** Own Realm handle, closed with the picker. Any sync/tag change invalidates the cached counts. */
    fun observe(onChange: () -> Unit): AutoCloseable {
        val realm = Realm.getInstance(database.config)
        val listener = RealmChangeListener<Realm> { onChange() }
        realm.addChangeListener(listener)
        return AutoCloseable { realm.removeChangeListener(listener); realm.close() }
    }
}

internal fun activeTagItem(item: RItem, library: LibraryIdentifier): Boolean {
    var ancestor: RItem? = item
    val visited = mutableSetOf<String>()
    while (ancestor != null) {
        if (!visited.add(ancestor.key) || ancestor.deleted || ancestor.trash) return false
        val sameLibrary = when (library) {
            is LibraryIdentifier.custom -> ancestor.customLibraryKey == library.type.name && ancestor.groupKey == null
            is LibraryIdentifier.group -> ancestor.groupKey == library.groupId && ancestor.customLibraryKey == null
        }
        if (!sameLibrary) return false
        ancestor = ancestor.parent
    }
    return true
}
