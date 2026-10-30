# Motero auf BOOX: Build 295

## Installation als Update

Die APK über die installierte Testversion installieren. Vorher nicht deinstallieren.
Paketkennung: `org.zotero.android.debug`. Version: `1.0.0-295`, Versionscode 295; zuvor 294.
Derselbe Debug-Signierschlüssel wird weiterverwendet. Paketkennung, Zertifikat und höherer Versionscode werden direkt gegen die bisherige APK geprüft. Datenbank, gespeicherte Konten und Reader-Einstellungen verwenden ihre bisherigen Speicherpfade. Die offizielle Zotero-App wird durch diese Testversion nicht ersetzt.

## Änderungen in Build 295

Der sichtbare Android-App-Name lautet jetzt **Motero**. Paketkennung und Signierschlüssel bleiben gleich.

Die Quick-Tag-Reihe reicht jetzt links und rechts jeweils einen halben Mittelpunktabstand über die äußerste Highlight-Farbe hinaus. Bei den vorhandenen gleichmäßig verteilten Farbkreisen entspricht dies einem halben äußeren Zwischenraum zum Fensterrand. Die Grenze orientiert sich damit an den Farbplätzen, nicht an der Kreisaußenkante. Alle bis zu neun Tags bleiben sichtbar und mittig verteilt.

Nach einer Farbwahl in der kleinen Palette öffnet bereits der erste folgende Tipp auf das Highlight das Annotationsfenster. Ursache war der globale Pointer-Capture-Handler: Er registrierte den Tastendruck auf der Palette als begonnenen PDF-Vorgang, während das Loslassen von der Palette abgefangen wurde. Die nächste Berührung wurde deshalb nur zum Aufräumen dieses Zustands verbraucht. Android-Paletteneingaben werden jetzt vor dem Beginn einer PDF-Aktion erkannt. Browserprüfungen decken sowohl Mausklick-/Kompatibilitätsereignisse als auch echte Touch-Eingaben ab. Zusätzlich prüft ein Reader-Unit-Test Touch, Stift und mousedown auf der Palette.

## Weiterhin enthaltene Nachbesserungen aus Build 294

| Bereich | Verhalten |
|---|---|
| Done / Schließen | Die gerade bearbeitete Annotation wird in Android und Reader abgewählt und kann anschließend unmittelbar wieder angetippt werden. Ein verspätetes Schließereignis eines anderen Highlights lässt eine neuere Auswahl bestehen. Kommentare werden vorher über den bisherigen Speicherpfad weitergegeben. |
| Quick Tags | Ohne Überschrift, mit denselben Formular-Trennlinien und Abständen wie bei Add Tags. Bis zu neun Felder bleiben in einer zentrierten Reihe zwischen den halben Mittelpunktabständen jenseits der äußersten Farben sichtbar. Sie sind 48 dp hoch; ihre Breite passt sich dem Fenster an. |
| Originaltext | Ohne Überschrift und Kasten als eingerücktes Blockzitat mit vertikalem Balken zwischen denselben Trennlinien. Kurze Texte bleiben kompakt; lange Texte bleiben scrollbar und kopierbar. |
| Lesekante F17 | Die graue gestrichelte Linie hat 50 % Deckkraft und fängt keine Eingaben ab. |
| Bookmarks F18 | Die rechte Hälfte des oberen Elftels des Reader-Bereichs ist die Touchfläche bis einschließlich äußerem rechtem Rand. Dort hat das Lesezeichen Vorrang vor dem Blättern. Neue Marker sitzen unabhängig vom Tipppunkt und Zoom oben rechts auf der PDF-Seite, auch bei gedrehten Seiten. |

Die feste Bookmark-Position liegt etwa 1 cm vom rechten Papierrand und 4 PDF-Punkte unter dem oberen Rand. Ihr sichtbarer Abstand skaliert mit dem PDF-Zoom. Ein vorhandenes datiertes Lesezeichen derselben Seite wird geöffnet; vorhandene Marker werden nicht nachträglich verschoben. Andere graue Haftnotizen bleiben normale Notizen. In der Wrapped-Übersicht hat weiterhin die Seitenauswahl Vorrang. Vorhandene Annotationen und Links behalten ihre normale Bedienung. Wischen, langes Markieren, Pinch und aktive Zeichenwerkzeuge erzeugen über diesen Shortcut keine Notizen.

Alle neun Funktionen aus Build 293 bleiben enthalten: F01/F02 Navigation und Wrapped-Seitenauswahl, F05 Farb-/Tagfilter, F06 gekoppelte Leisten, F16 unmittelbare Farbpalette, F17 Lesekante, F18 Notiz-Lesezeichen und F20/F21 Tag-Schnellwahl und Originaltext im Annotationsfenster.

## Bewusst zurückgestellt

Fit to Content, Fit to Width, Randgrößen und eine gesonderte Ausrichtung gerader/ungerader Seiten sind unverändert. Die bisherige Stichprobe über bis zu acht Seiten des ganzen Dokuments bleibt bestehen. Die mittlere Stichprobe und getrennte horizontale Ausrichtungen wurden noch nicht eingebaut. Der Verifikationslauf mit `--preserve-fitting` vergleicht die unveränderten Anpassungsfunktionen und alle PDF.js-Dateien direkt mit der bisherigen APK.

F19 Tag-Autocomplete und andere nicht beauftragte Backlog-Punkte wurden nicht ergänzt.

## Prüfungen und Grenzen

Die aktuellen Ergebnisse und APK-Metadaten stehen in `BUILD_STATUS.md` und `BUILD_VERIFICATION.json`; die Protokolle liegen unter `qa/`.

Die Reader-Prüfungen verwenden echtes PDF-Rendering mit Finger-/Stift-Ereignissen. Zusätzlich zu den bisherigen Gesten prüfen sie 50 % Deckkraft, Auswahl löschen und erneut öffnen, wiederholtes Bookmark-Tippen, feste Position bei geändertem Tipppunkt/Zoom, den rechten Blätterrand, gedrehte PDF-Seiten sowie Wiederherstellen und normales Löschen. Wrapped-Rückkehr bleibt für manuellen Zoom, Inhaltsanpassung, Seitenbreite und manuelles Zoomen bei gespeicherter Inhaltsanpassung geprüft. Die aktuelle Runde verwendet eigene Fixture-PDFs; die frühere Mul-PDF-Diagnose wird nicht als neuer Test behauptet.

Es ist kein physischer BOOX angeschlossen. Native Fensterdarstellung, konkreter Geräte-Login nach Installation und E-Ink-Wirkung sind hier nicht am Zielgerät geprüft. Die native Oberfläche wird kompiliert; die Android-Logiktests werden ausgeführt. Die Browserprüfung bestätigt die Übergabe von Multitouch an PDF.js, beweist aber keine echte Pinch-Skalenänderung auf dem Zielgerät. Ein echter Android-/Desktop-Sync mit dem Konto wurde hier nicht ausgeführt.

## Quellcode und Neubau

Das Archiv enthält einen lesbaren Snapshot und vollständige Git-Bundles für Android und Reader. Die vollständigen Laufzeitpakete liegen unter `app/src/main/assets`; alle Dateien außer Reader-ZIP und Reader-Hash müssen bytegleich zur bisherigen APK bleiben. Original-Mul-PDF, Build-Caches, SDK und JDK sind nicht im Archiv enthalten.

Voraussetzungen: JDK 17, Node/npm, Python 3, Android SDK Platform 37.0 und Build Tools 36.0.0. SDK über Android Studio oder `local.properties` eintragen.

```bash
git clone -b boox-smart-scroll zotero-android.bundle zotero-boox
git clone -b boox-smart-scroll reader.bundle zotero-boox/reader
cd zotero-boox
bash scripts/build_boox_debug.sh --max-workers=2 --no-parallel --no-build-cache
```

Für reine Reader-Änderungen das unveränderte PDF.js aus `app/src/main/assets/reader/reader.zip` nach `reader/build/mobile/pdf` übernehmen. Im Reader `npm ci` und `./node_modules/.bin/webpack --config-name android` ausführen. `python3 scripts/package_reader_assets.py` verpackt den Reader samt Hash; danach `:app:assembleDevDebug` aufrufen. Native Änderungen erfordern deren Kompilierung.

Prüfskripte: `reader/scripts/test-boox-browser.cjs`, `reader/scripts/test-boox-features.cjs` und `scripts/verify_boox_update.py`. `BOOX_TEST_BROWSER` kann auf eine vorhandene Chromium-Binärdatei zeigen. Playwright muss verfügbar sein. Der APK-Vergleich benötigt `--base`, `--apk`, `--build-tools`, optional `--qa-directory` und für dieses Update `--preserve-fitting`.
