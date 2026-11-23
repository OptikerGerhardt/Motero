# Release baseline parity gate

## Why

`main` is the published app. `develop` may have newer CI but must never silently
regress to an older app/Reader revision. On 2026-11-23, `main` was 1.1.9/335
with Reader `9302152841b60f9ec9e5703eb6a3fc87025168fa`, while `develop`
was still 1.1.8/334 with Reader `d7eb5e5ec77a0c48f1ca562e8d30e4afec53c569`.
Existing emulator checks did not establish release parity.

## Required mechanical check

`.github/workflows/release-baseline-guard.yml` runs on all PRs to `develop`
(no changed-path filter), pushes to `main`/`develop`, daily, and manually. It:

1. Fetches **live** `main` and `develop` refs, failing if current `main` is
   not an ancestor of the candidate. A baseline-sync PR that merges `main`
   into a feature branch can pass as long as its proposed result includes it.
2. Rejects a candidate whose `versionCode` is lower than that of `main`.
3. Reads the **gitlink**, not the reader branch tip, and verifies a new Reader
   pin is identical to or a GitHub-verified descendant of the published pin.
4. Fails closed if refs, gitlinks, or Reader comparison cannot be verified.

The check is intentionally conservative: when `main` receives a new release,
new work on stale `develop` is blocked until a reviewed integration of `main`
into `develop` preserves the released fixes and the newer test infrastructure.
Never force-push, replace the published Reader pin with an older one, or change
version fields simply to make the check pass.

## Important: default-branch activation

GitHub runs scheduled workflows only from the repository's default branch
(`main`). Pushes to `main` also require this workflow file to exist on
`main`. While this workflow is present only on the proposed `develop` PR,
only its pull-request validation is active; **daily drift monitoring and main
push alerts are NOT active yet**. Following human review, mirror the same
minimal workflow and checker through a human-approved PR to `main`, without
merging unrelated stale `develop` code into the release. Do not claim
continuous monitoring before this activation is verified.

## Required human GitHub setting

After the isolated workflow PR is reviewed and merged to `develop`, use
**Settings → Rules → Rulesets** for `develop` to require the exact check
**Release baseline parity**, with PRs and no force pushes. Verify the real
check name on a PR before activating it. Only the human owner can edit the
ruleset; a passing optional workflow alone does not prevent merging.

If this check is already failing because `develop` is stale, integrate `main`
into `develop` in a separately reviewed PR first. Do not weaken or temporarily
skip the test to rush a feature. Keep branch protections configured by the
human owner. A main push will produce a drift signal, but GitHub does not
necessarily invalidate already-successful PR checks when **a different branch**
(`main`) advances; final pre-merge SHA comparison remains mandatory.

## Agent gate before EVERY change

For a candidate PR/Issue, record: current `main`/`develop`/PR HEAD SHAs;
`versionCode`; `reader` gitlink SHA; precise already-released equivalent
fixes; semantic difference; unique missing tests; owner; and exact-head CI.
If the requested bug is already fixed, do **not** write a second production
fix. Create only independently justified tests or a narrowed follow-up.
Repeated status comments are not productive work.

For the 1.1.9 baseline integration, independently verify PDF/EPUB Quick Tags,
annotation save-failure recovery and sync bookkeeping, pen/eraser behavior,
Reader crop/scroll/annotation changes, the Realm/Compose emulator workflow,
security and CI files. Re-run build, unit, Reader and relevant emulator tests
on the resulting SHA. BOOX and live account sync are separate manual gates.

This ancestry check cannot prove behavioral compatibility, that every
published feature still works, or that a modified workflow is trustworthy.
It complements, not replaces, exact-SHA regression tests and human review.
