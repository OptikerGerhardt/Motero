package org.zotero.android.ereader

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import org.zotero.android.R
import org.zotero.android.uicomponents.Drawables
import org.zotero.android.uicomponents.Strings
import org.zotero.android.uicomponents.CustomScaffoldM3
import org.zotero.android.uicomponents.controls.CustomSwitch
import org.zotero.android.uicomponents.themem3.AppThemeM3
import org.zotero.android.screens.settings.elements.NewSettingsItem
import org.zotero.android.screens.settings.elements.NewSettingsDivider
import org.zotero.android.screens.settings.elements.NewSettingsSectionTitle

@Composable
fun EReaderSettingsScreen(stylusOnly: Boolean = false, nativeSelection: Boolean = false,
    onNativeSelection: (Boolean) -> Unit = {}, onPageTurning: () -> Unit = {},
    darkTheme: Boolean = androidx.compose.foundation.isSystemInDarkTheme(), onBack: () -> Unit) {
    val profile by DeviceProfileStore.state.collectAsState()
    val diagnostics by DeviceInput.diagnostics.collectAsState()
    var learning by remember { mutableStateOf(false) }
    DisposableEffect(Unit) { onDispose { DeviceInput.learnKey = false; DeviceInput.reset() } }
    LaunchedEffect(diagnostics) { if (!DeviceInput.learnKey) learning = false }
    AppThemeM3(darkTheme = darkTheme) {
        CustomScaffoldM3(topBar = {
            TopAppBar(colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface,
                scrolledContainerColor = MaterialTheme.colorScheme.surfaceContainer),
                title = { Text(stringResource(if (stylusOnly) R.string.reader326_stylus_title else R.string.reader326_controls_title),
                    style = MaterialTheme.typography.titleLarge) }, navigationIcon = {
                    IconButton(onClick = onBack) { Icon(painterResource(Drawables.arrow_back_24dp), null) }
                })
        }) {
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())
                .windowInsetsPadding(WindowInsets.navigationBars).padding(vertical = 8.dp)) {
                if (!stylusOnly) {
                    ReaderControlSwitch(R.string.reader326_ink_mode, profile.eReader) { DeviceProfileStore.update(profile.copy(eReader = it)) }
                    ControlDescription(R.string.reader326_ink_description)
                    NewSettingsDivider()
                    NewSettingsItem(stringResource(Strings.settings_page_turning_title), onItemTapped = onPageTurning)
                    NewSettingsDivider()
                    NewSettingsSectionTitle(R.string.reader326_selection_title)
                    var androidSelection by remember(nativeSelection) { mutableStateOf(nativeSelection) }
                    ControlChoices(listOf(stringResource(Strings.pdf_settings_selection_direct), stringResource(Strings.pdf_settings_selection_android)),
                        if (androidSelection) 1 else 0) { androidSelection = it == 1; onNativeSelection(androidSelection) }
                    ReaderControlSwitch(R.string.reader326_back_protection, profile.protectReaderEdges) { DeviceProfileStore.update(profile.copy(protectReaderEdges = it)) }
                    ControlDescription(R.string.reader326_back_description)
                    NewSettingsDivider()
                    NewSettingsSectionTitle(R.string.reader326_stylus_title)
                }
                ReaderControlSwitch(R.string.reader326_pen_only, profile.penOnly) { DeviceInput.reset(); DeviceProfileStore.update(profile.copy(penOnly = it)) }
                ControlDescription(R.string.reader326_pen_only_description)
                NewSettingsDivider()
                NewSettingsSectionTitle(R.string.reader326_eraser_button)
                ControlChoices(listOf(stringResource(R.string.reader326_button_hold), stringResource(R.string.reader326_button_toggle)),
                    if (profile.eraserButtonMode == "toggle") 1 else 0) { DeviceInput.reset(); DeviceProfileStore.update(profile.copy(eraserButtonMode = if (it == 1) "toggle" else "hold")) }
                NewSettingsSectionTitle(R.string.reader326_pointer_button)
                ControlChoices(listOf(stringResource(R.string.reader326_button_primary), stringResource(R.string.reader326_button_secondary)),
                    if (profile.buttonMask == 4) 1 else 0) { DeviceProfileStore.update(profile.copy(buttonMask = if (it == 1) 4 else 2)) }
                NewSettingsItem(stringResource(if (learning) R.string.reader326_key_learning else R.string.reader326_assign_key), onItemTapped = {
                    learning = !learning; DeviceInput.learnKey = learning
                })
                ControlDescription(R.string.reader326_key_description)
                NewSettingsDivider()
                NewSettingsSectionTitle(R.string.reader326_diagnostics_title)
                Text(diagnostics, Modifier.padding(horizontal = 16.dp, vertical = 8.dp), style = MaterialTheme.typography.bodyMedium)
                ControlDescription(R.string.reader326_diagnostics_description)
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun ReaderControlSwitch(title: Int, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min = 56.dp).padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(stringResource(title), Modifier.weight(1f), style = MaterialTheme.typography.bodyLarge)
        CustomSwitch(checked = checked, onCheckedChange = onChange)
    }
}

@Composable
private fun ControlDescription(text: Int) {
    Text(stringResource(text), Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
}

@Composable
private fun ControlChoices(labels: List<String>, selected: Int, onSelect: (Int) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
        labels.forEachIndexed { i, label ->
            ToggleButton(checked = selected == i, onCheckedChange = { onSelect(i) }, modifier = Modifier.weight(1f),
                colors = ToggleButtonDefaults.toggleButtonColors(checkedContainerColor = MaterialTheme.colorScheme.secondary,
                    checkedContentColor = MaterialTheme.colorScheme.onSecondary),
                shapes = if (i == 0) ButtonGroupDefaults.connectedLeadingButtonShapes() else ButtonGroupDefaults.connectedTrailingButtonShapes()) { Text(label) }
        }
    }
}
