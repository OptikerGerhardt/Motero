package org.zotero.android.uicomponents.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost

@Composable
fun ZoteroNavHost(
    navController: NavHostController,
    startDestination: String,
    modifier: Modifier = Modifier,
    contentAlignment: Alignment = Alignment.Center,
    route: String? = null,
    enterTransition: (AnimatedContentTransitionScope<NavBackStackEntry>.() -> EnterTransition) =
        { slideInHorizontally(initialOffsetX = { it }) },
    exitTransition: (AnimatedContentTransitionScope<NavBackStackEntry>.() -> ExitTransition) =
        { slideOutHorizontally(targetOffsetX = { -it }) },
    popEnterTransition: (AnimatedContentTransitionScope<NavBackStackEntry>.() -> EnterTransition) =
        { slideInHorizontally(initialOffsetX = { -it }) },
    popExitTransition: (AnimatedContentTransitionScope<NavBackStackEntry>.() -> ExitTransition) =
        { slideOutHorizontally(targetOffsetX = { it }) },
    builder: NavGraphBuilder.() -> Unit
) {
    val profile by org.zotero.android.ereader.DeviceProfileStore.state.collectAsState()
    NavHost(
        builder = builder,
        contentAlignment = contentAlignment,
        enterTransition = if (profile.eReader) { { EnterTransition.None } } else enterTransition,
        exitTransition = if (profile.eReader) { { ExitTransition.None } } else exitTransition,
        modifier = modifier,
        navController = navController,
        popEnterTransition = if (profile.eReader) { { EnterTransition.None } } else popEnterTransition,
        popExitTransition = if (profile.eReader) { { ExitTransition.None } } else popExitTransition,
        route = route,
        startDestination = startDestination,
    )
}
