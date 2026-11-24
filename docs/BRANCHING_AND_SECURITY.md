# Branching, integration and security policy

## Branches

- `main`: stable product/release branch. **Human-only merge decision**, no autonomous merges, direct pushes, force pushes, or automatic releases by agents. The default GitHub branch remains `main`.
- `develop`: tested integration branch for small and medium changes. The owner decides every merge after exact-HEAD review and required checks.
- `feature/<topic>`: optional shared integration branch for a large feature. Small scoped PRs can target it after review; the complete feature goes through a human-approved PR into `develop`.
- `fix/<issue>`, `agent/<issue>`, `ci/<topic>`: short-lived, single-owner PR branches.

A PR can target another branch. Do not stack unrelated changes merely to keep the agent cycle running. If an unmerged PR is a technical dependency, record the exact base/required commit and do not pretend the main/develop tests covered the integration.

## Authority, PR state and scope

1. Agents prepare issue proposals by default. They write code and open an active implementation PR only after the owner explicitly delegates the selected work.
2. For delegated work, Agent 2 implements the agreed scope and runs the agreed checks. Agent 3 reviews the exact HEAD and records evidence.
3. Agent 4 confirms the target base, required green CI and disposition of review findings, then presents a merge recommendation. The owner decides separately whether and when to merge or publish.
4. Preserve existing branch, CI, signing and security gates. Follow the [handoff protocol](AGENT_HANDOFF_DISPATCHER.md) for blockers and independent work.

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
