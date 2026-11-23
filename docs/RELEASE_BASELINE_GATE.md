# Release baseline parity

The `Release baseline parity` job checks all PRs to `develop`, relevant
pushes, releases and the daily schedule. It reads the latest published stable
GitHub release tag, verifies that the tag resolves to a commit on `main`, and
rejects an older build number or a Reader gitlink outside the released Reader
history. CI fails when it cannot verify the baseline.

## Integrate a published release

Open a focused, reviewed PR against current `develop`. Squash the latest
published tag into its sources, preserve develop-only CI and tests, and record
the published commit SHA in `.github/release-baseline`. The checker finds the
commit introducing that SHA and verifies that merging the release at that
checkpoint leaves its tree unchanged. This supports squash-only branch rules
without force-pushing. A SHA written into the file by itself fails verification.

Resolve conflicting released changes at the checkpoint before carrying
additional changes forward. Rerun relevant exact-SHA regression checks, including
Android build, Reader tests and instrumentation. The baseline check verifies
integration history and version/Reader monotonicity. Device behavior and live
account sync require separate checks.

## Activate the gate

1. Review and merge the focused default-branch monitor PR to `main` so GitHub
   can run the schedule and see main/release events.
2. Land the published-release sync, then review and merge the guard to `develop`.
3. After a green run on a real `develop` PR, add **Release baseline parity**
   to the existing required checks in GitHub's `develop` ruleset. Retain PR,
   build, linear history, deletion and force-push protections.

A new release can invalidate earlier green PR runs. GitHub may leave old
check conclusions in place until rerun. Recheck the live release and base
immediately before merging. User approval is required for workflow and
branch-rule changes.

## Avoid duplicate work

Before implementing an Android or Reader issue, compare the current published
tag, `develop` and the PR HEAD. Record the already shipped behavior and the
remaining change/test gap in the PR template. When the release already fixes
an issue, keep only independently valuable missing regression tests.
