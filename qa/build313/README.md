# Build 313 validation

308 Reader tests, 122 native tests and all 12 browser suites passed locally. Targeted browser checks additionally verify Manual Apply reports manual mode and a real pen stroke can be erased through the Android bridge and restored through Undo. Native regressions cover reopening Crop settings, explicit fit-reference choices and normal-page thumbnail requests.

The release workflow must sign the candidate and pass API 31/35 updates from original Build 303 and current Build 312 before publication. Physical GrapheneOS/BOOX tests and live-account synchronization remain separate. The isolated UI harness uses copied production dock/scrubber Composables and synthetic preview images; it is not part of the APK.
