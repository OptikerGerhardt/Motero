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
}
