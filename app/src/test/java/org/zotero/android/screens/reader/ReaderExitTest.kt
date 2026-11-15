package org.zotero.android.screens.reader

import androidx.activity.OnBackPressedCallback
import androidx.activity.OnBackPressedDispatcher
import androidx.navigation.NavHostController
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Assert.assertEquals
import org.junit.Test
import org.zotero.android.architecture.navigation.ZoteroNavigation

class ReaderExitTest {
    @Test fun `explicit reader exit works while system Back is protected`() {
        val controller = mockk<NavHostController>()
        every { controller.popBackStack() } returns true
        val dispatcher = OnBackPressedDispatcher()
        var protectedBacks = 0
        dispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() { protectedBacks++ }
        })
        val navigation = ZoteroNavigation(controller, dispatcher)

        navigation.onBack()
        assertEquals(1, protectedBacks)
        verify(exactly = 0) { controller.popBackStack() }

        navigation.closeReader()
        assertEquals(1, protectedBacks)
        verify(exactly = 1) { controller.popBackStack() }

        navigation.onBack()
        assertEquals(2, protectedBacks)
        verify(exactly = 1) { controller.popBackStack() }
    }

    @Test fun `explicit reader exit does not require a system Back dispatcher`() {
        val controller = mockk<NavHostController>()
        every { controller.popBackStack() } returns true

        ZoteroNavigation(controller, null).closeReader()

        verify(exactly = 1) { controller.popBackStack() }
    }
    @Test fun `a new navigation controller can open a reader after the old graph is disposed`() {
        repeat(2) {
            val controller = mockk<NavHostController>(relaxed = true)
            every { controller.getBackStackEntry(any<String>()) } throws IllegalArgumentException("no reader entry")
            val entry = mockk<androidx.navigation.NavBackStackEntry>(relaxed = true)
            every { entry.destination.route } returns "readerScreen/{$ARG_READER_SCREEN}?uri={$ARG_READER_SCREEN_ENCODED_FILE_PATH_ARG}"
            every { controller.currentBackStackEntry } returns entry
            ZoteroNavigation(controller, null).toReaderScreen("document", "path")
            verify(exactly = 1) { controller.navigate(any<String>(), any(), any()) }
        }
    }

    @Test fun `an existing reader on this controller prevents duplicate sessions`() {
        val controller = mockk<NavHostController>(relaxed = true)
        every { controller.getBackStackEntry(any<String>()) } returns mockk(relaxed = true)
        ZoteroNavigation(controller, null).toReaderScreen("document", "path")
        verify(exactly = 0) { controller.navigate(any<String>(), any(), any()) }
    }

}
