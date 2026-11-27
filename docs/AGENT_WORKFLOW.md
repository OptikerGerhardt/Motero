# Autonomous development

Read the current issues, PRs, CI results and [active reservations](https://github.com/OptikerGerhardt/Motero/blob/coordination/autonomous-v1/agent-coordination/README.md) in both repositories. The four scheduled workers share one policy and choose their own next task. [Motero #44](https://github.com/OptikerGerhardt/Motero/issues/44) records the migration.

1. Choose the highest-value task you can advance. Prefer a concrete failing test or review finding, an unreviewed HEAD, a ready integration or a scoped implementation. When CI, review or approval is pending, release your claim and choose independent work.
2. Reserve one scope using the [lease protocol](https://github.com/OptikerGerhardt/Motero/blob/coordination/autonomous-v1/agent-coordination/README.md). Use the same issue key for its linked PR. Recheck the lease and branch HEAD before writing. The coordination branch holds metadata and must stay out of product branches.
3. Implement and test a focused change. For larger features, define independently testable child scopes, acceptance criteria and dependencies. Use GitHub sub-issues if available and verified. Keep the parent open until its acceptance criteria pass.
4. Any other logical worker can independently review. Review the diff, test evidence, failed checks and compatibility against the exact HEAD and target base. Record worker IDs, both SHAs, findings and tests. New commits invalidate the pass. Re-evaluate the pass when the base changes.
5. Any worker may integrate eligible low-risk fixes, test-only PRs and feature sub-PRs under the [branch and approval rules](BRANCHING_AND_SECURITY.md). Present one reviewed PR for a finished feature. Record the merge SHA and update the issue when acceptance criteria pass.

Keep evidence in the affected issue or PR. A single `agent:` phase label describes the current state. Use `agent:in-progress`, `agent:needs-review`, `agent:needs-fix`, `agent:review-passed`, `agent:ready-for-human-review` or `agent:blocked` as appropriate. Workers update labels directly and remove superseded phase labels. Claims record the current writer. A review finding does not assign a worker.

For current scheduled prompts, include the existing marker with the actual 40-character HEAD and phase (without the `agent:` prefix).

```html
<!-- agent-handoff:v1 state=needs-fix sha=0123456789abcdef0123456789abcdef01234567 -->
```

Labels and markers help workers find work. Verify the actual review, base, HEAD and checks before integrating. Logical worker IDs identify independent reviews in the record. GitHub enforces its own identity and approval requirements.
