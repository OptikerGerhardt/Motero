# Android instrumentation test gate

Scope: issue #25 (unblocks parts of #21 and #22). The workflow landed in PR #26. It runs separately from the Motero build and release workflow and does not sign or publish APKs.

## Running the tests

The PR workflow `.github/workflows/android-emulator-instrumentation.yml` prepares the
pinned Reader assets, installs the Android compile SDK, starts a disposable Android 15
(API 35, x86_64) emulator, and runs:

```sh
./gradlew :app:connectedDevDebugAndroidTest --no-daemon --max-workers=2 --stacktrace
```

Run locally only with an Android SDK, compatible emulator and working Android
Gradle checkout. The workflow uses a read-only Actions token and uploads the
real connected test reports even when the job fails.

## Evidence boundaries

- `RealmTagPersistenceInstrumentedTest` checks **real Realm DB transactions**
  with a unique on-disk disposable Realm: tag-only add/remove/clear across
  close/reopen, no-op for missing annotations, sync-change tracking, and
  transaction rollback. It does **not** invoke the ReaderViewModel partial
  callback chain and does not establish real account sync or read-only UI gating.
  Those remain part of issue #22/PR #3 and require additional code/tests there.
- `ComposeMeasurementInstrumentedTest` checks that a real Compose layout
  can report child bounds and receive a tap in an emulator. It is a smoke test,
  **not** the actual ReaderPageScrubber layout/drag/rotation regression.
  PR #20 separately added real scrubber instrumentation. See its [Android 15 run](https://github.com/OptikerGerhardt/Motero/actions/runs/45642856153/job/139305880305). Issue #21 tracks remaining verification.
- BOOX device behavior, live Zotero account synchronization and manual reader
  navigation are **not run** in this workflow. They must never be represented
  as successful automated tests.
- A job does not count as passed until GitHub Actions reports a completed
  successful `instrumentation` job for its **exact PR HEAD**.

## Remaining verification

- For issue #22, compare PR #3’s unique persistence tests with coverage on current `develop`.
  Preserve missing coverage in a scoped test-only PR. The published tag fix already covers the obsolete product work in PR #3.
- Compare the evidence from merged PR #20 with issue #21’s remaining acceptance criteria, including physical-device verification.
- A different worker reviews the exact HEAD, target base and CI evidence. Integrate under the
  [branch and approval rules](BRANCHING_AND_SECURITY.md). Future workflow or dependency infrastructure changes require owner approval.

If the emulator fails to start or tests do not compile, capture the exact
GitHub run, failing command and log. Fix that issue before declaring the
infrastructure usable. Avoid repeating 'instrumentation unavailable' without
a concrete implementation step or actionable failure.
