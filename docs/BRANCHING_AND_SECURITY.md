# Branching, integration and security policy

## Branches

- `main`: stable product/release branch. **Human-only merge decision**, no autonomous merges, direct pushes, force pushes, or automatic releases by agents. The default GitHub branch remains `main`.
- `develop`: tested integration branch for small and medium changes. Reviewed, low-risk PRs may be **squash-merged by Agent 4** after its own explicit final verification; high-risk changes require human approval.
- `feature/<topic>`: optional shared integration branch for a large feature. Small scoped PRs can target it after review; the complete feature goes through a human-approved PR into `develop`.
- `fix/<issue>`, `agent/<issue>`, `ci/<topic>`: short-lived, single-owner PR branches.

A PR can target another branch. Do not stack unrelated changes merely to keep the agent cycle running. If an unmerged PR is a technical dependency, record the exact base/required commit and do not pretend the main/develop tests covered the integration.

## Authority, PR state and scope

1. Agent 1 plans scoped issues, dependencies and test criteria.
2. Agent 2 implements, adds tests and submits to `develop` or a parent feature branch. No direct code push to `develop` after initial setup.
3. Agent 3 independently reviews the precise HEAD SHA, relevant upstream changes, licensing and reproducible tests. When accepted, records an explicit pass tied to that SHA and moves to `agent:review-passed`.
4. Agent 4 verifies current HEAD and base, green required workflow jobs, open review findings, data integrity, security and scope. Only if **every low-risk integration condition is satisfied** may Agent 4 merge the PR into `develop` or its explicit parent feature branch via `squash` and an expected HEAD SHA. No bypass of failed/missing tests or branch policies.
5. Agent 4 records the merge SHA and closes/updates the associated sub-issue where acceptance criteria have been met. Agent 1 replenishes independent work and tracks dependent issues. `main` merges remain human-only.

**Human approval is required** for: any PR into `main`; whole-feature PRs, major architectural or breaking changes; releases/APK signing; credential/permissions changes, `.github/workflows` and security rules; dependency/license changes with elevated risk; data migration, sync/annotation format changes or possible data loss; uncertainty about backwards compatibility or missing decisive tests.

Use `agent:ready-for-human-review` for these high-impact changes or PRs to `main`. Do not label all low-risk completed PRs as human-only. `agent:blocked` pauses only the affected PR; independent work continues.

**Ownership**: one modifying agent per branch. Agent 2 may work on a different PR during Agent 3/4 review, but Agent 4 must explicitly take over a `needs-fix` branch and Agent 2 must not write concurrently. Old passing reviews do not automatically apply to a changed SHA or base.

## Repository-specific checks

Android builds and tests run for pull requests to main and develop. APK signing/release remains restricted to main by the existing workflow guard. The reader submodule branch is a separate source; update that pinned pointer deliberately. Existing stacked Android PRs must be migrated only after checking their parent/child dependencies.

Rule suggestions before activating them:
- `main`: require a PR, passing relevant workflows, block force pushes and deletion; keep human sign-off required by the agent policy.
- `develop`: require a PR, passing build, block force pushes and deletion; do not require a distinct human review identity while the agents use the same GitHub login.
- No mandatory approvals from a separate user unless that reviewer can actually be distinct from the PR author. Same-account bot reviews cannot provide cryptographically or organizationally independent GitHub approval.
- Restrict Actions tokens to the least privilege; never expose write tokens/secrets to untrusted fork PR workflows or use unchecked `pull_request_target` checkout.
- Only include stable check names that actually appear as successful checks on real PRs, and review rules after workflow changes.

## GitHub control plane: IMPORTANT

GitHub branch **rulesets are enforced only when applied through Settings → Rules → Rulesets**. This Markdown file, `CODEOWNERS`, and policy prompts are **not** branch protection themselves. The currently connected GitHub App does not expose ruleset writes or repository Actions settings, regardless of the account's admin role.

Because the user explicitly chose not to separate the agent's GitHub identity from the owner account, there is **no reliable GitHub-level distinction** between an agent request and the owner's request. Rules can enforce CI/PR requirements but cannot guarantee that only the human clicks merge. For a hard human-only security boundary later, a distinct limited GitHub App or separate bot identity would be required.

For additional guidance see [GitHub rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository) and [Actions permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository).
