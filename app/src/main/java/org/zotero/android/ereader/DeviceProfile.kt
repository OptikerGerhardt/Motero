package org.zotero.android.ereader

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.TweenSpec

/** Device preferences never enter Zotero/attachment state or synced annotations. */
data class DeviceProfile(
    val eReader: Boolean = false,
    val protectReaderEdges: Boolean = false,
    val penOnly: Boolean = true,
    val eraserButtonMode: String = "hold",
    val buttonMask: Int = 2,
    val eraserSize: Float = 12f,
    val eraserMode: String = "stroke",
)

object DeviceProfileStore {
    private var preferences: SharedPreferences? = null
    private val mutable = MutableStateFlow(DeviceProfile())
    val state = mutable.asStateFlow()
    fun initialize(context: Context) {
        if (preferences != null) return
        val prefs = context.applicationContext.getSharedPreferences("motero_device_profile", Context.MODE_PRIVATE)
        preferences = prefs
        mutable.value = DeviceProfile(
            eReader = prefs.getBoolean("eReader", false),
            protectReaderEdges = prefs.getBoolean("protectReaderEdges", false),
            penOnly = prefs.getBoolean("penOnly", true),
            eraserButtonMode = if (prefs.getString("eraserButtonMode", "hold") == "toggle") "toggle" else "hold",
            buttonMask = if (prefs.getInt("buttonMask", 2) == 4) 4 else 2,
        )
    }
    fun update(value: DeviceProfile) {
        mutable.value = value
        preferences?.edit()?.putBoolean("protectReaderEdges", value.protectReaderEdges)?.putBoolean("eReader", value.eReader)?.putBoolean("penOnly", value.penOnly)
            ?.putString("eraserButtonMode", value.eraserButtonMode)?.putInt("buttonMask", value.buttonMask)?.apply()
    }
    fun assignedKey(descriptor: String): Int? = preferences?.getInt("penKey:$descriptor", -1)?.takeIf { it >= 0 }
    fun assignKey(descriptor: String, keyCode: Int) { preferences?.edit()?.putInt("penKey:$descriptor", keyCode)?.apply() }
}

/** Preserve the ordinary animation exactly when the opt-in profile is off. */
fun <T> deviceTween(durationMillis: Int = 300, delayMillis: Int = 0, easing: Easing = FastOutSlowInEasing): TweenSpec<T> =
    androidx.compose.animation.core.tween(
        if (DeviceProfileStore.state.value.eReader) 0 else durationMillis,
        if (DeviceProfileStore.state.value.eReader) 0 else delayMillis, easing)
