package org.zotero.android.screens.tagpicker

import androidx.compose.ui.text.input.TextFieldValue
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.collections.immutable.*
import kotlinx.coroutines.*
import org.greenrobot.eventbus.EventBus
import org.zotero.android.architecture.*
import org.zotero.android.screens.tagpicker.data.TagPickerArgs
import org.zotero.android.screens.tagpicker.data.TagPickerResult
import org.zotero.android.sync.Tag
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
internal class TagPickerViewModel @Inject constructor(
    private val repository: TagSuggestionRepository,
) : BaseViewModel2<TagPickerViewState, TagPickerViewEffect>(TagPickerViewState()) {
    private lateinit var args: TagPickerArgs
    private var index: TagSuggestions? = null
    private val known = linkedMapOf<String, Tag>()
    private val created = linkedMapOf<String, Tag>()
    private var observer: AutoCloseable? = null
    private var loadJob: Job? = null
    private var searchJob: Job? = null
    private var generation = 0

    fun init() = initOnce {
        args = ScreenArguments.tagPickerArgs
        known.putAll(args.selectedTags.associateWith { Tag(it, "") })
        known.putAll(args.tags.associateBy { it.name })
        updateState { copy(selectedTags = args.selectedTags.toPersistentSet()) }
        try { observer = repository.observe { reload() } }
        catch (e: Exception) { Timber.e(e, "TagPicker: observing tags failed") }
        reload()
    }

    private fun reload() {
        loadJob?.cancel()
        searchJob?.cancel()
        index = null
        generation++
        updateState { copy(ready = false, completion = null, tags = persistentListOf()) }
        loadJob = viewModelScope.launch {
            try {
                val restricted = args.tags.isNotEmpty() || args.callPoint in setOf(
                    TagPickerResult.CallPoint.ReaderFilter, TagPickerResult.CallPoint.ReaderSidebarFilter)
                val loaded = repository.load(args.libraryId, args.documentKey, args.tags.takeIf { restricted })
                ensureActive()
                index = loaded.withTags(created.values)
                known.putAll(loaded.allTags)
                refresh()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) {
                Timber.e(e, "TagPicker: loading suggestions failed")
                updateState { copy(ready = false, notice = TagNotice.LoadFailed) }
            }
        }
    }

    fun search(value: TextFieldValue) {
        updateState { copy(input = value, notice = null, highlighted = -1, completion = null) }
        refresh()
    }

    private fun refresh() {
        searchJob?.cancel()
        val snapshot = index
        val text = viewState.searchTerm
        val selected = viewState.selectedTags
        val ticket = ++generation
        updateState { copy(ready = false, completion = null, tags = persistentListOf()) }
        if (snapshot == null) return
        searchJob = viewModelScope.launch {
            val matches = withContext(Dispatchers.Default) { snapshot.search(text, selected) }
            if (ticket != generation) return@launch
            updateState { copy(tags = matches.tags.toPersistentList(), ready = true,
                completion = matches.completion,
                hasExactTag = snapshot.exact(text.trim()) != null,
                showAddTagButton = text.isNotBlank() && snapshot.exact(text.trim()) == null
                    && created.keys.none { it.equals(text.trim(), true) }) }
        }
    }

    fun selectOrDeselect(name: String) {
        updateState { copy(selectedTags = if (name in selectedTags) selectedTags.remove(name)
            else selectedTags.add(name), notice = null) }
        if (viewState.searchTerm.isNotEmpty()) search(TextFieldValue()) else refresh()
    }

    fun moveHighlight(delta: Int) {
        if (!viewState.ready || viewState.tags.isEmpty() || viewState.input.composition != null) return
        val count = viewState.tags.size
        val next = if (viewState.highlighted < 0) (if (delta > 0) 0 else count - 1)
            else (viewState.highlighted + delta + count) % count
        updateState { copy(highlighted = next) }
    }

    /** Enter/Save accepts an exact tag or a proposal the user can actually see. */
    private fun acceptInput(): Boolean {
        val state = viewState
        if (!state.ready || state.input.composition != null) {
            updateState { copy(notice = TagNotice.Wait) }; return false
        }
        if (state.searchTerm.isBlank()) return true
        val tag = index?.exact(state.searchTerm.trim())
            ?: created.values.firstOrNull { it.name.equals(state.searchTerm.trim(), true) }
            ?: state.tags.getOrNull(state.highlighted)
            ?: state.ghostCandidate
        if (tag == null) { updateState { copy(notice = TagNotice.ChooseOrCreate) }; return false }
        known[tag.name] = tag
        updateState { copy(selectedTags = selectedTags.add(tag.name), input = TextFieldValue(), notice = null) }
        refresh()
        return true
    }

    fun acceptSuggestion() { acceptInput() }

    /** New tags are created exclusively through the explicit create row. */
    fun createTag() {
        if (!viewState.ready || viewState.input.composition != null) return
        val name = viewState.searchTerm.trim()
        if (name.isEmpty()) return
        val tag = index?.exact(name) ?: Tag(name, "").also { created[name] = it }
        known[tag.name] = tag
        index = index?.withTags(listOf(tag))
        updateState { copy(selectedTags = selectedTags.add(tag.name), input = TextFieldValue(), notice = null) }
        refresh()
    }

    fun selectedTags(): List<Tag> = viewState.selectedTags.mapNotNull { known[it] }.sortedBy { it.name }

    fun onSave() {
        if (!acceptInput()) return
        EventBus.getDefault().post(TagPickerResult(selectedTags(), args.callPoint))
        triggerEffect(TagPickerViewEffect.OnBack)
    }

    override fun onCleared() { observer?.close(); super.onCleared() }
}

internal enum class TagNotice { ChooseOrCreate, Wait, LoadFailed }
internal data class TagPickerViewState(
    val tags: PersistentList<Tag> = persistentListOf(),
    val selectedTags: PersistentSet<String> = persistentSetOf(),
    val input: TextFieldValue = TextFieldValue(),
    val completion: Tag? = null,
    val highlighted: Int = -1,
    val hasExactTag: Boolean = false,
    val ready: Boolean = false,
    val notice: TagNotice? = null,
    val showAddTagButton: Boolean = false,
) : ViewState {
    val searchTerm get() = input.text
    val ghostCandidate: Tag? get() = completion?.takeIf {
        input.composition == null && input.selection.collapsed && input.selection.end == input.text.length
            && input.text.length >= 3 && it.name.length > input.text.length && it.name.startsWith(input.text, true)
            && highlighted < 0 && ready && !hasExactTag
    }
}
internal sealed class TagPickerViewEffect : ViewEffect { object OnBack : TagPickerViewEffect() }
