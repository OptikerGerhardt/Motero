package org.zotero.android.screens.reader.settings

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Modifier
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.hilt.navigation.compose.hiltViewModel
import org.zotero.android.screens.reader.settings.data.ReaderSettingsArgs
import org.zotero.android.uicomponents.CustomScaffoldM3
import org.zotero.android.uicomponents.themem3.AppThemeM3

@Composable
internal fun ReaderSettingsScreen(
    args: ReaderSettingsArgs?,
    onBack: () -> Unit,
    viewModel: ReaderSettingsViewModel = hiltViewModel(),
) {
    LaunchedEffect(args) { viewModel.init(args = args) }
    viewModel.setOsTheme(isDark = isSystemInDarkTheme())
    val viewState by viewModel.viewStates.observeAsState(ReaderSettingsViewState())
    var deviceSettings by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }
    if (deviceSettings) {
        BackHandler { deviceSettings = false }
        org.zotero.android.ereader.EReaderSettingsScreen(darkTheme = viewState.isDark, onBack = { deviceSettings = false })
        return
    }
    val applyParamsAndBack: () -> Unit = {
        viewModel.applyChangesImmediately()
        onBack()
    }

    BackHandler(onBack = {
        applyParamsAndBack()
    })
    AppThemeM3(
        darkTheme = viewState.isDark,
    ) {
        CustomScaffoldM3(
            topBar = {
                ReaderSettingsTopBar(
                    onDone = applyParamsAndBack,
                    onSave = applyParamsAndBack,
                )
            },
        ) { insets ->
            ReaderSettingsTable(viewState, viewModel, modifier = Modifier.padding(bottom = insets.calculateBottomPadding()), onDeviceSettings = { deviceSettings = true }, onManualCrop = {
                onBack()
                viewModel.applyChangesImmediately(startManualCrop = true)
            })
        }
    }
}
