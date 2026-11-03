# Motero auf BOOX: Build 302

## Als Update installieren

Die APK über die vorhandene Motero-Testversion installieren, vorher nicht deinstallieren. Paketkennung `org.zotero.android.debug`, Version `1.0.0-302`, Versionscode 302. Debug-Schlüssel, Speicherpfade, Kontodaten, Realm-/Syncformat und Einstellungen bleiben erhalten. Die technische APK-Prüfung vergleicht Identität, Signatur, Versionsanstieg und ZIP-Ausrichtung gegen Build 301.

## Neue Funktionen

Direktes Wortmarkieren schließt physisch angehängte Schlusszeichen ein. Die Auswahl überschreitet dabei keine echten Leerzeichen, Zeilen-, Rotations- oder Textflussgrenzen. Nur der direkte Markiermodus nutzt diese Ergänzung; die normale Android-/Desktop-Auswahl bleibt unverändert.

Eine kleine Lupe zeigt während des Ziehens den Inhalt unter dem Finger, die Auswahl und einen Positionsstrich. Sie verwendet einen Ausschnitt des bereits gerenderten Canvas, höchstens einen Paint je Eingabeframe und keine neue PDF-Analyse. Sie liegt normalerweise über dem Finger; nahe der oberen Bildschirmkante weicht sie nach unten aus. Loslassen und Abbrechen entfernen sie, ebenso Mehrfinger-Gesten und Fenster-/Dokumentwechsel.

Die Schnellpalette hat drei gleich breite Touchflächen: Highlight, mittiges abgerundetes X zum Löschen, Underline. Farben, Themen, Symbole und die übrige zurückhaltende Zotero-Gestaltung bleiben erhalten. Das Löschen geht durch den normalen Annotationsmanager und dessen Sync-/Undo-Wege. Pointer- und Auswahlzustand werden bereinigt.

Langes Drücken auf eine bearbeitbare Annotation öffnet die Palette erneut. Notizen können ebenfalls schnell umgefärbt/gelöscht werden; ungeeignete Typwechsel sind deaktiviert. Native Größen-/Auswahlgriffe und Transformationen bereits ausgewählter Notizen, Ink- und Textobjekte haben Vorrang. Normales Antippen behält das ausführliche Annotationsfenster; schreibgeschützte oder externe Annotationen bleiben geschützt.

Im Info-/Eintragsdetailfenster öffnet langes Drücken auf einen Dateianhang zusätzlich `Share Document` / `Dokument teilen`. Fehlende Downloads werden über den vorhandenen Downloader nachgeladen. Anschließend öffnet die Android-Teilenansicht mit passendem MIME-Typ, einem FileProvider-URI in EXTRA_STREAM und ClipData sowie vorübergehender Leseberechtigung. Es wird kein Schreibzugriff erteilt. PDF und EPUB sind ausdrücklich abgedeckt; andere Dateien behalten ihren Dateityp. Kein neuer Knopf in der Floating Toolbar.

Geteilt wird die gespeicherte Originaldatei. Separat gespeicherte Zotero-Markierungen werden nicht zusätzlich eingebettet. Eine spätere Exportoption mit eingebetteten PDF-Annotationen kann ihren erzeugten Export an denselben Teilen-Endpunkt übergeben. Die Originaldatei und die Datenbank werden durch das Teilen nicht verändert.

Das Annotationsfenster malt seine Material-Fläche vor der Systemleisten-/Aussparungs-Polsterung und auch während des Ladens. Die obere Fläche entspricht dadurch dem Hintergrund des Fensters, statt die PDF durchscheinen zu lassen. Die tatsächliche Displayaussparung und Teilenansicht müssen am physischen Gerät geprüft werden; beides wird hier nicht als Gerätetest behauptet.

## Recherche, Erhalt und Prüfung

[Zotero Android PR #205](https://github.com/zotero/zotero-android/pull/205) beschreibt das Teilen heruntergeladener Anhänge per langem Druck in den Eintragsdetails. Am 3. November 2026 war er geschlossen und ungemergt. Die aktuelle eigene Implementierung nutzt den vorhandenen Downloader und AndroidX FileProvider und führt keine PDF-SDK-Abhängigkeit ein.

PSPDFKit/Nutrient bleibt vollständig entfernt. PDF.js selbst und die übrigen Laufzeitpakete bleiben bytegleich zu Build 301. Die Zuschnitt-/Randreferenzlogik, vier Fits, Wrapped, SmartScroll, Bookmarks, Kommentare/Tags, Quick Tags, Lesekante, schwebende Leisten und Vollbild behalten ihre Regressionstests. F19 Autocomplete, F22 manuelles Zuschneiden All/Odd/Even und F23 Randtippen bleiben offen.

BUILD_STATUS.md, BUILD_VERIFICATION.json und qa/ enthalten die abschließenden Testzahlen und Hashwerte. Die neuen Browserfälle prüfen Punkt/Satzende, tatsächliche Canvas-Lupenpixel einschließlich Auswahl, drei gleich breite Touchflächen, reguläres Löschen, langes Drücken in beiden Auswahlmodi, Notizfarben, erhaltene Notizbewegung und Abbruch mit mehreren Fingern. Native JVM-Tests ergänzen MIME-Typen und die Beschränkung auf Leseberechtigung. Keine physische BOOX-/E-Ink-/Kontosyncprüfung.

## Neubau

Das Quellarchiv enthält Android-/Reader-Quellen, beide Git-Bundles, Laufzeitpakete und den bisherigen Debug-Schlüssel. SDK/JDK, node_modules, Build-Caches, APK, private Release-Schlüssel, Original-PDFs und interne Screenshots sind ausgeschlossen.

JDK 17, Android Platform 37.0 Revision 2, Build Tools 36.0.0, Gradle 9.6.1 und Node/npm verwenden. Reader-Submodule initialisieren. Den unveränderten `pdf`-Ordner aus `app/src/main/assets/reader/reader.zip` nach `reader/build/mobile/pdf` und `reader/build/android/pdf` übernehmen. Im Reader `npm ci`, `npx webpack --config-name android`, `npm test`; anschließend im Android-Projekt `python3 scripts/package_reader_assets.py`. PDF.js nicht unnötig neu bauen.

Die sechs Browserprüfungen liegen unter `reader/scripts/test-boox-{browser,features,fitting,stability,reader-controls,annotation-tools}.cjs`. Playwright und ein Chromium verwenden. `BOOX_TEST_BROWSER` gibt optional den Browserpfad an; `BOOX_HOEFFE_PDF` und `BOOX_KANT_PDF` verweisen auf die Original-Testdateien. Optionale interne Bilder werden nur bei `BOOX_QA_IMAGES` erzeugt und nicht ausgeliefert.

Android: `./gradlew :app:testDevDebugUnitTest :app:assembleDevDebug --no-build-cache`. Bei Umgebungen ohne Attach: `--init-script scripts/test_jvm_agent.gradle` lädt ByteBuddy nur in der Test-JVM vor, nicht in der App.

Audit: `python3 scripts/audit_pdf_engine_removal.py --base-source <entpackte-301-Quellen> --annotation-tools --output qa/sdk-removal-audit.json`.

APK: `python3 scripts/verify_boox_update.py --base <301.apk> --apk <302.apk> --build-tools <SDK/build-tools/36.0.0> --qa-directory qa --label Motero --fitting-update --reader-polish --motero-refinement --reader-controls --roman-references --without-pspdfkit --annotation-tools`. Eingebettete Quellen/CSS, übrige Laufzeitdateien/PDF.js, SDK-Freiheit, neue Prüfungen und Update-Identität werden gemeinsam geprüft.
