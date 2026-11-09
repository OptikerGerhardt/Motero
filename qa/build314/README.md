# Build 314 validation

312 Reader tests, 122 native tests and all 12 browser suites passed locally; the Android release APK build succeeded. The two new regressions for dark-thumbnail background and local full-erasure deletion failed against Build 313 behavior and pass with the correction. Browser pixel checks require contrast in dark thumbnails and a real pen workflow checks full erase, Undo, erase again and immediate new ink without an Android persistence echo.

All 13 collected changes are recorded in FEATUREPLAN.md and CHANGELOG.md. Native presentation checks use a separate fixture project containing the production dock, header, appearance table, app theme and system-bar Composables with synthetic data. It is not part of the APK. Final visual results and independent published-APK/update evidence follow after the release gates. Physical BOOX/GrapheneOS and live-account sync tests remain separate.
