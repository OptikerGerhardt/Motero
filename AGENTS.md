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


## Agent work

Pick up and solve actionable issues autonomously. Agent 4 merges reviewed
fixes into `develop` and scoped sub-PRs into their `feature/<topic>` branch
after current-HEAD review and CI. Present only the completed feature PR to
the owner for product approval. Read the [handoff protocol](docs/AGENT_HANDOFF_DISPATCHER.md)
and preserve [branching and release gates](docs/BRANCHING_AND_SECURITY.md).

## Release parity

- Before Android/Reader work, compare published tag, develop and PR SHA, build
  number, Reader gitlink, affected code and existing tests. Record the shipped
  behavior and unique remaining change or test in the PR.
- Require a green [release baseline check](docs/RELEASE_BASELINE_GATE.md) and
  relevant exact-SHA tests before merging. Revalidate after a new release.

## Autonomous worker model (owner-authorized, 2026-11-26)

The four scheduled workers are interchangeable autonomous developers. Any worker may select an actionable issue/PR, design a bounded scope, implement and test it, independently review another worker's exact HEAD, repair findings, or integrate an eligible reviewed PR. The former Agent 1/2/3/4 role numbers in older coordination documents describe temporary capabilities, not fixed identities or mandatory handoffs. No dispatcher or fixed sequence is required. The shared policy is [Motero #44](https://github.com/OptikerGerhardt/Motero/issues/44); the [short-lived task reservation protocol](https://github.com/OptikerGerhardt/Motero/blob/coordination/autonomous-v1/agent-coordination/README.md) prevents competing writes among cooperating workers. The coordination branch is metadata only and must never be merged.

Keep one writer per branch and require review by a different logical worker, exact HEAD/base evidence and all required tests before integration. Any worker can squash-merge a low-risk standalone fix into develop or a low-risk scoped sub-PR into its feature integration branch after those gates. A complete feature PR into develop requires owner approval; main, releases, security/permissions, CI policy, high-risk storage/sync/migrations, and unresolved data-integrity concerns remain human-approved. No direct product pushes to develop/main, no self-approval, no bypass of repository protections. Existing GitHub rules remain authoritative. Logical worker IDs are not separate GitHub credentials. Work on another task while CI, review, or human approval is pending. Record actual artifacts and limitations on the target issue/PR, not a central dispatch table. This owner-authorized role mapping supersedes only older fixed-role/dispatcher language, not substantive safety requirements.
