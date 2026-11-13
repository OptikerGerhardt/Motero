package org.zotero.android.screens.settings.pageturning

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.hilt.navigation.compose.hiltViewModel

/** The same persisted controls inline in Reader Controls, without another route. */
@Composable
internal fun ReaderPageTurningControls(viewModel: SettingsPageTurningViewModel = hiltViewModel()) {
    val state by viewModel.viewStates.observeAsState(SettingsPageTurningViewState())
    LaunchedEffect(viewModel) { viewModel.init() }
    SettingsPageTurningSections(
        buttonPageTurning = state.pageTurning,
        onButtonPageTurningSwitchTapped = viewModel::onButtonPageTurningSwitchTapped,
        reversed = state.reversed,
        onReverseChanged = viewModel::onReverseChanged,
        scrollPercent = state.scrollPercent,
        onScrollPercentChanged = viewModel::onScrollPercentChanged,
        buttonKeepZoom = state.keepZoom,
        onButtonKeepZoomSwitchTapped = viewModel::onButtonKeepZoomSwitchTapped,
    )
}
