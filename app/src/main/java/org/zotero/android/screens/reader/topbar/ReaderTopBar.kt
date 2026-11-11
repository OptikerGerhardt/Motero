package org.zotero.android.screens.reader.topbar

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.PlainTooltip
import androidx.compose.material3.Text
import androidx.compose.material3.TooltipAnchorPosition
import androidx.compose.material3.TooltipBox
import androidx.compose.material3.TooltipDefaults.rememberTooltipPositionProvider
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberTooltipState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import org.zotero.android.architecture.ui.CustomLayoutSize
import org.zotero.android.screens.reader.ReaderViewModel
import org.zotero.android.screens.reader.ReaderViewState
import org.zotero.android.screens.reader.data.ReaderFileType
import org.zotero.android.screens.reader.search.ReaderSearchViewModel
import org.zotero.android.screens.reader.search.ReaderSearchViewState
import org.zotero.android.screens.reader.search.popup.ReaderSearchPopup
import org.zotero.android.uicomponents.Drawables
import org.zotero.android.uicomponents.Strings
import org.zotero.android.uicomponents.foundation.safeStringResource
import org.zotero.android.uicomponents.icon.IconWithPaddingM3

@Composable
internal fun ReaderTopBar(
    onBack: () -> Unit,
    onShowHideSideBar: () -> Unit,
    toPdfSettings: () -> Unit,
    toggleReadingMode: () -> Unit,
    onShowHidePdfSearch: () -> Unit,
    toggleToolbarButton: () -> Unit,
    onStylusSettings: () -> Unit,
    isToolbarButtonSelected: Boolean,
    showSideBar: Boolean,
    showPdfSearch: Boolean,
    viewState: ReaderViewState,
    viewModel: ReaderViewModel,
    readerSearchViewModel: ReaderSearchViewModel,
    readerSearchViewState: ReaderSearchViewState,
    floating: Boolean = false,
) {
    val isTablet = CustomLayoutSize.calculateLayoutType().isTablet()

    val navigation: @Composable () -> Unit = {
            IconButton(onClick = onBack) {
                Icon(
                    painter = painterResource(Drawables.arrow_back_24dp),
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurface,
                )
            }
    }
    val leading: @Composable () -> Unit = {
            TooltipBox(
                positionProvider = rememberTooltipPositionProvider(
                    TooltipAnchorPosition.Below,
                    4.dp
                ),
                tooltip = {
                    PlainTooltip() {
                        Text(
                            safeStringResource(
                                Strings.pdf_reader_sidebar
                            )
                        )
                    }
                },
                state = rememberTooltipState()
            ) {
                IconWithPaddingM3(
                    unselectedDrawableRes = Drawables.view_sidebar,
                    selectedDrawableRes = Drawables.view_sidebar_filled,
                    onToggle = {
                        onShowHideSideBar()
                    },
                    isSelected = showSideBar
                )
            }

            if (viewState.fileType == ReaderFileType.PDF) {
                TooltipBox(
                    positionProvider = rememberTooltipPositionProvider(
                        TooltipAnchorPosition.Below,
                        4.dp
                    ),
                    tooltip = {
                        PlainTooltip() {
                            Text(
                                safeStringResource(
                                    Strings.pdf_reader_plain_reader
                                )
                            )
                        }
                    },
                    state = rememberTooltipState()
                ) {
                    if (viewState.readingModeLoading) {
                        Box(modifier = Modifier.size(48.dp)) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp).align(androidx.compose.ui.Alignment.Center),
                                strokeWidth = 2.dp,
                            )
                        }
                    } else {
                        IconWithPaddingM3(
                            unselectedDrawableRes = Drawables.reader,
                            selectedDrawableRes = Drawables.reader,
                            onToggle = toggleReadingMode,
                            isSelected = viewState.readingModeEnabled
                        )
                    }
                }
            }


    }
    val trailing: @Composable () -> Unit = {
            TooltipBox(
                positionProvider = rememberTooltipPositionProvider(
                    TooltipAnchorPosition.Below,
                    4.dp
                ),
                tooltip = {
                    PlainTooltip() {
                        Text(
                            safeStringResource(
                                Strings.pdf_reader_toolbar
                            )
                        )
                    }
                },
                state = rememberTooltipState(),
                enableUserInput = false
            ) {
                IconWithPaddingM3(
                    unselectedDrawableRes = Drawables.draw,
                    selectedDrawableRes = Drawables.draw_filled,
                    onToggle = toggleToolbarButton,
                    onLongClick = onStylusSettings,
                    contentDescription = androidx.compose.ui.res.stringResource(org.zotero.android.R.string.reader_stylus_settings),
                    isSelected = isToolbarButtonSelected
                )
            }

            if (isTablet) {
                Box {
                    TooltipBox(
                        positionProvider = rememberTooltipPositionProvider(
                            TooltipAnchorPosition.Below,
                            4.dp
                        ),
                        tooltip = {
                            PlainTooltip() {
                                Text(
                                    safeStringResource(
                                        Strings.searchbar_placeholder
                                    )
                                )
                            }
                        },
                        state = rememberTooltipState()
                    ) {
                        IconWithPaddingM3(
                            unselectedDrawableRes = Drawables.search,
                            selectedDrawableRes = Drawables.search,
                            onToggle = onShowHidePdfSearch,
                            isSelected = true,
                        )

                    }
                    if (viewState.showPdfSearch) {
                        ReaderSearchPopup(
                            viewModel = viewModel,
                            readerSearchViewState = readerSearchViewState,
                            readerSearchViewModel = readerSearchViewModel,
                        )
                    }
                }
            } else {
                TooltipBox(
                    positionProvider = rememberTooltipPositionProvider(
                        TooltipAnchorPosition.Below,
                        4.dp
                    ),
                    tooltip = {
                        PlainTooltip() {
                            Text(
                                safeStringResource(
                                    Strings.searchbar_placeholder
                                )
                            )
                        }
                    },
                    state = rememberTooltipState()
                ) {
                    IconWithPaddingM3(
                        unselectedDrawableRes = Drawables.search,
                        selectedDrawableRes = Drawables.search,
                        onToggle = {
                            onShowHidePdfSearch()
                        },
                        isSelected = showPdfSearch
                    )
                }
            }

            TooltipBox(
                positionProvider = rememberTooltipPositionProvider(
                    TooltipAnchorPosition.Below,
                    4.dp
                ),
                tooltip = {
                    PlainTooltip() {
                        Text(
                            safeStringResource(
                                Strings.settings_title
                            )
                        )
                    }
                },
                state = rememberTooltipState()
            ) {
                IconWithPaddingM3(
                    unselectedDrawableRes = Drawables.match_case_24,
                    selectedDrawableRes = Drawables.match_case_24,
                    onToggle = toPdfSettings,
                    isSelected = false
                )

            }
    }
    ReaderToolbarSurface(floating = floating,
        leading = { navigation(); leading() }, trailing = { trailing() })
}
