# Motero

- Be concise: no introductions, repetition, long progress reports or summaries.
- Search with targeted `rg` queries; read only relevant files/excerpts. Bound logs/results. Reuse findings; diagnose failed commands before retrying.
- Change only task-relevant code; preserve user changes. Prefer focused tests, but never omit required checks or trade correctness/code quality for token savings.
- Record durable architecture/lessons briefly in existing docs; avoid duplicated instructions. Consult nested instructions only for affected directories.
- Keep FEATUREPLAN.md limited to open work: remove verified completed items, retain only unfinished parts, and track device verification separately; preserve decisions in linked history/changelog.

## Project

- Android: `main`; `reader/`: submodule from this repository's `reader` branch. Push changed reader commits first, then update `main`'s pointer.
- Reuse Zotero UI components, spacing, typography, icons and theme colors.
- Keep pinned runtime/PDF.js packages; avoid unnecessary engine changes/rebuilds. Preserve AGPLv3, COPYING and third-party notices.
- Build/setup: README.md; release procedure: docs/RELEASING.md; roadmap/history: FEATUREPLAN.md, CHANGELOG.md, BUILD_STATUS.md. Read relevant sections, not entire documents.

## Delivery

- Commit/push completed work; each app build requires a new APK release. Increase versionCode above published builds and update changelog/plan. Never force-push, replace release assets/tags, change repository visibility or publish the cloud environment without explicit authorization.
- Run reader/native unit tests, APK build and relevant browser checks. Before release verify package, embedded reader sources and signing. Report physical-device/account-sync testing separately.
- Follow signing/release-policy.json: private Motero signer, non-debuggable, API 28+, V3 rotation without legacy rollback; no development-key fallback. Keep receiver permissions aligned with AndroidX Core; never restore legacy PERMISSION trust.
- Require API 31/35 update/data-retention and old-key-refusal gates before publication. Keep legacy debug-signed releases quarantined as drafts, with original tags/assets intact.
- Never commit credentials, private keys or personal PDFs, or print secrets. Existing debug.keystore is the public upstream test key, for development/negative tests only.


## Branching and merge gates (develop)

See `docs/BRANCHING_AND_SECURITY.md` in the relevant branch. `main` remains the human-approved release branch; `develop` is the shared tested integration branch. New independent implementation PRs target `develop` or an explicit parent feature branch; only a human-authorized PR may target/merge into `main`. Reviewed low-risk PRs may be squash-merged into `develop` by Agent 4 following SHA-specific independent review, successful current CI checks, explicit scope verification and a final mergeability check. No agent auto-merges releases, changes credentials, security rules, workflow definitions or data migrations. Review/CI is required on the actual PR branch and compatible target base. These are agent/process policies, not proof that GitHub settings enforce restrictions. The GitHub admin account is shared with the connected integration; it cannot technically distinguish agent from human until account separation is introduced.

## Deterministische Agenten-Übergaben

Follow [the agent handoff protocol](docs/AGENT_HANDOFF_DISPATCHER.md). Define merge criteria up front. Record concrete blockers with an owner and resume condition. Continue independent work while a PR waits.

## Release parity

- Before Android/Reader work, compare published tag, develop and PR SHA, build
  number, Reader gitlink, affected code and existing tests. Record the shipped
  behavior and unique remaining change or test in the PR.
- Require a green [release baseline check](docs/RELEASE_BASELINE_GATE.md) and
  relevant exact-SHA tests before merging. Revalidate after a new release.
