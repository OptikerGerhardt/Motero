# Motero auf BOOX: Build 298

## Installation als Update

Über die vorhandene Motero-/Zotero-Testversion installieren, vorher nicht deinstallieren. Paketkennung `org.zotero.android.debug`, Versionscode 298, Version `1.0.0-298`, sichtbarer Name Motero. Derselbe enthaltene Debug-Schlüssel wie Build 297. Die technische Update-Identität wird direkt gegen die bisherige APK geprüft: Paket, Signierer, Versionsanstieg, v2-Signatur, ZIP-Ausrichtung einschließlich 16-KiB-Nativbibliotheken und unveränderte weitere Laufzeitpakete. Tatsächliche Installation/Login am physischen BOOX sind hier nicht geprüft.

## Neu in Build 298

Vollbild ohne dauerhaft reservierte Systemleisten-Ränder im PDF-/HTML-Bereich. Sichtbarkeit wird nach Compose-Commit, Fensterfokus und Resume mit der Toolbar abgeglichen; beim Verlassen des Readers wiederhergestellt. PDF-Fläche bleibt beim Ein-/Ausblenden konstant. Sidebar besitzt einen eigenen Statusleistenabstand. EPUB behält seine vorhandenen Inhaltsabstände.

Motero-M in derselben kräftigen geometrischen Formensprache, ursprünglicher Rotverlauf #ff6666 bis #db2c3a, weißer Hintergrund. Adaptiver Vordergrund, monochrome Geometrie und alle fünf Legacy-Dichten aktualisiert. Quelle: design/motero-icon.svg; Neu-Export mit python3 scripts/regenerate_motero_icons.py (CairoSVG erforderlich).

Unterer Bereich der Drag-Palette: zwei gleich große, vollständig antippbare Hälften mit jeweils zentriertem Highlight-/Underline-Symbol. Äußere Hashtag-Mittelpunkte direkt unter den äußeren Farbkreis-Mittelpunkten; gleichmäßige Verteilung dazwischen, einzelner Tag mittig. Vorherige Erweiterung um halbe Farbabstände entfällt.

Mehrzeilige Kopfbereiche, parity-spezifische Muster mit mindestens drei passenden Stichprobenseiten und vorsichtige Erkennung kleiner tieferer Kopfzeilen. Größere Kapitelüberschriften und erste Absätze werden durch Schrift-/Abstandsregeln geschützt. Schriftkästen, die die nächste Körpertextzeile überlappen, sind kein Weißraum nach einer Kopfzeile. Fußnoten bleiben enthalten. 240 Reader-Tests; Browser prüft mehrzeilige Header, unveränderte Mul-Ausrichtung sowie Modushälften und Rand-Touchziele. Die neu erwähnte Problem-PDF liegt nicht vor; ihr konkreter Fall bleibt ungeprüft.

## Weiter enthalten aus Build 297

* Aktiver Fit: Zielseite vollständig vorbereiten; erst dann Navigation, Zoom, Position und Clip synchron setzen. Keine sichtbare Zwischenposition während der Inhaltsanalyse. Neue Eingaben haben Vorrang. Begrenzter Nachbarseiten-Vorlauf verwendet den vorhandenen Cache. Wrapped-Einstieg verwendet denselben Pfad.
* Schwebende obere Leiste für PDF/HTML: zwei Material-Flächen mit 16-dp-Rundung und transparenter, durchlässiger Mitte. Die PDF-/HTML-Fläche bleibt beim Umschalten konstant und verwendet ab Build 298 keine dauerhaften Systemleisten-Abstände. Sidebar und Zeichenwerkzeuge erhalten festen Platz unter den Buttons. EPUB unverändert.
* Löschen: Reader-Pointer/Drag/Auswahl sowie das passende native Annotationsfenster bereinigen. Verspätetes Schließen eines alten Fensters lässt neue Auswahl bestehen. Ein verspäteter Auswahlaufruf für eine gelöschte ID öffnet kein leeres Fenster.
* Drag-Palette: acht Original-Zotero-Farben ohne schwarze Rahmen, kleine Spitze, Originalsymbole für Highlight/Underline, offizielle helle/dunkle Theme-Farben. Werkzeugkonvertierung verwendet Zoteros reguläre neue ID plus Löschen der alten ID; Text, Kommentare, Tags und PDF-Position bleiben erhalten. Native Speicherung verwendet den normalen Erstellen-/Löschpfad, eingegrenzt auf den geöffneten Anhang. Keine Änderung am Sync-Datenformat.
* Native Farbfilter/Quick Tags: schwarze Kästen entfernen, Auswahl über Material-Fläche plus Häkchen; Sidebar-Farben enger gruppieren. Touchflächen erhalten. Künftige UI an Zotero/Material ausrichten.
* Bookmarks: immer relativ zum ungerandeten Inhaltsrahmen, unabhängig vom aktuellen Fit und der Margin. Rechts 8 PDF-Punkte eingerückt, oben 4 Punkte unter dem Inhalt. Rotation berücksichtigen; bei winzigem Rahmen begrenzen. Gleichzeitige Shortcut-Anfragen pro Seite zusammenfassen. Erneuter Shortcut öffnet und versetzt nur die vorhandene datierte, bearbeitbare Bookmark-Notiz; andere und schreibgeschützte Notizen nicht verschieben. Der erste Shortcut in manueller Ansicht kann die erste Inhaltsanalyse abwarten.
* Bild-PDFs: Neutralgraues Papier nur bei ausreichend vielen textähnlichen Zeilenbändern normalisieren. Reproduzierbare echte Bild-PDF ohne Textobjekte im Browser geprüft. Farbbilder und graue Fotos ohne solche Bänder konservativ erhalten. Keine OCR oder garantierte semantische Randklassifikation.

## Vier Fits und Inhaltserkennung

| Modus | Berechnung | Zugänglicher Ausschnitt |
|---|---|---|
| Off | Keine automatische Anpassung, manueller Zoom | Ganze PDF |
| Fit to Content | Gesamten erkannten Inhalt in Breite und Höhe einpassen | Inhaltsrahmen plus Margin, äußeres Papier nur in der Ansicht ausblenden |
| Fit to Width | Ausschließlich Breite von PDF oder Inhalt plus Margin | Ganze Papierhöhe bleibt scrollbar |
| Fit to Height | Ausschließlich Höhe von PDF oder Inhalt plus Margin | Ganze Papierbreite bleibt horizontal erreichbar |

Ränder None / Small / Medium / Large: 0 / 1 / 4 / 8 Prozent der kürzeren Lesefensterseite je Kante. Für größere Schrift mit vertikalem Lesen: Width → Content → Small. Content zeigt dagegen den gesamten Inhalt gleichzeitig. Seitenverhältnis bleibt erhalten. Die PDF-Datei und gespeicherte Annotationskoordinaten werden durch Fit nicht geändert.

Bis zu vier benachbarte Seitenpaare aus der Dokumentmitte bilden getrennte gerade/ungerade Profile. Gleichartige Buchseiten verwenden gemeinsame typische Lesebreite, getrennte Ausrichtung. Jede neu besuchte Seite wird zusätzlich analysiert, um breite Tabellen oder tiefe Fußnoten zu erhalten; bis zu 32 Ergebnisse im Seitencache. Natürliche Leseorientierung wird analysiert, Rotation transformiert den Rahmen. Unbekannte Formate, leere Seiten und Lesefehler fallen konservativ auf die Seite zurück.

Laufende Köpfe, separate Zeilen-/Editionsspalten und eindeutige Downloadblöcke werden anhand Text und Geometrie ausgeschlossen. **Fußnoten und Trennlinien bleiben Inhalt.** Wiederholung, kleine Schrift oder tiefe Position allein entfernt keine Fußnote. Mehrdeutige Texte bleiben erhalten. Ohne Textschicht können Randmetadaten erhalten bleiben; verrauschte/schräge Scans sind nicht zuverlässig abgedeckt.

Manueller Zoom hebt aktiven Fit auf; erneutes Antippen derselben Fit-Option wendet sie neu an. Doppelseitenwahl schaltet automatischen Einzelseitenfit aus. Alle bisherigen Funktionen bleiben enthalten: SmartScroll, gekoppelte Leisten, Wrapped-Übersicht, direktes Markieren, Farb-/Tagfilter, Blockzitat im Annotationsfenster, Quick Tags und Lesekante mit 50 % Deckkraft.

## Prüfungen und Grenzen

Zahlen, Signatur, Hashwerte und APK-Metadaten stehen in BUILD_STATUS.md und BUILD_VERIFICATION.json; zugehörige Protokolle in qa/. Reader-Einheitstests sowie Browserprüfungen für Gesten, Funktionen, alle vier Fits, drei Scrollmodi, vier Rotationen, echtes Touch-Markieren und Original-Mul werden verwendet. Die neue Stabilitätsprüfung zeichnet RAF-Frames während eines verzögerten Seitenwechsels auf, prüft Eingabeabbruch, Löschen mit fehlendem Pointer-Release, veraltetes Fensterschließen, Originalfarben, Dark Mode, Typkonvertierung samt Tags/Kommentar, Inhalts-Bookmarks und ein Bild-PDF mit null Textobjekten.

Kein physischer BOOX angeschlossen. Native Darstellung, Installation mit Nutzerkonto, tatsächliche Hardware-/E-Ink-Reaktion, echte Pinch-Skalenänderung am Gerät und Android-/Desktop-Sync sind hier nicht getestet. Die Browserprüfung zeigt die reproduzierbaren Reader-Fälle; sie garantiert keine Fehlerfreiheit auf jeder PDF oder Hardware. Manuelles Rechteck-Cropping (All/Odd/Even), Randtippen in allen Modi und Tag-Autocomplete bleiben offen.

## Neubau

Quellarchiv enthält Git-Bundles, aktuelle Quellen und vollständige Laufzeitpakete unter app/src/main/assets. SDK/JDK, node_modules, Build-Caches, APK, Original-Mul-PDF, Screenshots und private Release-Schlüssel sind ausgeschlossen. Der bisherige Debug-Schlüssel ist für künftige Updates enthalten.

JDK 17 mit Compiler, Android Platform 37.0 Revision 2, Build Tools 36.0.0, Gradle 9.6.1, Node/npm verwenden. Reader-Submodule auf den im Bundle festgelegten Ständen initialisieren. PDF.js aus dem enthaltenen reader.zip unverändert nach reader/build/mobile/pdf übernehmen. Im Reader npm ci, webpack --config-name android und npm test; anschließend die vier scripts/test-boox-{features,browser,fitting,stability}.cjs mit Playwright ausführen. BOOX_TEST_BROWSER kann einen Chromium-Pfad angeben, BOOX_PROBLEM_PDF verweist auf die originale Mul-PDF. Die beiden make-*-fixture-Skripte erzeugen Test-PDFs erneut.

Im Android-Projekt python3 scripts/package_reader_assets.py; dann :app:testDevDebugUnitTest :app:assembleDevDebug --no-build-cache. In Umgebungen ohne dynamisches Java-Attach ByteBuddy-Agent ausschließlich in der Test-JVM vorladen; keine solche Startoption in der APK. Bei unverändertem Reader-Build kann die reguläre native Kompilierung parallel zur Reader-Prüfung laufen; vor Paketierung Reader neu verpacken und Hash prüfen.

scripts/verify_boox_update.py --base <297.apk> --apk <298.apk> --build-tools <SDK/build-tools/36.0.0> --qa-directory qa --label Motero --fitting-update --reader-polish --motero-refinement prüft das Update, neun eingebettete Reader-Quellen, die gebaute CSS, die M-Geometrie in beiden Vektoren, fünf PNG-Dichten, unveränderten Rotverlauf/Hintergrund und die neuen Browser-Modusflächen. PDF.js und alle weiteren Laufzeitpakete müssen bytegleich zur bisherigen APK sein.
