# Build 313 — verified release

- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-313
- Workflow: https://github.com/OptikerGerhardt/Motero/actions/runs/42542196761
- Release source: `9be88d7e3b1c76467db9e251a1c34a3928b04a4e`; reader: `d439d2c315dd142208ead007f698cd8af85a8e0d`.
- Downloaded APK SHA-256: `5ddf7311546822a91f8dfe97a3deae6ce9b82af514988a5a00669d06103719a0`.

308 Reader tests, 122 native tests and all 12 browser suites passed. Native regressions cover reopening the crop settings, selecting and persisting explicit fit references, and requesting the current preview after ordinary page turns. Browser checks verify Manual Apply reports manual mode and actual pen/stroke-erasing input preserves neighboring strokes and supports Undo.

The independently downloaded public APK matches the private Motero production signer and rotation policy, the published checksums, 98 embedded reader sources, 207 pinned PDF.js files and 45 runtime files. Package/version, non-debuggable manifest, minimum Android requirement and receiver-permission namespace passed verification. Anonymous latest-release access exposes only `Motero_Build313.apk` as an APK for Obtainium.

Actual Android API 31/35 updates from original Build 303 and current Build 312 retain private test markers and application UID; startup and old-key rejection checks passed. Both reports match the downloaded APK hash. See the four `github-*.json` reports and `native-tests.json`.

The isolated native UI harness rendered the initial shared preview surface. Full visual coverage of the palette, tool transition and alternate sizes was interrupted by a software-emulator System UI failure after display reconfiguration and a cloud-runtime restart; it is not claimed as passed. `native-dock-ui.json` records source hashes and this limitation. Physical GrapheneOS/BOOX and live-account sync tests remain separate. No test harness was added to the production APK.
