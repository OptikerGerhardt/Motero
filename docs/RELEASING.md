# Building and publishing releases

## Signing setup

Release APKs use the private Motero signing identity pinned in `signing/release-policy.json`. The repository contains only its public certificate and rotation proof. Keep the private key and its recovery copy outside Git and release assets: future updates depend on retaining this identity.

The maintainer configures the repository Actions secret **`MOTERO_RELEASE_SIGNING`** under **Settings → Secrets and variables → Actions**. Its value is a JSON object with `keystore_base64`, `store_password`, `key_password`, and `key_alias`, supplied from the private signing backup. Never paste those values into an issue or commit.

This signing setup was verified by the successful Build 306 release. Generating a replacement key requires a planned migration; do not silently change the pinned identity.

## Automated release process

1. Commit reader changes on this repository's `reader` branch and push them first. Update the reader submodule reference and Android changes on `main`.
2. For app changes, increase `BuildConfig.versionCode` and update the changelog and feature plan. Use focused commits.
3. The build job receives no signing secret. It checks source history, builds and tests the reader and Android app, runs browser and publication checks, and prepares an unsigned APK with a complete source archive including submodules.
4. Only the release job for `main` receives the signing secret. It signs and verifies the APK against the pinned certificate, Android 9+ requirement, non-debuggable manifest, V3 rotation, restricted legacy signing capabilities, and runtime/reader content hashes.
5. Before publishing, Android emulators on APIs 31 and 35 install the original 303 APK, reproduce the known 306 permission conflict, update to the candidate while retaining a private test marker and UID, and reject updates/permission requests signed with the old public key. The current release also installs the verified preceding APK (Build 312 for Build 313) and checks its update to the candidate with another private data marker and stable UID. Fixtures remain under ignored build directories and are never published.
6. The unsigned input is removed from the release files. GitHub publishes `v1.0.0-<build>` with `Motero_Build<build>.apk`, complete sources, verification reports, and `SHA256SUMS.txt`.

A missing or incorrect signing secret stops publication. There is no fallback to the public development key. Pull requests cannot publish releases and receive no signing secret. Existing tags and assets must not be overwritten. App changes cannot reuse a published build number; documentation updates do not replace existing releases.

The workflow can also be started under **Actions → Motero build, test and release → Run workflow** on `main`. The release job needs `contents: write`; the build job needs `contents: read`. Third-party Actions are pinned to commit hashes.

## Local release build

Initialize submodules and prepare the reader assets as described in the root README. Use JDK 17 and the documented Android SDK, then:

```sh
./gradlew :app:testDevReleaseUnitTest :app:assembleDevRelease -PmoteroPublicRelease=true --init-script scripts/test_jvm_agent.gradle --no-build-cache
python3 scripts/sign_release.py --apk app/build/outputs/apk/dev/release/app-dev-release-unsigned.apk --output /tmp/Motero_Build306.apk --build-tools "$ANDROID_HOME/build-tools/36.0.0" --secret-file /secure/private/path/MOTERO_RELEASE_SIGNING.json
python3 scripts/prepare_release.py --apk /tmp/Motero_Build306.apk --output dist --build-tools "$ANDROID_HOME/build-tools/36.0.0"
```

Adjust the build number to the current version. `--secret-file` is for local signing; CI reads the Actions secret from its environment. The source packer includes tracked files and initialized submodules, excludes Git metadata and untracked local files, and records file hashes in `SOURCE_SNAPSHOT.json`.

## Development keys and migration

`debug.keystore` is the verified public Zotero development key, retained for development and negative signing tests. It is not an acceptable release identity. Earlier development-signed releases remain archived as drafts and must not be re-published as production downloads.

The release APK's Android-9+ rotation proof has been checked with signing tools. Actual installation and data migration on BOOX/GrapheneOS devices still need verification. Back up data before the first migration. The old key has no rollback capability after the transition. Historical same-key update reports through Build 305 do not verify this new rotation.

The Build 307 receiver namespace must match between the release manifest and AndroidX Core. `scripts/verify_receiver_permission.py` checks both. The release job uses rooted AOSP emulators; `scripts/check_android_update.py` refuses physical devices. Historical Build 306 signing checks did not cover this PackageManager permission gate and are not sufficient migration evidence.

If a release fails solely because of release infrastructure, the maintainer can dispatch the workflow with `reuse_build_run_id` set to the original successful build-job run. The guard requires the original main workflow, successful build/tests, matching versions and source commit, a matching unsigned-APK checksum, and a diff limited to explicitly allowed release-infrastructure files. Application inputs, reader references and dependencies must be unchanged. It repackages current sources with a provenance report and repeats signing, source-audit and both Android update gates. Any application change requires a fresh full build.
