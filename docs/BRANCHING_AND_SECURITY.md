# Branching, integration and security policy

| Target | Integration |
| --- | --- |
| `develop` | A worker may squash-merge a focused low-risk bugfix or regression test after independent review and green required CI. A complete feature needs owner approval. |
| `feature/<topic>` | A worker may squash-merge a reviewed and tested low-risk sub-PR into its documented integration branch. Submit the completed feature to `develop` in one PR. |
| `main` | Protected release branch. The owner decides when work is promoted. Follow GitHub’s separate review, CI and protection requirements. |

Use one writer per working branch and the [shared reservation protocol](AGENT_WORKFLOW.md). No direct pushes into `develop` or `main`, force pushes or protection bypasses. Record dependencies before retargeting an existing or stacked PR. For each merge, verify the current lease, expected HEAD, compatible target base, independent review, resolved findings and successful required checks. Use squash with an expected HEAD SHA.

Owner approval is required for whole features, releases and signing, workflow and security policy changes, credentials or permissions, major or breaking changes, risky dependency or license changes, storage or sync migrations and uncertain data integrity. Use `agent:ready-for-human-review` when approval is the remaining gate. Keep release assets and tags immutable.

Keep PR and CI requirements in force. Restrict Actions tokens to the privileges their job needs. Keep write tokens and secrets away from untrusted PR code. A logical worker review is evidence of an independent review. GitHub reviews and protections remain separate requirements.

## Repository checks

Require the Android `build` check and the applicable release baseline verification. Verify the embedded Reader gitlink and relevant Reader tests. Release and signing follow [the release procedure](RELEASING.md).
