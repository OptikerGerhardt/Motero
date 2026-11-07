# Security

## Reporting a vulnerability

Use GitHub's **Report a vulnerability** option when it is available. Do not include credentials, signing keys, personal PDFs, or account data in public issues. If private reporting is unavailable, open an issue asking for a private reporting channel without disclosing the vulnerability or sensitive data.

## Release signing

Release APKs from Build 306 onward require Android 9/API 28 or later. They are not debuggable and are signed with the private Motero identity pinned in [signing/release-policy.json](signing/release-policy.json). Verification checks the certificate, APK Signature Scheme v3, package and version, signing-key rotation, bundled runtime and PDF.js hashes, and embedded reader sources.

GitHub Actions stores signing material in the repository secret `MOTERO_RELEASE_SIGNING`. Only the release job for `main` receives that secret. Missing or incorrect signing material stops publication. Pull-request builds receive no private signing key. The [signing/](signing/) directory contains only public verification information.

The maintainer must keep a separate, secure backup of the private key. Never commit that backup or attach it to a release.

## Earlier development builds

Earlier Motero test APKs used Zotero's publicly available Android development key. Those releases are archived as drafts and are not offered as production downloads. The old CI artifact containing a development-signed APK was removed after its contents were preserved privately.

The application ID remains `org.zotero.android.debug`. A signed rotation proof supports migration from the earlier key on Android 9+. The old key retains only the installed-data capability; it has no rollback, shared-UID, signature-permission, or authenticator capability in the new lineage. This prevents that old identity from authorizing a rollback of the migrated installation under Android's signing checks.

Signing-tool checks cover APIs 28, 32, 33, and 36. Installation and data migration on physical BOOX and GrapheneOS devices still need verification. Back up app data before the first migration. Android 6–8 are not supported by these release APKs.

The tracked `debug.keystore` and a historical temporary keystore are byte-identical public Zotero upstream files. Their exact hashes are documented in [scripts/publication-exceptions.json](scripts/publication-exceptions.json). They are permitted only as development fixtures and are rejected as production signers.

## Scope of publication checks

[The publication review](docs/PUBLICATION_READINESS.md) records checks for accidental credential or document disclosure, licensing notices, and release configuration. These checks do not constitute a comprehensive application vulnerability assessment.
