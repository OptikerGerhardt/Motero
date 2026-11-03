# Motero auf BOOX: Build 301

## Als Update installieren

Die APK über die vorhandene Motero-Testversion installieren, vorher nicht deinstallieren. Paketkennung `org.zotero.android.debug`, Version `1.0.0-301`, Versionscode 301. Der bisherige Debug-Schlüssel, Dateipfade, Realm-/Syncformat und gespeicherte Einstellungen bleiben erhalten. Die technische Update-Prüfung vergleicht Paket, Zertifikat, Versionsanstieg, v2-Signatur und ZIP-Ausrichtung mit Build 300. Tatsächliche Installation und Kontositzung am physischen BOOX sind hier nicht geprüft.

## Korrekturen

Bei `Line and edition references → Exclude` werden auch A-/B-Referenzen mit römischen Folios erkannt. Die Screenshot-Stelle `BXLI` liegt auf PDF-Seite 133 der bereitgestellten Kant-Datei. `B XLII`, `B XLIX` und `B L` werden auch dann getrennt behandelt, wenn der OCR-Text sie mit einer benachbarten Textzeile verbunden hat. Zeichenpositionen, Grundlinie und die getrennte Randspalte bleiben für die Entscheidung erforderlich. Normale Wörter, bloße römische Zahlen im Inhalt sowie Fußnoten bleiben erhalten. Include zeigt die Referenzen wieder an.

Die Anzeige-Masken verwenden den vorhandenen begrenzten Seitencache auch für bereits analysierte Nachbarseiten. Beim Scrollen mit mehreren sichtbaren Seiten gilt dieselbe Einstellung. Drehung und Zoom verwenden die normalisierten PDF-Koordinaten. Das ist ausschließlich eine Ansichtskorrektur; PDF-Datei, Textschicht, Annotationskoordinaten und gespeicherte Inhalte bleiben unverändert.

Ansichtsknöpfe messen ihre volle lokalisierte Beschriftung mit aktueller Schrift, Schriftgröße und verbleibender Breite einschließlich Häkchen. Bei Platzmangel werden Initialen angezeigt, etwa M statt Medium oder FTC statt Fit to Content. Gleiche Initialen werden durch unterscheidbare kurze Präfixe ersetzt. Alle Beschriftungen bleiben einzeilig; beim Auswählen entsteht keine zusätzliche Textzeile. Die Schrift wird nicht verkleinert. Die Mindest-Touchhöhe bleibt 48 dp und die volle Beschriftung bleibt für Bedienungshilfen vorhanden. Nur bei extrem knapper Breite weicht das Häkchen dem Text; die ausgewählte Material-Fläche bleibt erkennbar.

## Erhaltener Funktionsumfang und Grenzen

PSPDFKit/Nutrient bleibt vollständig entfernt. PDF.js selbst und alle Laufzeitdateien außerhalb des Reader-ZIP bleiben bytegleich zu Build 300. Vier Hauptfits, drei Breitenbezüge, Ränder, getrennte gerade/ungerade Profile, SmartScroll, Wrapped-Seitenauswahl, direktes Markieren, Highlight/Underline-Palette, Kommentar-/Tagwege, Quick Tags, graue Bookmark-Notizen, Lesekante mit 50 % Deckkraft, Vollbild, schwebende Leisten und Motero-M bleiben erhalten.

F19 Autocomplete, F22 manueller Zuschnitt All/Odd/Even, F23 Randtippen und optionale Stifterweiterungen bleiben offen. Die Änderungen führen keine neue Engine-Abhängigkeit ein. Die betreffende PDF-Erkennung wurde mit Höffe 26/27 und 191/192 sowie Kant 369/370, 380/381 und neu 133/134/140 geprüft. Frühere Original-Mul-Prüfungen werden nicht erneut behauptet, da die Datei hier nicht vorliegt. Heuristische Erkennung kann bei unbekannten PDFs weiterhin mehrdeutig sein. Keine neue OCR.

Die neuen Ansichtsknöpfe sind regulär kompiliert und ihre Label-Logik ist geprüft. Ihre native Darstellung wurde nicht an einem physischen BOOX visuell kontrolliert; ebenso wenig echter Kontosync oder E-Ink-Reaktion. Endgültige Testzahlen und Hashwerte stehen in BUILD_STATUS.md und BUILD_VERIFICATION.json, Protokolle in qa/.

## Neubau und Prüfung

Das Quellarchiv enthält aktuelle Android-/Reader-Quellen, Git-Bundles, die erforderlichen Laufzeitpakete und den bisherigen Debug-Schlüssel. SDK/JDK, node_modules, Build-Caches, APK, private Release-Schlüssel, Original-PDFs und interne Screenshots sind ausgeschlossen.

JDK 17, Android Platform 37.0 Revision 2, Build Tools 36.0.0, Gradle 9.6.1 und Node/npm verwenden. Reader-Submodule auf ihren festgelegten Ständen initialisieren. Das unveränderte Verzeichnis `pdf` aus `app/src/main/assets/reader/reader.zip` nach `reader/build/mobile/pdf` und `reader/build/android/pdf` übernehmen. Im Reader `npm ci`, `npx webpack --config-name android` und `npm test` ausführen; danach im Android-Projekt `python3 scripts/package_reader_assets.py`. PDF.js nicht unnötig neu bauen.

Die fünf Skripte `scripts/test-boox-{browser,features,fitting,stability,reader-controls}.cjs` verwenden Playwright. `BOOX_TEST_BROWSER` kann einen Chromium-Pfad angeben, `BOOX_HOEFFE_PDF` und `BOOX_KANT_PDF` verweisen auf die konkreten Test-PDFs. Der letzte Test enthält auch die römischen Referenzen und Nachbarseiten. `BOOX_QA_IMAGES` ist ein optionaler lokaler Pfad für interne Vergleichsbilder; diese sind keine Auslieferungsartefakte.

Android: `./gradlew :app:testDevDebugUnitTest :app:assembleDevDebug --no-build-cache`. In Umgebungen ohne Java-Attach kann `--init-script scripts/test_jvm_agent.gradle` den ByteBuddy-Agent ausschließlich in der Test-JVM vorladen. Das ändert keine APK-Startoptionen.

Quellenvergleich: `python3 scripts/audit_pdf_engine_removal.py --base-source <entpackte-300-Quellen> --reader-refinements --output qa/sdk-removal-audit.json`. Nur die beiden geprüften Reader-Dateien und die native Beschriftungszeile sind als bestehende Produktionsänderungen erlaubt.

Updateprüfung: `python3 scripts/verify_boox_update.py --base <300.apk> --apk <301.apk> --build-tools <SDK/build-tools/36.0.0> --qa-directory qa --label Motero --fitting-update --reader-polish --motero-refinement --reader-controls --without-pspdfkit --roman-references`. `--preserve-reader` ist bei diesem Reader-Update nicht vorgesehen. SDK-Freiheit wird unabhängig davon geprüft, auch wenn bereits die Basis-APK SDK-frei war.
