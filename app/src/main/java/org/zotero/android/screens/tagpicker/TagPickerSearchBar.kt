package org.zotero.android.screens.tagpicker

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.input.*
import org.zotero.android.uicomponents.Strings
import org.zotero.android.uicomponents.textinput.SearchViewM3

@Composable
internal fun TagPickerSearchBar(
    onSearchAction: (() -> Unit)? = null,
    searchBarOnInnerValueChanged: (TextFieldValue) -> Unit,
    searchBarTextFieldState: TextFieldValue,
    horizontalPadding: Dp = 12.dp,
    completion: String? = null,
    onMoveHighlight: (Int) -> Unit = {},
) {

    SearchViewM3(
        horizontalPadding = horizontalPadding,
        hint = stringResource(id = Strings.tag_picker_placeholder),
        onSearchImeClicked = onSearchAction,
        onInnerValueChanged = searchBarOnInnerValueChanged,
        textFieldState = searchBarTextFieldState,
        visualTransformation = TagCompletionTransformation(completion),
        inputModifier = Modifier.onPreviewKeyEvent { event ->
            if (searchBarTextFieldState.composition != null || event.type != KeyEventType.KeyDown) false
            else when (event.key) {
                Key.DirectionDown -> { onMoveHighlight(1); true }
                Key.DirectionUp -> { onMoveHighlight(-1); true }
                Key.Enter, Key.NumPadEnter -> { onSearchAction?.invoke(); true }
                else -> false
            }
        },
    )
}

/** Only the drawn suffix changes; editing and IME offsets refer to the original text. */
internal class TagCompletionTransformation(private val completion: String?) : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        val target = completion?.takeIf { it.startsWith(text.text, true) && it.length > text.length }
            ?: return TransformedText(text, OffsetMapping.Identity)
        val rendered = AnnotatedString.Builder().apply {
            append(text)
            pushStyle(SpanStyle(color = Color.Gray))
            append(target.substring(text.length))
            pop()
        }.toAnnotatedString()
        return TransformedText(rendered, object : OffsetMapping {
            override fun originalToTransformed(offset: Int) = offset.coerceIn(0, text.length)
            override fun transformedToOriginal(offset: Int) = offset.coerceIn(0, text.length)
        })
    }
}
