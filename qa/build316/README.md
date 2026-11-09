# Motero 1.0.1 / Build 316 verification

Reader commit: `ffa59d7e414d8a1be46f5b17605189a39be8cb78`.

Local checks: 314 reader unit tests, 125 Android tests in 30 suites, 13 browser suites and 11 release-infrastructure tests passed. The final focused browser checks also exercise hardware-button page changes with the shared centering correction.

The geometric regression fails against the actual Build 315 reader bundle (page center 401.5 CSS pixels too high) and passes with this build in vertical, horizontal and wrapped layouts. Real touch swipes, both edge taps, overview return, mode switch, hardware buttons and uncropped first/last pages are covered. Browser checks jump to each of the six annotation types while keeping selection and reader chrome closed. Native tests verify that a menu on an unselected card targets that card rather than a different selected annotation, and that every annotation type can jump while closing sidebar/editor chrome.

The isolated native-header input harness uses the production header over an AndroidView. Its result will be recorded separately; no native visual or physical-device pass is claimed here.

Before publication the protected workflow must sign with the unchanged private Motero identity, verify sources/runtime/receiver permission and complete API 31/35 data-preserving updates from Builds 303 and 315 with old-key refusal. Public APK and reports will be downloaded independently after publication. Native BOOX/Pixel appearance/animations and live account synchronization remain separate from these checks.
