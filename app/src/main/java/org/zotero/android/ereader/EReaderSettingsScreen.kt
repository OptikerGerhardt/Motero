package org.zotero.android.ereader

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import org.zotero.android.uicomponents.Drawables
import org.zotero.android.uicomponents.CustomScaffoldM3
import org.zotero.android.uicomponents.themem3.AppThemeM3

@Composable
fun EReaderSettingsScreen(darkTheme: Boolean = androidx.compose.foundation.isSystemInDarkTheme(), onBack: () -> Unit) {
    val profile by DeviceProfileStore.state.collectAsState()
    val diagnostics by DeviceInput.diagnostics.collectAsState()
    DisposableEffect(Unit) { onDispose { DeviceInput.learnKey = false; DeviceInput.reset() } }
    AppThemeM3(darkTheme = darkTheme) {
        CustomScaffoldM3(topBar = {
            TopAppBar(title = { Text("E-Reader and stylus") }, navigationIcon = {
                IconButton(onClick = onBack) { Icon(painterResource(Drawables.arrow_back_24dp), "Back") }
            })
        }) {
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("E-Reader mode", Modifier.weight(1f)); Switch(profile.eReader, { DeviceProfileStore.update(profile.copy(eReader = it)) })
                }
                Text("Higher contrast and instant transitions throughout the app. Your app and reader appearance choices stay unchanged.")
                HorizontalDivider()
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Stylus draws, fingers navigate", Modifier.weight(1f)); Switch(profile.penOnly, { DeviceInput.reset(); DeviceProfileStore.update(profile.copy(penOnly = it)) })
                }
                Text("Disable for finger drawing or pens reported as fingers. Palm protection requires a recognized stylus; fingers can scroll and zoom while the pen is lifted.")
                Text("Eraser button", style = MaterialTheme.typography.titleMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(profile.eraserButtonMode == "hold", { DeviceInput.reset(); DeviceProfileStore.update(profile.copy(eraserButtonMode = "hold")) }, { Text("Hold") })
                    FilterChip(profile.eraserButtonMode == "toggle", { DeviceInput.reset(); DeviceProfileStore.update(profile.copy(eraserButtonMode = "toggle")) }, { Text("Toggle") })
                }
                Text("Pointer button")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(profile.buttonMask == 2, { DeviceProfileStore.update(profile.copy(buttonMask = 2)) }, { Text("Primary") })
                    FilterChip(profile.buttonMask == 4, { DeviceProfileStore.update(profile.copy(buttonMask = 4)) }, { Text("Secondary") })
                }
                var learning by remember { mutableStateOf(false) }
                LaunchedEffect(diagnostics) { if (!DeviceInput.learnKey) learning = false }
                OutlinedButton(onClick = { learning = !learning; DeviceInput.learnKey = learning }) { Text(if (learning) "Press the stylus key… (tap to cancel)" else "Assign a hardware stylus key") }
                Text("Volume/page keys and text input stay reserved. An eraser tip is recognized automatically when Android reports it.")
                HorizontalDivider()
                Text("Input diagnostics", style = MaterialTheme.typography.titleMedium)
                Text(diagnostics)
                Text("Live input type, buttons, pressure and hover only. No document content or stroke coordinates are recorded.")
                Text("BOOX native preview is not available until SDK licensing, device support and latency have been verified. Standard stylus input remains available.")
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}
