# Motero development and delivery

- Keep this repository private unless the user explicitly asks to change its visibility.
- The user wants work committed and pushed to GitHub, with an APK in a new GitHub Release for each new app build. Do not finish an app task with only local files when GitHub access works.
- The Android project is on `main`. Its reader submodule points to the `reader` branch of this same repository. Commit and push reader changes first, then update the submodule pointer on `main`.
- Preserve existing user changes. Make focused commits that explain resulting behavior and validation. Do not force-push or overwrite existing tags/releases.
- For product changes, increase `BuildConfig.versionCode` above the latest published build and update the feature plan/changelog. Let the successful release workflow publish the new APK, or publish the tested artifact with `gh release create` if appropriate. Never silently replace an existing APK asset.
- Read `README.md` and `docs/RELEASING.md` for the build/release process. Use the pinned runtime/PDF.js packages; do not unnecessarily rebuild or change the PDF engine.
- Run reader unit tests and native unit tests, build the APK and run browser checks appropriate to the change. Verify package, signing identity and embedded reader sources before release. Report physical-device and account-sync tests separately.
- Project code follows upstream AGPLv3. Preserve `COPYING`, notices and third-party licenses. Do not relicense the derived application as Apache/MIT.
- Public APKs must follow signing/release-policy.json: private Motero identity, non-debuggable, Android API 28+, V3 rotation with legacy rollback disabled. A missing production signing secret is a hard publication blocker; never fall back to a development key.
- Keep the receiver-permission namespace aligned between the release manifest and AndroidX Core. Do not restore legacy PERMISSION trust to work around update conflicts. Require the API 31/35 emulator update/data-retention and old-key refusal checks before publishing a release.
- The existing `debug.keystore` is the verified public upstream Android test key, retained only for development and migration/negative tests. Never commit a new private signing key, account token, credential file or personal PDF. Never print credential values.
- Legacy debug-signed releases are deliberately quarantined as drafts for public-release preparation. Keep their original assets/tags unchanged; never re-publish them as safe public APKs.
- Do not publish the cloud environment as part of normal development. Repository commits and GitHub Releases are separate from cloud-environment publication.
