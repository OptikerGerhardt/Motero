package org.zotero.android.screens.reader

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import org.zotero.android.ereader.deviceTween as tween
import androidx.compose.animation.rememberSplineBasedDecay
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.AnchoredDraggableState
import androidx.compose.foundation.gestures.DraggableAnchors
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.displayCutout
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.navigationBarsIgnoringVisibility
import androidx.compose.foundation.layout.statusBarsIgnoringVisibility
import androidx.compose.foundation.layout.union
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBarDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.dp
import org.zotero.android.screens.reader.data.ReaderFileType
import org.zotero.android.screens.reader.scrubber.ReaderPageHistoryArrowButton
import org.zotero.android.screens.reader.scrubber.ReaderScrubberViewModel
import org.zotero.android.screens.reader.toolbar.ReaderAnnotationCreationToolbar


@Composable
internal fun ReaderBox(
    viewModel: ReaderViewModel,
    viewState: ReaderViewState,
    scrubberViewModel: ReaderScrubberViewModel,
    isOverlayMode: Boolean,
) {
    val density = LocalDensity.current
    var viewportHeight by remember { mutableStateOf(0f) }
    val positionalThreshold = { distance: Float -> distance * 0.5f }
    val velocityThreshold = { with(density) { 1000.dp.toPx() } }
    val animationSpec = tween<Float>()

    var shouldShowSnapTargetAreas: Boolean by remember { mutableStateOf(false) }
    val confirmValueChange = { newValue: DragAnchors ->
        shouldShowSnapTargetAreas = false
        true
    }
    val decayAnimationSpec = rememberSplineBasedDecay<Float>()
    val anchoredDraggableState: AnchoredDraggableState<DragAnchors> = rememberSaveable(
        saver = AnchoredDraggableState.Saver(
            snapAnimationSpec = animationSpec,
            positionalThreshold = positionalThreshold,
            velocityThreshold = velocityThreshold,
            confirmValueChange = confirmValueChange,
            decayAnimationSpec = decayAnimationSpec
        )
    ) {
        AnchoredDraggableState(
            initialValue = DragAnchors.Start,
            positionalThreshold = positionalThreshold,
            velocityThreshold = velocityThreshold,
            snapAnimationSpec = animationSpec,
            decayAnimationSpec = decayAnimationSpec,
            confirmValueChange = confirmValueChange,
        )
    }
    val extraRightPadding = if (isOverlayMode && viewState.showSideBar) {
        330.dp
    } else {
        0.dp
    }

    val rightTargetAreaXOffset = with(density) { 96.dp.toPx() + extraRightPadding.toPx() }

    Column(
        Modifier
            .fillMaxSize()
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .onSizeChanged { layoutSize ->
                    viewportHeight = layoutSize.height / density.density
                    val dragEndPoint = layoutSize.width - rightTargetAreaXOffset
                    anchoredDraggableState.updateAnchors(
                        DraggableAnchors {
                            DragAnchors.entries
                                .forEach { anchor ->
                                    anchor at dragEndPoint * anchor.fraction
                                }
                        }
                    )
                }
        ) {
            // PDF pages use the full viewport; native chrome overlays them.
            // Only the crop editor and reflowable documents reserve safe insets.
            val readingInsets = run {
                val cutout = WindowInsets.displayCutout
                val direction = LocalLayoutDirection.current
                val hasCutout = cutout.getTop(density) > 0 || cutout.getBottom(density) > 0
                    || cutout.getLeft(density, direction) > 0 || cutout.getRight(density, direction) > 0
                val safeInsets = if (hasCutout) {
                    WindowInsets.statusBarsIgnoringVisibility.only(WindowInsetsSides.Top).union(cutout)
                } else WindowInsets(0, 0, 0, 0)
                safeInsets
            }
            val cropInsets = WindowInsets.statusBarsIgnoringVisibility.union(WindowInsets.displayCutout)
                .union(WindowInsets.navigationBarsIgnoringVisibility.only(WindowInsetsSides.Bottom))
            // EPUB keeps one stable, centered reading frame. Reserve the same
            // space above and below, including the progress strip and cutout.
            val epubEdge = with(density) {
                maxOf(WindowInsets.statusBarsIgnoringVisibility.union(WindowInsets.displayCutout).getTop(this),
                    WindowInsets.navigationBarsIgnoringVisibility.getBottom(this) + 40.dp.roundToPx()).toDp()
            }
            androidx.compose.runtime.LaunchedEffect(epubEdge, viewportHeight, viewState.fileType) {
                viewModel.setReaderViewportInset(if (viewState.fileType == ReaderFileType.EPUB) epubEdge.value else 0f, viewportHeight)
            }
            val readingModifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)
                .then(if (viewState.fileType == ReaderFileType.EPUB) Modifier
                    .windowInsetsPadding(WindowInsets.navigationBarsIgnoringVisibility.union(WindowInsets.displayCutout).only(WindowInsetsSides.Horizontal))
                    else if (viewState.fileType == ReaderFileType.HTML) Modifier.windowInsetsPadding(readingInsets) else Modifier)

            ReaderWebView(viewModel = viewModel, modifier = readingModifier)
            if (viewState.fileType == ReaderFileType.EPUB) {
                val progressBottomInset = with(density) { WindowInsets.navigationBarsIgnoringVisibility.getBottom(this).toDp().value }
                androidx.compose.runtime.LaunchedEffect(viewState.pageProgress, viewState.progressPosition, viewState.progressPercent,
                    viewState.progressMode, viewState.isTopBarVisible, viewState.isReaderLoading, progressBottomInset) {
                    viewModel.setReaderProgress(progressBottomInset)
                }
            }
            // This is an overlay, never a reserved strip in the PDF viewport.
            // Stable insets avoid a second layout jump as Android shows its bars.
            androidx.compose.animation.AnimatedVisibility(
                visible = viewState.isTopBarVisible || viewState.manualCropOpen,
                enter = slideInVertically(tween(220)) { -it } + fadeIn(tween(160)),
                exit = slideOutVertically(tween(180)) { -it } + fadeOut(tween(140)),
                modifier = Modifier.align(Alignment.TopCenter),
            ) {
                Box(Modifier.fillMaxWidth().height(with(density) {
                    WindowInsets.statusBarsIgnoringVisibility.union(WindowInsets.displayCutout).getTop(this).toDp()
                }).background(MaterialTheme.colorScheme.surface))
            }
            if ((viewState.fileType == ReaderFileType.HTML || viewState.readingModeEnabled) && viewState.showCreationToolbar && viewState.isTopBarVisible && !viewState.manualCropOpen) {
                ReaderAnnotationCreationToolbar(
                    viewState = viewState,
                    viewModel = viewModel,
                    isOverlayMode = isOverlayMode,
                    state = anchoredDraggableState,
                    onShowSnapTargetAreas = { shouldShowSnapTargetAreas = true },
                    shouldShowSnapTargetAreas = shouldShowSnapTargetAreas
                )
            }
            if (viewState.fileType == ReaderFileType.EPUB) {
                androidx.compose.animation.AnimatedVisibility(
                    visible = viewState.isTopBarVisible && viewState.showCreationToolbar && !viewState.showSideBar,
                    enter = slideInVertically(tween(220)) { it } + fadeIn(tween(160)),
                    exit = slideOutVertically(tween(180)) { it } + fadeOut(tween(140)),
                    modifier = Modifier.align(Alignment.BottomCenter),
                ) {
                    org.zotero.android.screens.reader.toolbar.ReaderEpubAnnotationDock(viewModel, viewState)
                }
            }
            if (viewState.manualCropOpen) Box(Modifier.fillMaxSize().windowInsetsPadding(cropInsets)) { ReaderCropControls(viewModel, viewState,
                topInset = cropInsets.getTop(density).toDouble() / density.density,
                bottomInset = 12.0 + maxOf(WindowInsets.navigationBarsIgnoringVisibility.getBottom(density), cropInsets.getBottom(density)) / density.density,
                leftInset = cropInsets.getLeft(density, LocalLayoutDirection.current).toDouble() / density.density,
                rightInset = cropInsets.getRight(density, LocalLayoutDirection.current).toDouble() / density.density) }
            if (viewState.fileType == ReaderFileType.PDF && !viewState.manualCropOpen) {
                val isScrubberVisible = viewState.isScrubberVisible() && !viewState.showCreationToolbar
                androidx.compose.animation.AnimatedVisibility(
                    visible = viewState.isScrubberVisible() && !(isOverlayMode && viewState.showSideBar),
                    enter = slideInVertically(tween(220)) { it } + fadeIn(tween(160)),
                    exit = slideOutVertically(tween(180)) { it } + fadeOut(tween(140)),
                    modifier = Modifier.align(Alignment.BottomCenter),
                ) {
                    org.zotero.android.screens.reader.toolbar.ReaderPdfBottomDock(viewModel, viewState, scrubberViewModel)
                }
                if (isScrubberVisible) {
                    ReaderPageHistoryBackArrow(
                        visible = viewState.canNavigateBack,
                        onClick = { viewModel.navigatePageHistoryBack() },
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .windowInsetsPadding(NavigationBarDefaults.windowInsets)
                            .padding(start = 16.dp, bottom = ScrubberBottomClearance),
                    )
                    ReaderPageHistoryForwardArrow(
                        visible = viewState.canNavigateForward,
                        onClick = { viewModel.navigatePageHistoryForward() },
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .windowInsetsPadding(NavigationBarDefaults.windowInsets)
                            .padding(end = 16.dp, bottom = ScrubberBottomClearance),
                    )
                }
            }
        }


    }
}

private val ScrubberBottomClearance = 80.dp

@Composable
private fun ReaderPageHistoryBackArrow(
    visible: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (org.zotero.android.ereader.DeviceProfileStore.state.value.eReader) {
        if (visible) Box(modifier) { ReaderPageHistoryArrowButton(isForward = false, onClick = onClick) }
    } else {
    AnimatedVisibility(visible = visible, modifier = modifier) {
        ReaderPageHistoryArrowButton(isForward = false, onClick = onClick)
    }
    }
}

@Composable
private fun ReaderPageHistoryForwardArrow(
    visible: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (org.zotero.android.ereader.DeviceProfileStore.state.value.eReader) {
        if (visible) Box(modifier) { ReaderPageHistoryArrowButton(isForward = true, onClick = onClick) }
    } else {
    AnimatedVisibility(visible = visible, modifier = modifier) {
        ReaderPageHistoryArrowButton(isForward = true, onClick = onClick)
    }
    }
}

enum class DragAnchors(val fraction: Float) {
    Start(0f),
    End(1f),
}

