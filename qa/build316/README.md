# Motero 1.0.1 / Build 316 verification

Reader commit: `ffa59d7e414d8a1be46f5b17605189a39be8cb78`.

Local checks: 314 reader unit tests, 125 Android tests in 30 suites, 13 browser suites and 11 release-infrastructure tests passed. The final focused browser checks also exercise hardware-button page changes with the shared centering correction.

The geometric regression fails against the actual Build 315 reader bundle (page center 401.5 CSS pixels too high) and passes with this build in vertical, horizontal and wrapped layouts. Real touch swipes, both edge taps, overview return, mode switch, hardware buttons and uncropped first/last pages are covered. Browser checks jump to each of the six annotation types while keeping selection and reader chrome closed. Native tests verify that a menu on an unselected card targets that card rather than a different selected annotation, and that every annotation type can jump while closing sidebar/editor chrome.

The isolated native-header input harness compiled the exact production header over an AndroidView. Its check is blocked: the software emulator returned black frames and launch timeouts, with no positive-control button events in either layout. `header-input.json` records the source hash and observed counts. No native input/visual or physical-device pass is claimed here.

The [protected workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/42690410151) passed all build/test gates, production signing, source/runtime/receiver verification and API 31/35 updates from Builds 303 and 315. Both preserve private test data and UID, start the updated app and refuse old-key updates/internal permission access.

[Motero 1.0.1](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.1-316) was downloaded independently. APK SHA-256: `04e8f145a60bf95739b65297dd11c8b5d11c314f703553fa034040f31c2b7d43`. Signing policy, checksums, all 99 reader sources, 207 PDF.js files and 45 runtime files match; the public test archive confirms 314 reader tests, 125 native tests and 13 browser suites. The latest-release API returns this single APK. No independent anonymous API claim is made because the managed proxy may supply credentials.

Source commit: `da33b516d603a72b05ea692a6198bcfadccf61c3`. Reports here describe the actual published APK. Native BOOX/Pixel appearance/animations and live account synchronization remain separate from these checks.
