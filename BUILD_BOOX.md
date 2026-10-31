# Motero auf BOOX: Build 299

## Als Update installieren

Die APK über die vorhandene Motero-Testversion installieren, vorher nicht deinstallieren. Paketkennung `org.zotero.android.debug`, Version `1.0.0-299`, Versionscode 299. Der enthaltene Debug-Schlüssel bleibt derselbe wie bei Build 298. Die technische Update-Prüfung vergleicht Paketkennung, Zertifikat, Versionsanstieg, v2-Signatur und ZIP-Ausrichtung einschließlich 16-KiB-Nativbibliotheken. Installation und Login an einem physischen BOOX sind hier nicht geprüft.

## Neu

Bei geöffneter Sidebar hat die obere Leiste wieder einen durchgehenden, undurchsichtigen Hintergrund. Die schwebenden Gruppen werden bei geschlossener Sidebar verwendet. Die PDF-Fläche behält ihre Geometrie beim Ein-/Ausblenden der Leisten.

Ein erster kurzer PDF-Tipp blendet sichtbare Leisten aus und öffnet keine Markierung oder Verknüpfung. Der folgende Tipp kann die Annotation öffnen. Eine eigene Ausblenden-Nachricht verhindert, dass eine verzögerte Android-Rückmeldung die Leisten wieder öffnet. Langes direktes Markieren behält seine 450-ms-Erkennung; Scrollen und mehrere Finger werden weitergegeben. Eingabefelder und die Farbpalette behalten ihre Bedienung.

Fit to Width bietet `PDF page`, `Text`, `Text + crop`. Die dritte Variante hat denselben ausschließlich von der Breite bestimmten Zoom wie `Text`, blendet aber äußeres Papier oben/unten aus. Lange Textseiten bleiben vertikal scrollbar. SmartScroll überspringt in dieser Variante die ausgeblendeten Papierstreifen. Bei `Text` und `PDF page` bleibt die ganze Papierhöhe erreichbar.

Eine eigene Auswahl `Line and edition references → Exclude / Include` gilt für Content und den Textbezug der Achsenfits, unabhängig von None/Small/Medium/Large. Fußnoten einschließlich Verweiszeichen bleiben Inhalt. Die Rahmen mit und ohne Randreferenzen werden gemeinsam gecacht. Bei Exclude verdeckt die reine Anzeigeebene erkannte Randreferenzen unterhalb der normalen Annotationen, damit auch bei größeren Margins oder außenstehenden Fußnotenmarkern keine halben Zahlen sichtbar bleiben. Papierfarbe und Drehung werden berücksichtigt. PDF-Datei und gespeicherte Annotationskoordinaten bleiben unverändert.

In Höffes Klassiker-Auslegen-Datei blieb nach dem Entfernen der Kopftexte ein grafischer Trennstrich zwischen Seitenzahl und Autor übrig. Seine Kopfzeilenhöhe wird nur dann mit entfernt, wenn dort kein beizubehaltender Text überlappt. Bei Kant werden Randangaben vor dem Zusammenführen von Textspannen separat gehalten. Enthält ein einzelnes OCR-Objekt die letzte Silbe einer Textzeile und eine kleinere Zeilenzahl, trennen Zeichenposition und Grundlinie beide Bereiche. Hochgestellte Fußnotenmarker bleiben erhalten. Eckige Editionsreferenzen wie `[372]` werden erkannt. Gerade/ungerade Profile bleiben getrennt.

PSPDFKit/Nutrient bleibt enthalten. Seine Entfernung ist ausdrücklich als nächster eigener Schritt im Featureplan vorgemerkt; der aktive Reader verwendet weiterhin PDF.js.

## Bestehende Funktionen

Direktes Markieren mit Finger/Stift, Original-Zotero-Farben und Highlight-/Underline-Wahl über vollständig antippbare Palettenhälften; Kommentare und Tags bleiben bei Typwechsel erhalten. Quick Tags, Highlight-Zitat im Bearbeitungsfenster, kompakte Farbfilter, gekoppelte Leisten, Vollbild, Motero-M und Wrapped-Seitenübersicht bleiben enthalten. Die Lesekante hat 50 % Deckkraft.

Bookmarks sind gewöhnliche datierte graue Zotero-Notizen. Sie liegen rechts/oben im ungerandeten Inhaltsrahmen ohne Randreferenzen, unabhängig vom aktuellen Fit. Derselbe Shortcut öffnet den vorhandenen Bookmark. Andere und schreibgeschützte Notizen werden nicht versetzt.

| Hauptmodus | Zoom | Ansicht |
|---|---|---|
| Off | Manuell | Ganze PDF |
| Fit to Content | Breite und Höhe des Inhalts | Inhaltsrahmen mit Margin |
| Fit to Width | Nur Breite von PDF/Text | Ganze Höhe; bei Text + crop äußeres Papier oben/unten ausgeblendet |
| Fit to Height | Nur Höhe von PDF/Text | Ganze Breite bleibt horizontal erreichbar |

None / Small / Medium / Large entsprechen 0 / 1 / 4 / 8 % der kürzeren Lesefensterseite je Kante. Bis zu vier Seitenpaare aus der Dokumentmitte bestimmen getrennte Ausrichtung gerader/ungerader Seiten. Zusätzlich wird jede neu besuchte Seite analysiert, um breite Tabellen und tiefe Fußnoten zu erhalten. Bis zu 32 Seitenergebnisse werden gecacht. Unbekannte Formate, leere Seiten und Analysefehler fallen konservativ auf die ganze Seite zurück.

Bei Bild-PDFs ohne Textschicht wird die Tintenfläche verwendet. Neutralgraues Papier wird nur bei genügend textähnlichen Zeilenbändern normalisiert. Das ist keine OCR; semantische Randangaben in Scans können erhalten bleiben. Fotos und mehrdeutige Inhalte werden vorsichtig behandelt.

## Prüfung und Grenzen

250 Reader-Tests, native JVM-Tests und Browserprüfungen für Funktionen, Gesten, Fits, Stabilität und die neuen Reader-Bedienelemente. Die gelieferten Höffe-/Kant-PDFs werden konkret auf jeweils vier Seiten geprüft: Höffe 26/27 und 191/192; Kant 369/370 und 380/381. Höffes obere Kante liegt danach bei rund 9,76 % statt am Kopfstrich bei rund 4,83 %. Einschließen der Kant-Randreferenzen erweitert den Rahmen; Fußnoten bleiben enthalten. Exclude-Masken werden auch bei Large geprüft.

Die neue Original-Mul-Prüfung ist hier nicht wiederholt, weil diese Datei in diesem Arbeitsstand nicht vorliegt. Frühere Mul-Ergebnisse sind in der Versionshistorie erhalten; die entsprechenden synthetischen Regressionsfälle laufen weiter. Heuristische Erkennung garantiert nicht die richtige Einordnung jeder unbekannten PDF.

Kein physischer BOOX, echter Kontosync, Android-Darstellung am Gerät oder E-Ink-Reaktion getestet. Die aktuellen Zahlen, Hashwerte und Signatur stehen in BUILD_STATUS.md und BUILD_VERIFICATION.json; Protokolle in qa/. Die SDK-Entfernung, manuelles Cropping (All/Odd/Even), Randtippen in allen Modi und Tag-Autocomplete bleiben offen.

## Neubau

Quellarchiv enthält aktuelle Quellen, Android-/Reader-Git-Bundles, Laufzeitpakete und den bisherigen Debug-Schlüssel. SDK/JDK, node_modules, Build-Caches, APK, Original-PDFs, Screenshots und private Release-Schlüssel sind ausgeschlossen.

JDK 17, Android Platform 37.0 Revision 2, Build Tools 36.0.0, Gradle 9.6.1, Node/npm verwenden. Reader-Submodule auf den festgelegten Ständen initialisieren. Für unverändertes PDF.js den Ordner `pdf` aus `app/src/main/assets/reader/reader.zip` nach `reader/build/mobile/pdf` und `reader/build/android/pdf` übernehmen. Im Reader `npm ci`, `npx webpack --config-name android`, `npm test` ausführen. PDF.js nicht unnötig neu bauen.

Die fünf Skripte `scripts/test-boox-{browser,features,fitting,stability,reader-controls}.cjs` im Reader mit Playwright ausführen. `BOOX_TEST_BROWSER` kann einen Chromium-Pfad angeben. `BOOX_HOEFFE_PDF` und `BOOX_KANT_PDF` verweisen auf die beiden konkreten Testdateien. Optional kann `BOOX_PROBLEM_PDF` die frühere Mul-PDF ergänzen.

Im Android-Projekt `python3 scripts/package_reader_assets.py`, danach `./gradlew :app:testDevDebugUnitTest :app:assembleDevDebug --no-build-cache`. In Umgebungen ohne Java-Attach kann `--init-script scripts/test_jvm_agent.gradle` den ByteBuddy-Agent ausschließlich in der Test-JVM vorladen. Das ändert keine APK-Startoptionen.

Updateprüfung: `python3 scripts/verify_boox_update.py --base <298.apk> --apk <299.apk> --build-tools <SDK/build-tools/36.0.0> --qa-directory qa --label Motero --fitting-update --reader-polish --motero-refinement --reader-controls`. Elf eingebettete Reader-Quellen und CSS müssen zum getesteten Build passen. PDF.js und alle anderen Laufzeitpakete bleiben bytegleich zur Basis; das Motero-M bleibt ebenfalls erhalten.
