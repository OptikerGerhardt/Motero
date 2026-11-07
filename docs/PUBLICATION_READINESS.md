# Publication review

Reviewed on **November 7, 2026**. The review found **no unresolved blockers to making the repository public** in the areas checked below. Repository visibility remains private until the owner changes it.

## Scope and results

| Area | Result |
| --- | --- |
| Reachable Git history | Both GitHub branches (`main`, `reader`) and all three existing tags reviewed. The source guard covered 35,545 Git objects and 13,729 file blobs in the input revision. |
| Additional secret scan | Gitleaks 8.30.1 scanned 2,507 history entries. All seven alerts were reviewed: localized field labels, identifier alphabets, and unchanged public Zotero Firebase client configuration. No private Motero credential was identified. |
| Published release | All seven Build 306 assets match their current GitHub SHA-256 digests and sizes. All 8,944 source files match `SOURCE_SNAPSHOT.json`. Source, APK and test-report ZIP contents were checked recursively. |
| Archive alerts | All 84 Gitleaks archive alerts were classified: 62 verified file checksums, five localized labels, five identifier alphabets, ten already-public translator identifiers or public extension keys, and two expired public PDF.js test URLs. Public upstream provenance was verified for the service identifiers and test URLs. |
| Private signing material | Neither the actual private Motero key payload nor its passwords were found in the tracked source tree, initialized submodules, or published source ZIP. Public verification material is retained in `signing/`. |
| Development keystores | Two historical keystore blobs are byte-identical public Zotero files. The source guard permits only their exact content hashes. Production signing rejects the development identity. |
| Legacy downloads | Earlier development-signed releases remain drafts. Their tags/assets are preserved; the former CI artifact containing a development APK was removed. The remaining CI artifact is produced by the unsigned-build job. |
| Other GitHub content | No issues or pull requests; wiki and discussions disabled at review. The latest regular release is Build 306. |
| Attribution and license | AGPLv3, original copyright and dependency notices preserved. README credits ChatGPT/Codex for Motero's own work and acknowledges Zotero and community contributions. Upstream PR statuses were rechecked. |

The original imported histories and legacy release attachments were also reviewed during the initial preparation. The historical report remains at `qa/build306/publication-history-and-archives.json`. The repeat review is recorded in `qa/publication-review-2026-11-07.json`; it records reviewed alerts without exposing credential values.

## Release verification

[Build 306](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-306) was built, tested, signed, and published by the [successful GitHub workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/42386366739). Its downloaded APK was checked again during this review.

The APK requires Android 9+, is not debuggable, uses the pinned Motero certificate and V3 rotation, and matches the release checksums. Signing-tool checks cover APIs 28, 32, 33, and 36. Verification also covers 45 runtime files, 207 PDF.js files, and 92 embedded reader sources. The legacy identity has only the installed-data capability; rollback and other trust capabilities are disabled.

The successful application run includes 276 reader tests, 109 Android tests in 25 suites, ten browser checks, and five publication/signing checks. This documentation update does not create a new application version.

## Limits and ongoing maintenance

This is a disclosure and release-configuration review, not a comprehensive application security audit or a guarantee that all possible secrets or vulnerabilities have been found. Gitleaks alerts were reviewed rather than blindly suppressed; publicly inherited service identifiers are distinguished from private Motero credentials.

Physical-device installation, data migration, BOOX keyboard behavior, and live account synchronization remain outside the automated evidence. Back up app data before migrating from the earlier signing key.

Keep the private signing backup secure. Do not re-publish legacy development-signed APKs. Review new files, dependencies, tags and release attachments before future distribution. See [SECURITY.md](../SECURITY.md) and [RELEASING.md](RELEASING.md).
