import org.jetbrains.kotlin.gradle.tasks.KotlinJvmCompile

plugins {
    id("com.android.application")
    kotlin("android")
    kotlin("kapt")
    kotlin("plugin.serialization")
    id("com.google.devtools.ksp")
    id("realm-android")
    id("kotlin-parcelize")
    id("com.google.gms.google-services") apply false
    id("com.google.firebase.crashlytics") apply false

    //----Dependency plugins start----
    id("kotlinDependencies")
    id("androidXDependencies")
    id("composeDependencies")
    id("daggerAndHiltDependencies")
    id("networkDependencies")
    id("testDependencies")
    //----Dependency plugins end----

    id("com.google.dagger.hilt.android")
    kotlin("plugin.compose")
}

val moteroPublicRelease = providers.gradleProperty("moteroPublicRelease").orNull == "true"
val moteroBetaBuild = providers.gradleProperty("moteroBetaBuild").orNull?.toInt()
require(!moteroPublicRelease || moteroBetaBuild == null) { "Choose either stable or beta release." }
require(moteroBetaBuild == null || moteroBetaBuild > 0) { "Beta build number must be positive." }
val externalSigning = moteroPublicRelease || moteroBetaBuild != null
if (moteroBetaBuild == null) {
    apply(plugin = "com.google.gms.google-services")
    apply(plugin = "com.google.firebase.crashlytics")
}

android {
    compileSdk = BuildConfig.compileSdkVersion
    namespace = "org.zotero.android"

    defaultConfig {
        applicationId = BuildConfig.appId
        minSdk = if (externalSigning) 28 else BuildConfig.minSdkVersion
        targetSdk = BuildConfig.targetSdk
        versionCode = BuildConfig.versionCode
        versionName = BuildConfig.version.name
        testInstrumentationRunner = Libs.androidJUnitRunner

        buildConfigField("String", "BASE_API_URL", "\"https://api.zotero.org\"")
        buildConfigField("boolean", "EVENT_AND_CRASH_LOGGING_ENABLED", "false")
        manifestPlaceholders["enableCrashReporting"] = false

        //Making build version components to be accessible from within the app.
        buildConfigField("int", "BUILD_VERSION_MAJOR", "${BuildConfig.version.major}")
        buildConfigField("int", "BUILD_VERSION_MINOR", "${BuildConfig.version.minor}")
        buildConfigField("int", "BUILD_VERSION_PATCH", "${BuildConfig.version.patch}")

        ndk {
            abiFilters += listOf("armeabi-v7a", "arm64-v8a", "x86", "x86_64")
        }
    }
    signingConfigs {
        create("release") {
            storeFile = rootProject.file("zotero.release.keystore")

            if (rootProject.file("keystore-secrets.txt").exists()) {
                val secrets: List<String> = rootProject
                    .file("keystore-secrets.txt")
                    .readLines()
                keyAlias = secrets[0]
                storePassword = secrets[1]
                keyPassword = secrets[2]
            }
        }
    }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
    androidResources {
        noCompress += listOf("ttf", "mov", "avi", "json", "html", "csv", "obb")
    }

    buildTypes {
        getByName("debug") {
            isDebuggable = true
            isMinifyEnabled = false
            signingConfigs
                .findByName("debug")
                ?.storeFile = rootProject.file("debug.keystore")

            buildConfigField("boolean", "EVENT_AND_CRASH_LOGGING_ENABLED", "false")
            manifestPlaceholders["enableCrashReporting"] = false
            extra.set("enableCrashlytics", false)

            //Prevent variables from being 'optimized out' during debug,
            //so it becomes possible to see their values in debugger
            tasks.withType<KotlinJvmCompile>().configureEach {
                compilerOptions {
                    freeCompilerArgs.addAll(listOf("-Xdebug"))
                }
            }

        }
        getByName("release") {
            isDebuggable = false
            isMinifyEnabled = false
            // The public APK is signed separately with the protected Motero key.
            // Never fall back to the public upstream test key when that key is absent.
            signingConfig = if (externalSigning) null else signingConfigs.getAt("release")
            buildConfigField("boolean", "EVENT_AND_CRASH_LOGGING_ENABLED", if (externalSigning) "false" else "true")
            manifestPlaceholders["enableCrashReporting"] = !externalSigning
            if (externalSigning) extra.set("enableCrashlytics", false)
        }
    }
    setDefaultProductFlavors()
    productFlavors {
        dev {
            if (moteroBetaBuild == null) {
                resValue("string", "app_name", """"Motero""")
                applicationIdSuffix = ".debug"
            } else {
                resValue("string", "app_name", "Motero Beta")
                applicationIdSuffix = ".beta"
                versionCode = moteroBetaBuild
                versionName = with(BuildConfig.version) { "$major.$minor.$patch-beta.$moteroBetaBuild" }
            }
        }
        internal {
            resValue("string", "app_name", """"Zotero""")
        }
    }

    compileOptions {
        sourceCompatibility = javaVersion
        targetCompatibility = javaVersion
    }
    tasks.withType<KotlinJvmCompile>().configureEach {
        compilerOptions {
            jvmTarget.set(jvmTargetVersion)
        }
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }

    packaging {
        resources.pickFirsts.add("META-INF/kotlinx-coroutines-core.kotlin_module")
    }

    androidComponents {
        beforeVariants {
            if (externalSigning && it.name == "devRelease") {
                it.enable = true
                (it as com.android.build.api.variant.HasHostTestsBuilder)
                    .hostTests[com.android.build.api.variant.HostTestBuilder.UNIT_TEST_TYPE]?.enable = true
            }
            else if (moteroBetaBuild != null) it.enable = false
            else it.ignoreUnusedVariants()
        }
        onVariants { variant ->
            if (externalSigning && variant.name == "devRelease") {
                variant.instrumentation.transformClassesWith(
                    MoteroReceiverPermissionTransform::class.java,
                    com.android.build.api.instrumentation.InstrumentationScope.ALL
                ) {}
            }
        }
    }
}

dependencies {

    // Real-device Compose measurement / tap checks, isolated to instrumentation.
    androidTestImplementation(Libs.Compose.uiTestJunit4)
    debugImplementation(Libs.Compose.uiTestManifest)

    //Material design
    implementation(Libs.materialDesign)
    implementation(Libs.Compose.material)

    // Used directly by ReaderWebViewHandler, independent of the PDF engine.
    implementation(Libs.webkit)

    //Crash
    implementation(Libs.Firebase.Crashlytics.crashlytics)


    //GSON
    implementation(Libs.gson)

    //ExoPlayer
    implementation(Libs.ExoPlayer.exoPlayer)
    implementation(Libs.ExoPlayer.mediaUi)

    //Coil
    implementation(Libs.Coil.compose)

    //Commons
    implementation(Libs.Commons.text)

    //Other
    implementation(Libs.timber)
    implementation(Libs.jodaTime)
    implementation(Libs.eventBus)
    implementation(Libs.keyboardVisibility)
    implementation(Libs.codeScanner)

}

kapt {
    correctErrorTypes = true
}

hilt {
    enableAggregatingTask = false
}

tasks.withType<org.gradle.api.tasks.testing.Test>().configureEach {
    // Keep real thread names stable for BaseViewModel2's main-thread guard;
    // coroutine debug IDs would rename the same test thread per coroutine.
    systemProperty("kotlinx.coroutines.debug", "off")
}
