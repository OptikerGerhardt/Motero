package org.zotero.android.ereader

import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier

/** Keep Compose's normal transition untouched outside the opt-in device profile. */
@Composable
fun <T> DeviceAnimatedContent(targetState: T, modifier: Modifier = Modifier, label: String = "", content: @Composable (T) -> Unit) {
    val profile by DeviceProfileStore.state.collectAsState()
    if (profile.eReader) Box(modifier) { content(targetState) }
    else AnimatedContent(targetState = targetState, modifier = modifier, label = label) { content(it) }
}
