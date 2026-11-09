# Build 314 — verified release

- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-314
- Workflow: https://github.com/OptikerGerhardt/Motero/actions/runs/42596631255
- Release source: `7eac431651ab4c4e621a2072396cac48f3555645`; Reader: `60d20ed573f73cf14efc18a7dbb7fab9157612d1`.
- Downloaded APK SHA-256: `c57939a0d8099eb85bb4e976de82784acb854b8f1df811660f6088a448bd5cf6`.

312 Reader tests, 122 native tests and all 12 browser suites passed both locally and in the release workflow. The local Android release build also succeeded. Two regressions first failed against Build 313 behavior: themed dark paper was passed into the theme blender again, and complete erasure bypassed the local annotation manager.

Browser checks now measure dark-thumbnail pixel contrast, cover full erase → Undo → erase again → immediate new ink without an Android persistence echo, verify the Desktop-style selected color tile, and retain existing navigation, manual-crop and theme checks. Unit checks exercise five-second reading-edge expiry, replacement/cancellation of that timer, and manual geometry after an automatic paper-reference choice. All 13 collected requirements are recorded in FEATUREPLAN.md and CHANGELOG.md.

The independently downloaded public APK matches the pinned production signing identity/rotation policy, package and version, non-debuggable manifest, minimum Android requirement, receiver permission, published checksums, 98 embedded Reader sources, 207 pinned PDF.js files and 45 runtime files. Actual API 31/35 updates from original Build 303 and current Build 313 preserve private test markers and application UID, start the updated app and reject the old key. Both reports match the exact downloaded APK hash. Anonymous latest-release access exposes the APK for Obtainium.

Native visual checks used a separately compiled fixture with 15 actual production presentation/theme sources and synthetic data. The software emulator's graphics output remained black despite a focused activity and awake display, with invalid-color-buffer diagnostics; these visual checks are **not** claimed as passed. See `native-ui-check.json`. The fixture is outside the production APK. Physical BOOX/GrapheneOS rendering, animation and live-account sync checks remain separate.
