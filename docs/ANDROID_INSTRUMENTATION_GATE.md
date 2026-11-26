# Android instrumentation test gate

Scope: issue #25 (unblocks parts of #21 and #22). The new workflow is intentionally
**separate** from the Motero build/release workflow and does not sign or publish APKs.

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
  That remains issue #21/PR #20 after the harness is merged.
- BOOX device behavior, live Zotero account synchronization and manual reader
  navigation are **not run** in this workflow. They must never be represented
  as successful automated tests.
- A job does not count as passed until GitHub Actions reports a completed
  successful `instrumentation` job for its **exact PR HEAD**.

## Follow-up after the workflow is proven

1. Human reviewer (`OptikerGerhardt`) verifies and authorizes this
   workflow/dependency infrastructure PR into `develop`; bots must not merge it.
2. On a reserved scope, add a real `saveAnnotations → EditTagsForItemDbRequest → Realm → reload`
   integration test on existing PR #3 (issue #22), against the current base.
3. On a separate reserved scope, add real `ReaderPageScrubber` measured bounds and tap/drag/rotation
   tests on existing PR #20 (issue #21).
4. A different worker reviews the exact HEAD, target base, and CI evidence.
   Any eligible worker can integrate once the acceptance and approval gates pass.

If the emulator fails to start or tests do not compile, capture the exact
GitHub run, failing command and log. Fix that issue before declaring the
infrastructure usable. Avoid repeating 'instrumentation unavailable' without
a concrete implementation step or actionable failure.
