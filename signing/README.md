# Öffentliche Signierinformationen

Dieser Ordner enthält ausschließlich das öffentliche X.509-Zertifikat, seinen SHA-256-Fingerabdruck und den öffentlichen Nachweis der Zertifikatsrotation. Der private Schlüssel und seine Passwörter dürfen hier niemals liegen.

`release-policy.json` bindet öffentliche APKs an den eigenen Motero-Schlüssel, Android API 28+ und APK Signature Scheme v3. Die alte Testidentität darf vorhandene App-Daten an die neue Identität übergeben; Shared-UID-, Signature-Permission-, Authenticator- und Rollback-Vertrauen zum alten öffentlichen Testschlüssel werden nicht weitergegeben.

Die CI veröffentlicht ohne das Repository-Secret `MOTERO_RELEASE_SIGNING` keine APK. Eine neue Signieridentität darf nicht ohne geplante Rotation generiert werden. Der Besitzer muss die private Sicherung unabhängig von der Cloud und von GitHub verwahren.
