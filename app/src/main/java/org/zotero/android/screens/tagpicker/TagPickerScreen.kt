package org.zotero.android.screens.tagpicker

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.Text
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import org.zotero.android.uicomponents.Strings
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.NavigationBarDefaults
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.TextFieldValue
import androidx.hilt.navigation.compose.hiltViewModel
import org.zotero.android.screens.tagpicker.row.TagPickerCreateTagRow
import org.zotero.android.screens.tagpicker.row.TagPickerRow
import org.zotero.android.uicomponents.CustomScaffoldM3
import org.zotero.android.uicomponents.themem3.AppThemeM3

@Composable
internal fun TagPickerScreen(
    onBack: () -> Unit,
    viewModel: TagPickerViewModel = hiltViewModel(),
) {
    AppThemeM3 {
        val viewState by viewModel.viewStates.observeAsState(TagPickerViewState())
        val viewEffect by viewModel.viewEffects.observeAsState()
        LaunchedEffect(key1 = viewModel) {
            viewModel.init()
        }

        LaunchedEffect(key1 = viewEffect) {
            when (viewEffect?.consume()) {
                null -> Unit
                is TagPickerViewEffect.OnBack -> {
                    onBack()
                }
            }
        }
        val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()
        CustomScaffoldM3(
            scrollBehavior = scrollBehavior,
            topBar = {
                TagPickerTopBar(
                    onCancelClicked = onBack,
                    onSave = viewModel::onSave,
                    viewState = viewState,
                    scrollBehavior = scrollBehavior,
                )
            },
        ) {
            Column {
                TagPickerSearchBar(
                    onSearchAction = viewModel::acceptSuggestion,
                    searchBarOnInnerValueChanged = viewModel::search,
                    searchBarTextFieldState = viewState.input,
                    completion = viewState.ghostCandidate?.name,
                    onMoveHighlight = viewModel::moveHighlight,
                )
                if (viewState.notice != null) {
                    val message = when (viewState.notice) {
                        TagNotice.ChooseOrCreate -> Strings.tag_suggestion_choose_or_create
                        TagNotice.Wait -> Strings.tag_suggestion_wait
                        else -> Strings.tag_suggestion_load_failed
                    }
                    Text(stringResource(message), modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.error)
                }
                LazyColumn {
                    if (viewState.selectedTags.isNotEmpty()) {
                        item { Text(stringResource(Strings.tag_suggestion_selected), Modifier.padding(16.dp)) }
                    }
                    items(items = viewModel.selectedTags(), key = { "selected:" + it.name }) { tag ->
                        TagPickerRow(text = tag.name, tagColorHex = tag.color, isChecked = true,
                            onTap = { viewModel.selectOrDeselect(tag.name) })
                    }
                    item { Text(stringResource(Strings.tag_suggestion_suggestions), Modifier.padding(16.dp)) }
                    itemsIndexed(items = viewState.tags, key = { _, tag -> "suggestion:" + tag.name }) { index, tag ->
                        Box(Modifier.background(if (index == viewState.highlighted)
                            MaterialTheme.colorScheme.surfaceVariant else Color.Transparent)) {
                            TagPickerRow(text = tag.name, tagColorHex = tag.color, isChecked = false,
                                onTap = { viewModel.selectOrDeselect(tag.name) })
                        }
                    }
                    if (viewState.showAddTagButton && viewState.ready) {
                        item {
                            TagPickerCreateTagRow(
                                tagName = viewState.searchTerm.trim(),
                                onTap = viewModel::createTag,
                            )
                        }
                    }
                    item {
                        Spacer(modifier = Modifier.windowInsetsPadding(NavigationBarDefaults.windowInsets))
                    }
                }

            }
        }
    }
}