package org.zotero.android.screens.reader.scrubber

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfDocument
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.click
import androidx.compose.ui.unit.Density
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import kotlinx.collections.immutable.toPersistentList
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * Measures the production ReaderPageScrubberContent, not a synthetic Row.
 * Uses fixed pixel viewport sizes at fractional Compose densities to expose
 * gaps caused by converting measured slot widths back into Dp.
 *
 * Physical BOOX behavior requires separate device evidence.
 */
@RunWith(AndroidJUnit4::class)
class ReaderPageScrubberInstrumentedTest {
    @get:Rule val compose = createComposeRule()

    private class Harness(
        val setViewport: (Float, Int) -> Unit,
        val taps: MutableList<Int>,
        val scrubPages: MutableList<Int>,
        val scrubStarts: MutableList<Unit>,
        val scrubEnds: MutableList<Unit>,
    )

    private fun mount(
        pageCount: Int,
        initialDensity: Float = 1f,
        initialWidthPx: Int = 319,
        pages: List<Bitmap>? = null,
    ): Harness {
        // Non-null pixels keep the real thumbnail/image path active and avoid spinners.
        val bitmap = Bitmap.createBitmap(4, 6, Bitmap.Config.ARGB_8888)
        val thumbnails = List<Bitmap?>(pageCount) { index -> pages?.get(index) ?: bitmap }.toPersistentList()
        val taps = mutableListOf<Int>()
        val scrubPages = mutableListOf<Int>()
        val scrubStarts = mutableListOf<Unit>()
        val scrubEnds = mutableListOf<Unit>()
        var density by mutableFloatStateOf(initialDensity)
        var viewportWidth by mutableIntStateOf(initialWidthPx)

        compose.setContent {
            // Width is interpreted inside the overridden LocalDensity subtree.
            // Convert the requested physical pixels using that same density.
            CompositionLocalProvider(LocalDensity provides Density(density)) {
                MaterialTheme {
                    ReaderPageScrubberContent(
                        viewState = ReaderScrubberViewState(thumbnailCache = thumbnails),
                        modifier = Modifier.width(with(Density(density)) { viewportWidth.toDp() }),
                        onLandmarksComputed = { },
                        onScrubStart = { scrubStarts.add(Unit) },
                        onScrubTo = { scrubPages.add(it) },
                        onScrubEnd = { scrubEnds.add(Unit) },
                        onTapAt = { taps.add(it) },
                    )
                }
            }
        }
        compose.waitForIdle()

        return Harness(
            setViewport = { nextDensity, nextWidth ->
                compose.runOnIdle {
                    density = nextDensity
                    viewportWidth = nextWidth
                }
                compose.waitForIdle()
            },
            taps = taps,
            scrubPages = scrubPages,
            scrubStarts = scrubStarts,
            scrubEnds = scrubEnds,
        )
    }

    private fun bounds(tag: String): Rect =
        compose.onNodeWithTag(tag, useUnmergedTree = true).fetchSemanticsNode().layoutInfo.coordinates.boundsInRoot()

    @Test
    fun actualThumbnailRowFillsMeasuredWidthAtFractionalDensityAndAfterResize() {
        val harness = mount(pageCount = 100)
        for (density in listOf(1f, 1.25f, 2.625f)) {
            for (widthPx in listOf(319, 501, 319)) {
                harness.setViewport(density, widthPx)
                val budget = (widthPx - 16f * density).roundToInt()
                val widths = computeScrubberSlotWidths(budget, 100, density)
                val row = bounds("reader-scrubber-row")
                assertTrue("Row width at density=$density viewport=$widthPx: ${row.width} != $budget",
                    abs(row.width - budget) <= 1f)
                val cells = widths.indices.map { bounds("reader-scrubber-cell-$it") }
                assertTrue("Must have multiple real thumbnails", cells.size >= 2)
                assertTrue("Left edge must align with actual row", abs(cells.first().left - row.left) <= 1f)
                assertTrue("Rightmost thumbnail must meet row edge: density=$density viewport=$widthPx budget=$budget row=$row last=${cells.last()} slotWidths=$widths measuredCells=$cells measuredWidths=${cells.map { it.width }} measuredGaps=${cells.zipWithNext().map { (a, b) -> b.left - a.right }} track=${bounds("reader-scrubber-track")}",
                    abs(cells.last().right - row.right) <= 1f)
                cells.zipWithNext().forEach { (a, b) ->
                    assertTrue("Thumbnail hitboxes must not overlap", b.left >= a.right)
                }
            }
        }
    }

    @Test
    fun diagnosticMeasuredSlotsAndGapsConserveTrackWidthForTwoAndManyPages() {
        diagnosticForPageCount(2)
    }

    @Test
    fun diagnosticManyPageSlotsConserveTrackWidth() {
        diagnosticForPageCount(100)
    }

    private fun diagnosticForPageCount(pageCount: Int) {
            val harness = mount(pageCount = pageCount)
            for (density in listOf(1.25f, 2.625f)) {
                for (viewport in listOf(319, 501, 319)) {
                    harness.setViewport(density, viewport)
                    val row = bounds("reader-scrubber-row")
                    val track = bounds("reader-scrubber-track")
                    val budget = row.width.roundToInt()
                    val expected = computeScrubberSlotWidths(budget, pageCount, density)
                    val cells = expected.indices.map { bounds("reader-scrubber-cell-$it") }
                    val measuredWidths = cells.map { it.width.roundToInt() }
                    val measuredGaps = cells.zipWithNext().map { (a, b) ->
                        (b.left - a.right).roundToInt()
                    }
                    val occupied = measuredWidths.sum() + measuredGaps.sum()
                    val diagnostic = "pages=$pageCount density=$density viewport=$viewport " +
                        "row=$row track=$track expected=$expected " +
                        "measuredWidths=$measuredWidths measuredGaps=$measuredGaps " +
                        "occupied=$occupied budget=$budget"
                    android.util.Log.i("ScrubberLayoutGate", diagnostic)
                    assertEquals("Slot count: $diagnostic", expected.size, cells.size)
                    assertTrue("First slot offset: $diagnostic",
                        abs(cells.first().left - row.left) <= 1f)
                    assertTrue("Measured widths diverge from slot constraints: $diagnostic",
                        expected.zip(measuredWidths).all { (a, b) -> abs(a - b) <= 1 })
                    assertTrue("Measured slot+gap sum diverges from parent: $diagnostic",
                        abs(occupied - budget) <= 1)
                    assertTrue("Right edge diverges from parent: $diagnostic",
                        abs(cells.last().right - row.right) <= 1f)
                }
            }
    }

    @Test
    fun actualTouchTrackMapsLeftRightTapsAndLongPressDragToPages() {
        val harness = mount(pageCount = 100, initialDensity = 1.25f, initialWidthPx = 319)
        val track = compose.onNodeWithTag("reader-scrubber-track", useUnmergedTree = true)
        track.performTouchInput {
            click(percentOffset(0.1f, 0.5f))
            click(percentOffset(0.9f, 0.5f))
        }
        compose.runOnIdle {
            assertEquals(2, harness.taps.size)
            assertTrue("Left tap maps near page ten", harness.taps[0] in 8..12)
            assertTrue("Right tap maps near page ninety", harness.taps[1] in 87..92)
        }

        track.performTouchInput {
            down(percentOffset(0.1f, 0.5f))
            advanceEventTime(500)
            moveTo(percentOffset(0.85f, 0.5f))
            up()
        }
        compose.runOnIdle {
            assertTrue("Long press should begin scrub", harness.scrubStarts.isNotEmpty())
            assertTrue("Drag should navigate toward the right edge",
                harness.scrubPages.any { it in 75..99 })
            assertTrue("Gesture end should complete scrub", harness.scrubEnds.isNotEmpty())
        }
    }

    @Test
    fun onePageUsesFullRowWithoutInvalidNavigation() {
        val harness = mount(pageCount = 1, initialDensity = 2.625f, initialWidthPx = 319)
        val expected = (319f - 16f * 2.625f).roundToInt()
        val row = bounds("reader-scrubber-row")
        val cell = bounds("reader-scrubber-cell-0")
        assertTrue(abs(row.width - expected) <= 1f)
        assertTrue(abs(cell.right - row.right) <= 1f)

        compose.onNodeWithTag("reader-scrubber-track", useUnmergedTree = true)
            .performTouchInput { click(percentOffset(0.95f, 0.5f)) }
        compose.runOnIdle { assertEquals(listOf(0), harness.taps) }
    }
    @Test
    fun twoPageLayoutKeepsBothRealHitboxesFlushAcrossResizeAndFractionalDensity() {
        val harness = mount(pageCount = 2)
        for (density in listOf(1.25f, 2.625f)) {
            for (widthPx in listOf(319, 501, 319)) {
                harness.setViewport(density, widthPx)
                val row = bounds("reader-scrubber-row")
                val first = bounds("reader-scrubber-cell-0")
                val last = bounds("reader-scrubber-cell-1")
                assertTrue("Two-page left edge: density=$density width=$widthPx first=$first row=$row",
                    abs(first.left - row.left) <= 1f)
                assertTrue("Two-page right edge: density=$density width=$widthPx last=$last row=$row",
                    abs(last.right - row.right) <= 1f)
                assertTrue("Two-page hitboxes overlap: first=$first last=$last",
                    first.right <= last.left)
            }
        }
        compose.onNodeWithTag("reader-scrubber-track", useUnmergedTree = true)
            .performTouchInput {
                click(percentOffset(0.05f, 0.5f))
                click(percentOffset(0.95f, 0.5f))
            }
        compose.runOnIdle { assertEquals(listOf(0, 1), harness.taps) }
    }

    @Test
    @OptIn(ExperimentalTestApi::class)
    fun renderedPdfThumbnailsFillTheirExpectedWidthAndKeepOnlyAspectRatioGutters() {
        val colors = listOf(Color.RED, Color.GREEN, Color.BLUE)
        val pages = renderPdfThumbnails(colors, listOf(64 to 128, 64 to 64, 128 to 64))
        val harness = mount(pageCount = pages.size, pages = pages)
        for (density in listOf(1.2f, 1.25f, 1.3f, 2.625f)) {
            for (viewportWidth in listOf(319, 501)) {
                harness.setViewport(density, viewportWidth)
                val row = compose.onNodeWithTag("reader-scrubber-row", useUnmergedTree = true)
                val pixels = row.captureToImage().toPixelMap()
                val rowBounds = bounds("reader-scrubber-row")
                // At 319 px and density 2.625, the 277 px content budget fits
                // only two preferred-width landmarks (first and last page).
                // At the other tested sizes, all three pages must be visible.
                // Specify the expected landmarks independently of the production helper
                // so the test still catches incorrect landmark selection or missing images.
                val expectedPageIndices = if (density == 2.625f && viewportWidth == 319) {
                    listOf(0, 2)
                } else {
                    listOf(0, 1, 2)
                }
                val cells = expectedPageIndices.indices.map { bounds("reader-scrubber-cell-$it") }
                compose.onNodeWithTag("reader-scrubber-cell-${expectedPageIndices.size}", useUnmergedTree = true)
                    .assertDoesNotExist()
                assertEquals(viewportWidth - 2 * (8 * density).roundToInt(), pixels.width)
                assertEquals(rowBounds.left, cells.first().left, 0.01f)
                assertEquals(rowBounds.right, cells.last().right, 0.01f)
                if (expectedPageIndices.size == 2) {
                    assertTrue("The sampled-out middle page must not be drawn",
                        (0 until pixels.width).none { x -> pixels[x, pixels.height / 2].toArgb() == colors[1] })
                }

                expectedPageIndices.forEachIndexed { slot, index ->
                    val bitmap = pages[index]
                    val cell = cells[slot]
                    val centerLine = (0 until pixels.width).filter { x ->
                        pixels[x, pixels.height / 2].toArgb() == colors[index]
                    }
                    val expected = minOf(cell.width, cell.height * bitmap.width / bitmap.height)
                    val diagnostic = "page=$index slot=$slot density=$density width=$viewportWidth"
                    assertTrue("PDF preview is missing: $diagnostic", centerLine.isNotEmpty())
                    assertEquals(diagnostic, expected, centerLine.size.toFloat(), 2f)
                    val drawnCenter = (centerLine.first() + centerLine.last() + 1) / 2f
                    assertEquals(diagnostic, cell.center.x - rowBounds.left, drawnCenter, 1f)
                }
            }
        }
    }

    private fun renderPdfThumbnails(colors: List<Int>, sizes: List<Pair<Int, Int>>): List<Bitmap> {
        val cache = InstrumentationRegistry.getInstrumentation().targetContext.cacheDir
        val file = File.createTempFile("scrubber-preview", ".pdf", cache)
        try {
            val document = PdfDocument()
            try {
                sizes.forEachIndexed { index, (width, height) ->
                    val page = document.startPage(PdfDocument.PageInfo.Builder(width, height, index + 1).create())
                    page.canvas.drawColor(colors[index])
                    document.finishPage(page)
                }
                file.outputStream().use(document::writeTo)
            } finally {
                document.close()
            }
            val descriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
            return PdfRenderer(descriptor).use { renderer ->
                sizes.indices.map { index ->
                    renderer.openPage(index).use { page ->
                        Bitmap.createBitmap(page.width, page.height, Bitmap.Config.ARGB_8888).also { bitmap ->
                            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                        }
                    }
                }
            }
        } finally {
            file.delete()
        }
    }

    @Test
    fun zeroPageTrackDoesNotDispatchNavigationOrScrub() {
        val harness = mount(pageCount = 0)
        compose.onNodeWithTag("reader-scrubber-track", useUnmergedTree = true)
            .performTouchInput {
                click(percentOffset(0.5f, 0.5f))
                down(percentOffset(0.1f, 0.5f))
                advanceEventTime(500)
                moveTo(percentOffset(0.9f, 0.5f))
                up()
            }
        compose.runOnIdle {
            assertTrue(harness.taps.isEmpty())
            assertTrue(harness.scrubStarts.isEmpty())
            assertTrue(harness.scrubPages.isEmpty())
            assertTrue(harness.scrubEnds.isEmpty())
        }
    }

}
