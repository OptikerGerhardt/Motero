# Motero 1.0.10 / Build 325 verification

[Motero 1.0.10](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.10-325) is published. The [protected build and release workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/43272546142) passed.

Release application source: `20436e1cf3422007dc95aaa6af684da8c3ce754e`. Reader: `787471d42774efa7ab4c63b7ad4f6ca6b4cd59ff`. Subsequent documentation commits do not replace immutable tags or assets. PDF.js remains 5.7.330 / `5f95f712bc629ac11159cb4859ed8091fdffa87b`.

414 Reader cases in 49 files, 153 native cases in 36 suites, all 22 browser suites, 43 engine pixel cases and 19 official viewer cases pass. All 16 infrastructure/signing-refusal tests pass locally. The retained Reader JSON and per-file log provide actual case counts; the CI reporter records 414 passing entries.

The initial full browser run was followed by successful fitting/columns/navigation checks after changing the legacy blank-page expectation to the newly requested inherited physical frame. Final relevant logs are retained here; the protected workflow repeated all 22 suites on the release source.

Added coverage checks right-column alignment after refitting/recentering and reverse entry; switching Continuous column fitting off/on; real diagonal touches with orthogonal overflow in all scroll directions; two-finger zoom/overview return; six automatic/manual × content/width/height blank-frame combinations; actual theme pixels/gutters; larger PDF/EPUB endpoint targets with stable IDs and Undo; and progress/quick-palette/page-edge priority without EPUB reflow. Native tests cover appearance migration, remembered light/dark choices, usable margin endpoints and precise line height.

The downloaded APK SHA-256 is `bb9eb476319b86cd5ec1d0f37d283a139c86d7e081bdde355f3b8967bd9922c5`. Production certificate/rotation, receiver namespace, Android 9+ and non-debuggable manifest pass. 114 main-bundle and 117 unique Reader sources across worker maps match the release checkout. All 207 engine files, 45 runtime files, 9450 source-snapshot files and release checksums were independently checked.

API 31/35 emulator gates pass: original 303 and signed 324 update to 325 while retaining private test data and UID and starting the app. Old-key updates and internal permission access are rejected. Latest-release detection selects Build 325 with exactly one APK. Anonymous access was not independently established because the managed proxy may supply credentials.

Physical BOOX/Pixel input, native animation appearance, device-specific WebViews, the user's original documents and live-account synchronization remain separate checks. No physical-device latency or total-process-RAM measurement is claimed. The Kundera heading observation remains deferred for another EPUB comparison. [Scope and implementation](../../docs/READER_325.md).
