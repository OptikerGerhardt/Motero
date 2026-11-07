# APK-Releases

Die Sichtbarkeit bleibt privat, bis der Betreiber sie ausdrücklich ändert. Ein Release ändert die Repository-Sichtbarkeit nicht. Die bisherigen Test-Releases bleiben als Entwürfe archiviert; sie dürfen nicht als sichere öffentliche APKs angeboten werden.

## Einmalige private Signierung einrichten

Der öffentliche Prüf-Schlüssel und die Rotationslinie liegen in `signing/`. Der dazugehörige private Schlüssel wurde außerhalb des Repositorys erzeugt. Er muss dauerhaft und sicher gesichert werden: Ohne ihn können zukünftige Updates nicht mit derselben Identität veröffentlicht werden. Private Sicherungsarchive und Secret-JSON niemals committen, in Releases hochladen oder in Issues/Chat kopieren.

1. Auf GitHub das Repository öffnen → **Settings → Secrets and variables → Actions → New repository secret**.
2. Name: **`MOTERO_RELEASE_SIGNING`**. Als Wert den vollständigen Inhalt der privaten Datei `MOTERO_RELEASE_SIGNING.json` einfügen. Speichern. Die Datei enthält `keystore_base64`, `store_password`, `key_password` und `key_alias`.
3. Unter **Actions → Motero build, test and release → Run workflow** auf `main` starten. Eine vorhandene fehlgeschlagene Ausführung kann ebenfalls erneut ausgeführt werden, sofern sie den aktuellen Quellstand verwendet.

Die aktuelle Chat-GitHub-Verbindung darf die Actions-Secrets-API nicht verwenden (HTTP 403). Deshalb muss der Besitzer diesen einen Einrichtungsschritt auf GitHub ausführen. Der private Sicherungsdownload wird separat bereitgestellt; er ist kein Repository-Inhalt.

## Automatischer Ablauf

1. Reader-Änderungen im Submodul committen und in den Branch `reader` dieses Repositorys pushen. Danach den Submodulstand und Android-Änderungen auf `main` übernehmen.
2. Bei Produktänderungen `BuildConfig.versionCode` erhöhen und Changelog/Featureplan aktualisieren. Fokusierte Commits nach `main` pushen.
3. Der Build-Job erhält keine Signiersecrets. Er prüft die Quellhistorie, baut den Reader, führt Reader-, native Release- und Browserprüfungen aus und baut eine **unsignierte, nicht installierbare** Release-APK. Negativtests prüfen den Abbruch bei fehlendem Schlüssel und die Zurückweisung des alten öffentlichen Schlüssels. Ein Quellarchiv einschließlich initialisierter Submodule wird ebenfalls geprüft.
4. Nur der Release-Job für vertrauenswürdiges `main` erhält das Secret. Er signiert mit der festgeschriebenen Motero-Identität und prüft Version, Paket, nicht debuggbaren Manifestzustand, Android 9+, V3-Rotation, die eingeschränkten Rechte des alten Signierers sowie Runtime-/PDF.js-Hashes und eingebettete Reader-Quellen.
5. Nach finaler Prüfung wird die unsignierte Eingabe entfernt. Der neue Tag `v1.0.0-<Buildnummer>` und der Release enthalten ausschließlich die sichere APK, vollständige Quellen, Nachweise und `SHA256SUMS.txt`. Ein fehlendes oder falsches Secret stoppt die Veröffentlichung. Es gibt keinen Debug-Fallback.

Pull Requests veröffentlichen nichts und erhalten keinen privaten Signierschlüssel. Dokumentationsänderungen überschreiben keine vorhandenen Releases. Produktänderungen ohne höhere Buildnummer werden abgewiesen. Bestehende Tags oder Assets werden nie per Force-Push oder `--clobber` ersetzt. Die Actions sind auf Commit-SHAs festgeschrieben; der Release-Job benötigt `contents: write`, der Build-Job nur `contents: read`.

## Lokaler öffentlicher Build

Mit initialisierten Submodulen, JDK 17, dem dokumentierten SDK und den vorbereiteten Reader-Assets:

```sh
./gradlew :app:testDevReleaseUnitTest :app:assembleDevRelease -PmoteroPublicRelease=true --init-script scripts/test_jvm_agent.gradle --no-build-cache
python3 scripts/sign_release.py --apk app/build/outputs/apk/dev/release/app-dev-release-unsigned.apk --output /tmp/Motero_Build306.apk --build-tools "$ANDROID_HOME/build-tools/36.0.0" --secret-file /sicherer/privater/Pfad/MOTERO_RELEASE_SIGNING.json
python3 scripts/prepare_release.py --apk /tmp/Motero_Build306.apk --output dist --build-tools "$ANDROID_HOME/build-tools/36.0.0"
```

Buildnummer jeweils anpassen. `--secret-file` ist ausschließlich für die lokale private Einrichtung; CI liest das Secret aus ihrer Umgebung. Quellarchive enthalten Git-Dateien samt Submodulen, keine `.git`-Verzeichnisse oder unversionierten privaten Dateien. `debug.keystore` ist die nachgewiesene öffentliche Upstream-Testdatei und darf nur für Entwicklungs- und Negativtests verwendet werden.

Android-9+-Zertifikatsrotation ist technisch geprüft; die Installation und Datenübernahme auf dem konkreten BOOX-/GrapheneOS-Gerät ist noch zu erproben. Vor dem ersten Wechsel eigene Daten sichern. Der bekannte alte Schlüssel hat nach dem Wechsel keine Rollback-Berechtigung. Ältere `verify_reader_update.py`-Berichte bis Build 305 dokumentieren denselben Testschlüssel und sind kein Beleg für diese neue Rotation.
