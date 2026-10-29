# Zotero BOOX: Build 293

## Installation als Update

Die neue APK über die installierte Testversion installieren. Vorher nicht deinstallieren.
Paketkennung: `org.zotero.android.debug`. Version: `1.0.0-293`, Versionscode 293; zuvor 292.
Derselbe im Projekt enthaltene Debug-Signierschlüssel wird weiterverwendet. Damit erfüllt die APK die Android-Voraussetzungen für ein Update mit Erhalt der vorhandenen App-Daten, Anmeldung und Einstellungen. Die offizielle Zotero-App wird dadurch nicht ersetzt.

## Enthaltene Änderungen

| Feature | Bedienung / Verhalten |
|---|---|
| F01 | Beim Vor-/Zurückblättern in Wrapped und vertikal bleiben Zoom und horizontaler Ausschnitt erhalten. |
| F02 | In der herausgezoomten Wrapped-Übersicht eine Seite kurz antippen, um zum Lesezoom auf dieser Seite zurückzukehren. Wrapped bleibt aktiv. Manueller Zoom, Inhaltsanpassung und Seitenbreite werden berücksichtigt. |
| F05 | Die Farbauswahl zum Filtern steht direkt unten in der Annotations-Seitenleiste. Mehrere Farben sind kombinierbar. Der Tags-Knopf öffnet die Tag-Filterung und erhält die Farbauswahl. Auf schmalen Seitenleisten ist die Farbreihe scrollbar. |
| F06 | Obere Leiste, Zeichnen-Leiste und untere Seitennavigation verwenden denselben Sichtbarkeitszustand. Lange Markiergesten und Pinch lösen kein automatisches Verstecken durch die rohe Bewegungserkennung aus. |
| F16 | Nach Halten, Ziehen und Loslassen erscheint eine kleine Farbbox unter bzw. über der Markierung. Farbtipp ändert dieselbe Annotation. |
| F17 | Nach Tastenscrollen und Wischen zeigt eine graue gestrichelte Linie die vorherige Bildkante. Sie ist an der PDF-Stelle verankert und wird nicht in der PDF gespeichert. |
| F18 | Oben rechts im Lesebereich, mit Abstand zum äußeren Blätterrand, kurz tippen: graue Haftnotiz mit Datum/Uhrzeit. Derselbe Bereich erneut erzeugt keine doppelte Notiz an derselben Stelle. Vorhandene Haftnotizen lassen sich normal öffnen und löschen. Mehrere Lesestände sind möglich. |
| F20 | Im Highlight-Fenster stehen die konfigurierten farbigen Tags als farbige Hashtags direkt unter der Highlight-Farbauswahl. Tippen schaltet die Zuordnung um; längeres Drücken zeigt den Namen. Die vollständige Tag-Auswahl steht darunter. |
| F21 | Das Highlight-Fenster zeigt den markierten Originaltext oben in einem eigenen, bei langen Zitaten scrollbar bleibenden Bereich. Der eigene Kommentar bleibt separat. |

Die bisherigen Funktionen für direktes Markieren und SmartScroll bleiben enthalten. Andere Ideen der Featureliste, darunter F19 Tag-Autocomplete, sind nicht Bestandteil dieses Builds.

## Prüfungen

206 Reader-Tests und 6 Android-Logiktests bestanden. Browserprüfungen verwenden echtes PDF-Rendering und Touch-/Stift-Ereignisse. Geprüft wurden Pan-Erhalt in beiden Richtungen und beiden Layouts, Fit to Content an den Körperseiten der Mul-PDF, Lesekante vorwärts/rückwärts und nach Wischen, Farbbox ohne doppelte Annotation, datierte Notizen mit Wiederherstellung/Löschen sowie Wrapped-Rückkehr mit manuellem Zoom, Seitenbreite und Fit to Content. Der Ausgangsfehler mit 106 Pixeln horizontalem Ausschnitt endet nun wieder bei 106 statt 0 Pixeln.

Ein vollständiger Android-Neubau war erfolgreich. Beim nachfolgenden inkrementellen DEX-Schritt trat ein Konflikt in gecachten generierten Backport-Klassen auf. Die generierten Projekt-DEX-Dateien wurden entfernt und ohne Build-Cache neu erzeugt; der abschließende Build war erfolgreich. Es wurden keine Compiler-Prüfungen übersprungen. Sämtliche unveränderten Laufzeitpakete und nativen Bibliotheken sind bytegleich zur bisherigen APK. Der eingebettete Reader wurde anhand seiner Source-Map mit den geprüften Quelldateien verglichen.

Es ist kein physischer BOOX angeschlossen. Installation, Erhalt des konkreten Geräte-Logins, native Fensterdarstellung und E-Ink-Reaktion müssen deshalb am Gerät erprobt werden. Die Browser-Touchsimulation bestätigt weiterhin die Übergabe von Multitouch an PDF.js, beweist aber keine echte Pinch-Skalenänderung auf dem Zielgerät. Die Haftnotizen nutzen den vorhandenen Zotero-Annotations-Sync; ein echter Android-/Desktop-Sync mit dem Konto wurde hier nicht ausgeführt.

## Quellcode und Neubau

Das Archiv enthält einen lesbaren Snapshot und vollständige Git-Bundles für Android und Reader. Vorgebaute Laufzeitpakete liegen unter `app/src/main/assets`; sie stammen außer dem neu gebauten Reader unverändert aus Build 292. Die Original-Mul-PDF und Build-Caches sind nicht im Archiv enthalten.

Voraussetzungen: JDK 17, Node/npm, Python 3 sowie Android SDK Platform 37.0 und Build Tools 36.0.0. SDK über Android Studio oder `local.properties` eintragen.

```bash
git clone -b boox-smart-scroll zotero-android.bundle zotero-boox
git clone -b boox-smart-scroll reader.bundle zotero-boox/reader
cd zotero-boox
bash scripts/build_boox_debug.sh --max-workers=1 --no-parallel --no-build-cache
```

Für reine Änderungen am Reader kann das unveränderte PDF.js aus dem bereits vorhandenen `app/src/main/assets/reader/reader.zip` nach `reader/build/mobile/pdf` übernommen und anschließend direkt `npx webpack --config-name android` ausgeführt werden. `python3 scripts/package_reader_assets.py` verpackt den fertigen Reader samt Hash. Danach `:app:assembleDevDebug` aufrufen. Die Android-App selbst muss bei Änderungen der nativen Oberfläche neu kompiliert werden.

Prüfskripte: `reader/scripts/test-boox-browser.cjs`, `reader/scripts/test-boox-features.cjs` und `scripts/verify_boox_update.py`. Das optionale `BOOX_PROBLEM_PDF` verweist für den Regressionstest auf die lokale Mul-PDF. `BOOX_TEST_BROWSER` kann auf eine vorhandene Chromium-Binärdatei zeigen. Playwright muss verfügbar sein.
