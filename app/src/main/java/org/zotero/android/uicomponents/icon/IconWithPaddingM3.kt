package org.zotero.android.uicomponents.icon

import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.size
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.annotation.DrawableRes
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.painterResource

@Composable
fun IconWithPaddingM3(
    @DrawableRes unselectedDrawableRes: Int,
    @DrawableRes selectedDrawableRes: Int,
    isSelected: Boolean,
    onToggle: (() -> Unit),
    onLongClick: (() -> Unit)? = null,
    contentDescription: String? = null,
) {
    val tintColor = if (isSelected) {
        MaterialTheme.colorScheme.primary
    } else {
        MaterialTheme.colorScheme.onSurfaceVariant
    }
    val drawableRes = if (isSelected) {
        selectedDrawableRes
    } else {
        unselectedDrawableRes
    }
    val icon: @Composable () -> Unit = {
        Icon(
            painter = painterResource(id = drawableRes),
            contentDescription = contentDescription,
            tint = tintColor
        )
    }
    if (onLongClick == null) IconButton(onClick = onToggle) { icon() }
    else androidx.compose.foundation.layout.Box(
        modifier = androidx.compose.ui.Modifier
            .size(48.dp).clip(androidx.compose.foundation.shape.CircleShape)
            .combinedClickable(onClick = onToggle, onLongClick = onLongClick,
                role = androidx.compose.ui.semantics.Role.Button),
        contentAlignment = androidx.compose.ui.Alignment.Center,
    ) { icon() }
}
