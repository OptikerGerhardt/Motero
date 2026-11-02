package org.zotero.android.screens.reader

import android.graphics.Color as AndroidColor
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.graphics.toArgb
import android.graphics.PointF
import android.graphics.RectF
import com.google.gson.JsonParser
import org.junit.Assert.*
import org.junit.Test
import org.mockito.Mockito
import org.zotero.android.database.objects.AnnotationType
import org.zotero.android.database.objects.AnnotationsConfig
import org.zotero.android.sync.AnnotationBlendMode
import org.zotero.android.sync.AnnotationColorGenerator
import org.zotero.android.sync.AnnotationConverterV2
import org.zotero.android.sync.AnnotationSortIndex
import java.util.Locale

class PdfEngineIndependenceTest {
    @Test fun `existing sort indexes stay ASCII and sortable under Arabic locale`() {
        val previous = Locale.getDefault()
        try {
            Locale.setDefault(Locale.forLanguageTag("ar-EG"))
            assertEquals("00007|000032|00120", AnnotationSortIndex.format(7, 32, 120))
            assertEquals("00007|000032|00000", AnnotationSortIndex.format(7, 32, -20))
            assertTrue(AnnotationSortIndex.format(9, 100, 500) < AnnotationSortIndex.format(10, 0, 0))
        } finally { Locale.setDefault(previous) }
    }

    @Test fun `all six persisted annotation names remain available without vendor classes`() {
        assertEquals(listOf("note", "highlight", "image", "ink", "underline", "text"), AnnotationType.entries.map { it.name })
        withPlatformColors {
            assertEquals(AnnotationType.entries.toSet(), AnnotationsConfig.supportedV2.toSet())
            assertEquals(listOf("#ffd400", "#ff6666", "#5fb236", "#2ea8e5", "#a28ae5", "#e56eee", "#f19837", "#aaaaaa", "#000000"), AnnotationsConfig.allColors)
        }
    }

    @Test fun `PDFjs annotations preserve identity content dates and raw geometry for every tool`() = withPlatformColors {
        Mockito.mockConstruction(RectF::class.java) { rect, context ->
            val a = context.arguments()
            if (a.size == 4) {
                rect.left = (a[0] as Number).toFloat(); rect.top = (a[1] as Number).toFloat()
                rect.right = (a[2] as Number).toFloat(); rect.bottom = (a[3] as Number).toFloat()
            }
        }.use {
            Mockito.mockConstruction(PointF::class.java) { point, context ->
                val a = context.arguments()
                if (a.size == 2) { point.x = (a[0] as Number).toFloat(); point.y = (a[1] as Number).toFloat() }
            }.use {
                for (type in AnnotationType.entries) {
                    val json = JsonParser.parseString("""{
                        "id":"ABCDEF12","type":"${type.name}","pageLabel":"iii","text":"Alpha beta",
                        "comment":"  Retained comment  ","color":"#e56eee","sortIndex":"00007|000032|00120",
                        "dateCreated":"2026-10-31T10:30:00.000Z","dateModified":"2026-10-31T11:30:00.000Z",
                        "position":{"pageIndex":7,"rects":[[10.5,20.5,30.5,40.5]],
                        "paths":[[10.5,20.5,30.5,40.5]],"width":2.5,"fontSize":12,"rotation":90}
                    }""").asJsonObject
                    val result = requireNotNull(AnnotationConverterV2.annotation(json, "Author", true))
                    assertEquals("ABCDEF12", result.key); assertEquals(type, result.type)
                    assertEquals(7, result.page); assertEquals("iii", result.pageLabel)
                    assertEquals("Retained comment", result.comment); assertEquals("#e56eee", result.color)
                    assertEquals("00007|000032|00120", result.sortIndex)
                    assertEquals(3600000L, result.dateModified.time - result.dateAdded.time)
                    assertEquals("Author", result.author("Other", "other")); assertTrue(result.isAuthor(42))
                    if (type == AnnotationType.ink) {
                        assertEquals(2.5f, result.lineWidth)
                        assertEquals(listOf(10.5f,20.5f,30.5f,40.5f), result.paths.single().flatMap { p -> listOf(p.x,p.y) })
                    } else {
                        assertEquals(listOf(10.5f,20.5f,30.5f,40.5f), result.rects.single().let { r -> listOf(r.left,r.top,r.right,r.bottom) })
                    }
                    if (type in listOf(AnnotationType.highlight, AnnotationType.underline)) assertEquals("Alpha beta", result.text)
                    if (type == AnnotationType.text) { assertEquals(12f,result.fontSize);assertEquals(90,result.rotation) }
                }
            }
        }
    }

    @Test fun `color alpha and light dark compositing retain their original values`() = withPlatformColors {
        val highlight = AnnotationColorGenerator.color("#ffd400", AnnotationType.highlight, false)
        assertEquals(0x80ffd400.toInt(),highlight.first); assertEquals(.5f,highlight.second)
        assertEquals(AnnotationBlendMode.MULTIPLY,highlight.third)
        val dark = AnnotationColorGenerator.color("#ffd400", AnnotationType.highlight, true)
        assertEquals(0x7fffd400,dark.first); assertEquals(AnnotationBlendMode.LIGHTEN,dark.third)
        assertEquals(0xffffd400.toInt(),AnnotationColorGenerator.color("#ffd400",AnnotationType.underline,false).first)
        assertNull(AnnotationColorGenerator.blendMode(false,AnnotationType.note))
    }

    // JVM tests have android.jar stubs. Substitute only the platform color/math
    // calls, leaving the application converter and color implementation real.
    private fun withPlatformColors(block: () -> Unit) {
        Mockito.mockStatic(AndroidColor::class.java).use { color ->
            color.`when`<Int> { AndroidColor.parseColor(Mockito.anyString()) }.thenAnswer { call ->
                val raw = call.getArgument<String>(0).removePrefix("#")
                (if (raw.length == 6) 0xff000000L or raw.toLong(16) else raw.toLong(16)).toInt()
            }
            color.`when`<Any?> { AndroidColor.colorToHSV(Mockito.anyInt(),Mockito.any(FloatArray::class.java)) }.thenAnswer { call ->
                val rgb = call.getArgument<Int>(0);val target = call.getArgument<FloatArray>(1)
                val r = (rgb ushr 16 and 255) / 255f
                val g = (rgb ushr 8 and 255) / 255f
                val b = (rgb and 255) / 255f
                val max = maxOf(r,g,b); val min = minOf(r,g,b); val delta = max-min
                val sector = when {
                    delta == 0f -> 0f
                    max == r -> (g-b)/delta
                    max == g -> (b-r)/delta+2f
                    else -> (r-g)/delta+4f
                }
                target[0] = ((sector*60f)%360f+360f)%360f
                target[1] = if (max == 0f) 0f else delta/max
                target[2] = max
                null
            }
            color.`when`<Int> { AndroidColor.HSVToColor(Mockito.anyInt(),Mockito.any(FloatArray::class.java)) }.thenAnswer { call ->
                val hsv = call.getArgument<FloatArray>(1)
                ComposeColor.hsv(hsv[0],hsv[1],hsv[2],call.getArgument<Int>(0)/255f).toArgb()
            }
            block()
        }
    }
}
