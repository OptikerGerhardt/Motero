# Deterministic agent handoffs (v1)

The four scheduled ChatGPT agents remain the **workers**. GitHub is the durable source of truth. The dispatcher is a small, event-driven **status-label coordinator**, not a coding agent, review approval, merge bot or test substitute.

## Issue proposals first

- Agent 1 prioritizes an open issue and records the problem, shipped behavior,
  dependencies and the decision needed from the owner.
- Agent 2 lays out options and one or more possible PRs with scope, likely files,
  risks and acceptance checks. Keep the proposal in the issue. Write code
  only after the owner selects the scope and explicitly delegates implementation.
- Agent 3 challenges the proposal, especially regression and device-test needs.
  Agent 4 summarizes the recommendation and the owner’s decision points.
- Once the proposal is ready, move on to another issue. Reopen a finished
  proposal only when new evidence or the owner’s decision changes it.
- For delegated changes, the existing phase labels track implementation,
  exact-HEAD review and repairs. Agent 4 presents the final review evidence
  under `agent:ready-for-human-review`; the owner decides whether to merge.
  An implementation decision does not grant release approval.

## Machine-readable GitHub PR handoff marker

After verifying the action, an agent writes a regular GitHub PR conversation comment including one **single-line** marker (no quotes), in addition to its detailed technical finding:

```text
<!-- agent-handoff:v1 state=needs-fix sha=0123456789abcdef0123456789abcdef01234567 -->
```

Replace state and SHA with the **actual** PR HEAD. Supported states: `in-progress`, `needs-review`, `needs-fix`, `review-passed`, `ready-for-human-review`, `blocked`.

The event-driven workflow will only act when:
- GitHub confirms the comment was posted by the **repository owner's or dedicated development account**; outsiders' text, copied commands, and forks are ignored.
- The marker contains the exact **current HEAD SHA**.
- The PR targets `develop` or a declared `feature/...` integration branch, never `main`.
- The transition follows the allowed state machine. A pass requires a prior review request; changing code after approval invalidates the old approval label.
- The workflow only applies labels. It never sets approval, merges, skips CI, runs PR code, or starts a new ChatGPT automation. Agents provide review evidence for the owner.

## Merge decisions and blocked work

- Agent 1 records merge criteria before implementation. A BOOX check blocks
  only when a changed behavior depends on the device or there is a concrete
  BOOX regression signal. For shared layouts, use a representative emulator
  test. Record optional device checks separately.
- Agent 3 reviews the current HEAD against those criteria. A new blocker needs
  a reproducible defect or a named missing check, one owner, and a resume
  condition. A successful release baseline check can coexist with diverged
  Git history under squash merges.
- After an exact-SHA review pass, Agent 4 reports the merge recommendation
  on the next run. Include required CI, mergeability and any remaining blocker.
  The owner makes the merge decision.
- When CI, hardware or human input is pending, move to independent work and
  resume when the named condition is met. After two passes without progress,
  park the PR with an owner and resume condition instead of writing another
  status-only update. Use an allowed transition for any label change.
- For a required BOOX check, give the user a compatible installable test build,
  the device and exact steps, and the expected observation. Request a
  screenshot or recording only if it helps diagnose the result.

## Workflow activation and limits

The dispatcher is active on the default branch. Use exact-HEAD markers
and verify the resulting status label. Reconcile failed dispatches without
bypassing review or CI. Only the owner or the dedicated development
account can submit authenticated handoffs.

## Verification checklist

- Test with a new internal draft PR targeted to develop: it should receive `agent:in-progress`; no changes to code.
- After activation on main, a PR comment with an exact SHA from the owner and a valid transition should change exactly one `agent:` status label; a mismatched SHA, unauthorized actor, invalid transition, fork, and main-base PR must do nothing.
- New HEAD commits after `needs-review`/`review-passed` revert to `agent:in-progress`; no previously issued review automatically counts for new code. CI still has to execute for that HEAD.
- Check permission failures and workflow history. If `pull_request_target` is unavailable or restricted, the four agent automations continue explicit label handoffs; do not bypass GitHub security.

## Important boundary

The dispatcher labels PRs. GitHub rules and the branching policy govern merges. Use the release baseline check through the required build on develop.
