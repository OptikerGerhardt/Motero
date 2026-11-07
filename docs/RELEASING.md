# APK-Releases

Das Repository bleibt privat. GitHub-Releases ändern die Sichtbarkeit nicht.

1. Reader-Änderungen im Submodul committen und in den Branch `reader` dieses Repositorys pushen.
2. Auf `main` den neuen Submodulstand und die Android-Änderungen übernehmen.
3. `buildSrc/src/main/kotlin/BuildConfig.kt`: `versionCode` auf eine noch nicht veröffentlichte, höhere Nummer setzen. `CHANGELOG.md` und `FEATUREPLAN.md` aktualisieren.
4. Zusammenhängende Commits nach `main` pushen. Der Workflow baut APK und Quellarchiv und führt Reader-, Android- und Browserprüfungen aus.
5. Bei erfolgreichem neuen Build entsteht der Tag `v1.0.0-<Buildnummer>` und ein Release mit `Motero_Build<Nummer>.apk`, vollständigem Quellarchiv, Prüfnachweisen und `SHA256SUMS.txt`.

Pull Requests veröffentlichen nichts. Dokumentationsänderungen an einem bereits veröffentlichten Build überschreiben keinen Release. Produktänderungen ohne höhere Buildnummer werden beim Release-Metadatencheck abgewiesen. Ein bestehender Tag oder Release wird nie mit `--clobber` oder Force-Push ersetzt.

Der Workflow kann im Actions-Reiter auch manuell gestartet werden. Voraussetzung ist, dass GitHub Actions für das Repository aktiviert ist und die GitHub-Verbindung Workflow-Dateien schreiben darf. Der Veröffentlichungsjob benötigt `contents: write`; private Zusatzsecrets werden für die bestehenden Test-APKs nicht benötigt.

Die APK verwendet weiterhin den öffentlichen Zotero-Testschlüssel, damit die bisherige Motero-Testversion aktualisierbar bleibt. Eine Produktionssignierung wäre eine gesonderte Migration, siehe `SECURITY.md`.

## Lokale Veröffentlichung

Nach erfolgreichen Tests und einem Commit auf `main`:

```sh
python3 scripts/prepare_release.py --apk app/build/outputs/apk/dev/debug/app-dev-debug.apk --output dist
python3 scripts/verify_release.py --apk dist/Motero_Build305.apk --build-tools "$ANDROID_HOME/build-tools/36.0.0"
gh release create v1.0.0-305 dist/* --repo OptikerGerhardt/Motero --target main --title 'Motero 1.0.0-305' --notes-file dist/RELEASE_NOTES.md --latest
```

Dateinamen und Tag jeweils aus der aktuellen Buildnummer verwenden. Der Quellpacker nimmt Git-Dateien einschließlich initialisierter Submodule auf, keine `.git`-Verzeichnisse, Caches, persönlichen PDFs oder zusätzlichen lokalen Dateien. Die mitgelieferte öffentliche Debug-Datei ist absichtlich Teil der Quellen.

Build 305 wurde aus dem bereits lokal geprüften APK-Artefakt veröffentlicht. Die nachträglichen GitHub-/Dokumentationsänderungen ändern keinen Anwendungscode. Der konkrete Tag benennt den zugehörigen Android- und Reader-Quellstand.
