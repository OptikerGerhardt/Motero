package org.zotero.android.screens.settings

import android.net.Uri
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import org.zotero.android.screens.dashboard.BuildInfo
import org.zotero.android.screens.settings.elements.NewSettingsDivider
import org.zotero.android.screens.settings.elements.NewSettingsItem
import org.zotero.android.uicomponents.CustomScaffoldM3
import org.zotero.android.uicomponents.Strings
import org.zotero.android.uicomponents.themem3.AppThemeM3

@Composable
internal fun SettingsScreen(
    onBack: () -> Unit,
    onOpenWebpage: (url: String) -> Unit,
    toAccountScreen: () -> Unit,
    toDebugScreen: () -> Unit,
    toCiteScreen: () -> Unit,
    toPageTurningScreen: () -> Unit,
    toQuickCopyScreen: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel(),
) {
    var showDeviceSettings by androidx.compose.runtime.saveable.rememberSaveable { androidx.compose.runtime.mutableStateOf(false) }
    if (showDeviceSettings) {
        androidx.activity.compose.BackHandler { showDeviceSettings = false }
        org.zotero.android.ereader.EReaderSettingsScreen(nativeSelection = viewModel.nativeSelection(), onNativeSelection = viewModel::setNativeSelection) { showDeviceSettings = false }
        return
    }
    AppThemeM3 {
        val viewEffect by viewModel.viewEffects.observeAsState()
        LaunchedEffect(key1 = viewModel) {
            viewModel.init()
        }

        LaunchedEffect(key1 = viewEffect) {
            when (val consumedEffect = viewEffect?.consume()) {
                null -> Unit
                is SettingsViewEffect.OnBack -> {
                    onBack()
                }

                is SettingsViewEffect.OpenWebpage -> {
                    onOpenWebpage(consumedEffect.url)
                }
            }
        }
        CustomScaffoldM3(
            topBar = {
                SettingsTopBar(
                    onClose = onBack,
                )
            },
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize().verticalScroll(rememberScrollState())
            ) {
                Spacer(modifier = Modifier.height(4.dp))
                NewSettingsItem(
                    title = stringResource(id = Strings.settings_sync_account),
                    onItemTapped = toAccountScreen,
                )

                NewSettingsDivider()

                NewSettingsItem(
                    title = stringResource(id = Strings.settings_export_title),
                    onItemTapped = toQuickCopyScreen,
                )
                NewSettingsItem(
                    title = stringResource(id = Strings.settings_cite_title),
                    onItemTapped = toCiteScreen,
                )
                NewSettingsItem(
                    title = stringResource(id = Strings.settings_debug),
                    onItemTapped = toDebugScreen,
                )

                NewSettingsDivider()

                NewSettingsItem(
                    title = stringResource(id = Strings.support_feedback),
                    onItemTapped = viewModel::openSupportAndFeedback
                )
                NewSettingsItem(
                    title = stringResource(id = Strings.privacy_policy),
                    onItemTapped = viewModel::openPrivacyPolicy
                )

                NewSettingsDivider()

                NewSettingsItem(title = stringResource(org.zotero.android.R.string.reader326_controls_title), onItemTapped = { showDeviceSettings = true })
                NewSettingsDivider()
                BuildInfo()
            }
        }
    }
}