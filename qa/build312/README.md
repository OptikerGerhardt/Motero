# Build 312 — verified release

- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-312
- Workflow: https://github.com/OptikerGerhardt/Motero/actions/runs/42507380160
- Release source: `aa3ddb6756f0f47f4753cdcce27f9a3013aa8d66`; reader: `2d0fc4a9b428affb2125442a27388f3c99468a81`.
- Downloaded APK SHA-256: `7d8a35ad4d5681519e634fba0c2ebe544f59bee761ced7b7fc8b5ac543fe7401`.

305 reader tests, 119 native tests and all 12 browser suites passed. The recovery regression first failed with Build 311's thumbnail manager and passed after preserving requested landmark indices across renderer instances. The local release build also completed successfully.

The published APK was independently downloaded and checked against the pinned private Motero signer and V3 rotation policy, the release checksums, 98 embedded reader sources, 207 pinned PDF.js files and 45 runtime files. Package/version, minimum Android requirement, non-debuggable manifest and the receiver-permission namespace were verified.

Actual Android API 31 and 35 updates retain private test data and application UID from original Build 303 and the verified current Build 311. App startup and rejection of old-key updates/permission access passed. Both migration reports refer to the downloaded APK's exact hash. Anonymous latest-release access exposes this APK for Obtainium.

See `github-apk-verification.json`, `github-publication.json`, both `github-migration-api*.json` reports and `native-tests.json`. Physical GrapheneOS/BOOX tests and live-account synchronization remain separate. Direct forum access was blocked; the research document distinguishes GitHub evidence from unread forum references. No BOOX SDK or variable-pressure annotation format was shipped.
