# Deterministic agent handoffs (v1)

The four scheduled ChatGPT agents remain the **workers**. GitHub is the durable source of truth. The dispatcher is a small, event-driven **status-label coordinator**, not a coding agent, review approval, merge bot or test substitute.

## Source of truth and task ownership

- One PR has exactly one primary `agent:` phase label. An Issue may be `agent:ready-to-implement` without a PR.
- `agent:in-progress`: Agent 2 implements. `agent:needs-review`: Agent 3 reviews. `agent:needs-fix`: Agent 4 repairs. `agent:review-passed`: Agent 4 performs independent final gate. `agent:ready-for-human-review`: only the human can approve risky PRs and PRs to main. `agent:blocked`: documented external obstacle.
- **Confirmed** P0–P2 errors on an active Draft PR are not mere comments: reviewer immediately sets `agent:needs-fix`, states exact SHA and required negative test, and hands off the branch. No other agent may write on that branch at the same time.
- When no Android PR is assigned to Agent 2, Agent 2 takes a separate `agent:ready-to-implement` Android issue. Do not accidentally starve independent work because Agent 4 owns a broken PR.
- The next work is based on actual issue/PR/review/CI state; a missing label is repaired using evidence, never interpreted as an empty queue.
- Full evidence (reproductions, code reviews, exact commit SHAs, CI run links, device limits, test results, and merge outcomes) belongs in GitHub. Hourly chat summaries: up to 3 short bullets.
- Android is prioritized; Desktop remains active when Android is genuinely blocked or no independent Android work is ready.
- All new app PRs target `develop` or a documented feature integration branch, not `main`. A nested Android Reader source PR has a separate branch; Android Git-submodule pointers must be verified.

## Machine-readable GitHub PR handoff marker

After verifying the action, an agent writes a regular GitHub PR conversation comment including one **single-line** marker (no quotes), in addition to its detailed technical finding:

```text
<!-- agent-handoff:v1 state=needs-fix sha=0123456789abcdef0123456789abcdef01234567 -->
```

Replace state and SHA with the **actual** PR HEAD. Supported states: `in-progress`, `needs-review`, `needs-fix`, `review-passed`, `ready-for-human-review`, `blocked`.

The event-driven workflow will only act when:
- GitHub confirms the comment was posted by the **repository owner's** account; outsiders' text, copied commands, and forks are ignored.
- The marker contains the exact **current HEAD SHA**.
- The PR targets `develop` or a declared `feature/...` integration branch, never `main`.
- The transition follows the allowed state machine. A pass requires a prior review request; changing code after approval invalidates the old approval label.
- The workflow only applies labels. It never sets approval, merges, skips CI, runs PR code, or starts a new ChatGPT automation. Agent 3/4 remain responsible for actual review/quality.

## Workflow activation and limits

`.github/workflows/agent-handoff.yml` is staged on `develop` **but is not yet active**. GitHub sources both `pull_request_target` and `issue_comment` workflows from the repository's **default branch** (`main`), including for PRs targeting develop. Therefore **all automatic event-driven handoffs require human-approved promotion of this workflow file into main**. The dispatcher never checks out or executes untrusted PR code. Until promotion, every agent must apply its status labels itself, and Agent 1 must reconcile missed handoffs.

Deploy the dispatcher into main **only as a separately reviewed workflow-only PR**, not by merging the entire develop branch. This technical activation does not authorize agents to merge PRs, push code to main, change permissions or release APKs. Review the action's explicit minimal `issues: write` permission and pin before promotion.

## Verification checklist

- Test with a new internal draft PR targeted to develop: it should receive `agent:in-progress`; no changes to code.
- After activation on main, a PR comment with an exact SHA from the owner and a valid transition should change exactly one `agent:` status label; a mismatched SHA, unauthorized actor, invalid transition, fork, and main-base PR must do nothing.
- New HEAD commits after `needs-review`/`review-passed` revert to `agent:in-progress`; no previously issued review automatically counts for new code. CI still has to execute for that HEAD.
- Check permission failures and workflow history. If `pull_request_target` is unavailable or restricted, the four agent automations continue explicit label handoffs; do not bypass GitHub security.

## Important boundary

GitHub settings Rulesets are still not applied, and the agent connector uses the owner's identity. These policies and Actions cannot cryptographically distinguish human and AI changes using that same account. A separate restricted app/login would be necessary to enforce human-only main merges independently.
