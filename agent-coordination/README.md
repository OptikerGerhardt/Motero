# Autonomous worker reservations (v1)

This branch is coordination metadata only. Never merge it or open a PR from it.
All four workers can independently triage, design, implement, review, repair, or integrate.
No dispatcher or designated reviewer/merger. A different logical worker reviews a change before integration.

## Claim protocol
- Canonical task key: `A-issue-N` or `D-issue-N` for a scoped issue. If a PR lacks a linked issue use `A-pr-N` / `D-pr-N`. For an existing linked PR use the issue's key. Check existing PRs and parent/child scopes before choosing a key. Do not create duplicate PRs; do not write an existing branch if another related key could own it.
- Claim file: `agent-coordination/claims/<key>.json`. Fields: protocol=1, worker (1–4), token (unique per claim), acquiredAt, expiresAt (UTC ISO strings, max 30 minutes), action, target, state ("active" or "released"). No secrets.
- Read file using fetch_file on coordination/autonomous-v1. Only a confirmed missing path (404 with the branch accessible) may be created with create_file. Otherwise only acquire a released or expired lease by update_file using its current blob SHA. Never overwrite a live lease. If conflict, read again or pick another task.
- After writing, fetch_file and verify your token, state, and expiry. Before each product write or merge re-read claim and actual current HEAD. If lost/expired stop writing immediately. Renew only with your current token and blob SHA. At completion/CI wait release by updating to state=released with current blob SHA after verifying token; never release another worker's claim.
- A lease serializes cooperating workers, not GitHub permissions. Claims do not authorize bypassing branch policy, force pushes or changing unrelated files. Scope and HEAD must still be checked. For an integration acquire the same task claim and ensure base/HEAD/review/CI still match. Avoid simultaneous merges targeting the same base: use a second short claim with key e.g. A-merge-develop, acquired only after the task claim; if unavailable release and choose another task.
- Do not wait for claims or CI. Move to another ready task. On persistent connector failure no unsafe writes; try a different safe target or publish a concrete finding. Issue #44 records the process, not assignments.
