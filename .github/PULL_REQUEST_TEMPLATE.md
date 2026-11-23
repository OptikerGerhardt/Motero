## Change and scope

- Linked issue / parent (if any):
- Implementation owner:
- Exact PR HEAD and base SHAs:

## Published main / develop parity (mandatory)

- Published release tag and commit, versionCode, pinned Reader SHA:
- Current `develop` SHA, versionCode, pinned Reader SHA:
- Already shipped equivalent code/fix on `main`:
- Unique missing behavior and test coverage (link to exact code/tests):
- Baseline guard job link and result:

If the requested fix is already shipped, **do not implement it again**.
Narrow this PR to genuinely missing tests or close it as redundant, keeping
valuable independent regressions.

## Verified evidence

- Tests run on **this exact HEAD** (with links):
- Tests not run and why:
- Reader/Android/Realm/Compose compatibility and negative cases:
- Data migration, sync, permissions, and release impact:
- BOOX / physical device and live Zotero sync (pass/fail/not run):

## Integration gate

- [ ] Current published release is verified by the baseline check
- [ ] Published Reader commit is preserved or advanced to a proven descendant
- [ ] Relevant published fixes, including save-error recovery, remain intact
- [ ] CI and independent SHA-specific review completed
- [ ] Human approval obtained if workflow/security/release/data-integrity behavior is affected

See [release baseline gate](../docs/RELEASE_BASELINE_GATE.md).
