# Public signing information

This directory contains only the public X.509 certificate, its SHA-256 fingerprint, and the public signing-key rotation proof. The private key and passwords must never be stored here.

`release-policy.json` pins release APKs to the Motero certificate, Android API 28+, and APK Signature Scheme v3. The legacy development identity retains only the installed-data capability for migration. It has no shared-UID, signature-permission, authenticator, or rollback capability in the new lineage.

CI requires the repository secret `MOTERO_RELEASE_SIGNING` before publishing an APK. The maintainer must keep a secure private backup independent of GitHub. Changes to the signing identity require a planned rotation. See [the release guide](../docs/RELEASING.md).
