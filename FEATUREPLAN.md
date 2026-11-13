# Motero auf BOOX: Featureplan

Stand: 13. November 2026. Motero 1.1.1 / Build 327 behebt den blockierten Reader-Ausgang und enthält die in Build 326 umgesetzten Punkte. PDF.js 5.7.330 und die Annotations-/Syncformate bleiben erhalten.

## Reader-Ausgang: Build 327 / 1.1.1

- Ausdrücklichen Toolbar-Zurück-Pfeil auf Telefon/Tablet direkt an den Navigationsstapel anbinden. Protect reader schützt weiterhin vor System-Zurück, kann aber den Ausgang nicht selbst verschlucken.
- Native Regression mit echter aktiver System-Zurück-Abfangfunktion und ohne Dispatcher; vollständige Update-Prüfungen von Build 326.

## Reader Controls und Erkennung: Motero 1.1 / Build 326

- 200-ms-Drag-Highlighting in PDF/EPUB, Page Turning unter Reader Controls; Reader-/Stylus-Menüs mit Zotero-Einstellungszeilen, Schaltern und verbundenen Auswahlknöpfen.
- System-Zurück-Schutz zusätzlich zur Gestenausschluss-Anfrage, mit getrenntem Schließen von Suche/Sidebar/Auswahl. EPUB-Bookmark-Bereich oberer rechter halber Bildschirmstreifen.
- Dock-Wechsel abhängig von der tatsächlichen Breite korrekt anordnen; Quick Toolbar über allen Dokumentmarkierungen halten.
- EPUB-Sticky-Notes bei Touch/Hover korrekt an der Tippstelle verankern und bei Umbruch am Text erhalten.
- Kopfzeile mit Trennlinie, abgesetzte Autorenliste, knappe Randsterne, Download-/Lizenzhinweise: zusätzliche Erkennung und Regressionen. Sichtbaren Text durch Hintergrundlernen nicht nachträglich verschieben.
- Nach Zwei-Finger-Gesten den tatsächlichen Kontaktzustand übernehmen, auch wenn ein Touch-Ende beim Layoutwechsel verloren geht; nach Übersichtssprüngen genau das Lese-Seitenpaar wiederherstellen.
- README für Release 1.1 aktualisiert. [Prüfumfang, Originaldatei- und Gerätegrenzen](docs/READER_326.md).

## Spalten, Appearance und EPUB-Leisten: Build 325 / 1.0.10

- Rechte Spalte nach Seitenzentrierung erhalten; Spaltenlesen nur in Jumped, Continuous ohne Spaltenrouting und mit Achsensperre bei Ein-Finger-Gesten.
- Kleine isolierte Kopfzeile mit äußerer arabischer Seitenzahl samt Trennlinie erkennen; echte Kapitelüberschriften und Include/Exclude-Randreferenzen erhalten.
- Leere PDF-Seiten übernehmen typische physische Leserahmen der Nachbarseiten, in Automatic/Manual und den Fit-Richtungen.
- Appearance vereinigt Light, Snow, Sepia, Dark, Black und Automatic; Automatic merkt helle/dunkle Varianten getrennt. Seitenzwischenräume folgen der Papierfarbe; E-Reader-Ausnahme bleibt.
- Notiz-Farben nach Platzieren/Löschen in der offenen Werkzeugpalette erhalten; Bereichsfarben wie Zotero Desktop; größere unsichtbare Endpunkt-Hitboxen.
- EPUB-Fortschritt bleibt unter der Annotation Quick Toolbar und über Rand-Tippbereichen; Ausblenden ändert weder Textfeld noch Umbruch.
- EPUB-Bookmark größer und weiter eingerückt; Zeilenhöhe in 0,05-Schritten; negative Top-/Bottom-Margins nur bis zum tatsächlich nutzbaren Bildschirmrand.
- [Umfang und Prüfgrenzen](docs/READER_325.md). Die quellenspezifische Kundera-Überschriftenbeobachtung bleibt zur Gegenprobe offen.

## Lesegesten, Spalten und Darstellung: Build 324 / 1.0.9

- PDF-/EPUB-Drag-Highlighting nach 250 ms; Stylus-Einstellungen durch langen Druck auf den oberen Stift, kurzer Druck unverändert.
- EPUB-WebView über die volle Lesefläche, sicherer Standardabstand innerhalb des Layouts; Top-/Bottom-Margins -20 bis 15 %, größere schwarze Fähnchen und Bookmark-Tippbereich unabhängig vom Textfeld.
- Bestehende Desktop-Farben für PDF-/EPUB-Seiten, im globalen E-Reader-Modus ausgenommen.
- Spreads und Page Fitting bleiben gemeinsam aktiv; Leseeinheiten bei Fit-/Übersichtssprüngen direkt zentrieren, ohne normales Scrollen einzuschränken.
- Continuous-Volume-Schritte laufen über Seitengrenzen; Jumped-SmartScroll bleibt erhalten.
- Zweispaltige Textseiten und klare Scans konservativ erkennen, Textbreite auf die Spalte beziehen und links/rechts in Leserichtung fortsetzen. Spreads, manuelle Rahmen und vollständiger Seitenbezug bleiben explizit.
- EPUB-Überschriften im Kundera-Buch bleiben als möglicherweise quellenspezifische Beobachtung für einen Vergleich offen.
- [Prüfumfang und Erkennungsgrenzen](docs/READER_324.md). Physische Eingabe und Kontosync separat.

## Auswahl, Spreads und Effizienz: Build 323 / 1.0.8

- EPUB: Textposition zwischen Zeilen stabil; explizite Markierungswerkzeuge konkurrieren nicht mit der Haltegeste.
- Highlight-Schnellpalette während Bearbeitung ausblenden und anschließend mit aktueller Geometrie wiederherstellen; rundere blaue Griffe bei PDF/EPUB.
- Odd-/Even-Seitenpaare bei Zuschnitt, Zentrierung, Jumped/Hardware-Navigation und Übersicht gemeinsam behandeln; Cover und letzte Einzelblätter erhalten.
- Vorschauen gebündelt veröffentlichen, WebView gezielt aktualisieren, Raster-Cropping in Worker mit kompakten Bilddaten und Rückfallpfad; Geräte-/Speicherdruck-Budgets und bevorzugte aktuelle Seite.
- EPUB: unnötige Erscheinungs-/Font-Wiederherstellung vermeiden, Scroll-Updates bündeln, Kapitelaufbau zwischen Aufgaben freigeben. Doppeltipp unverändert.
- [Details, Quellen und Prüfgrenzen](docs/READER_323.md).

## EPUB und Ressourcenverbrauch: Build 322 / 1.0.7

- EPUB-Wischen auf Text wieder möglich; ausstehendes Drag-Highlighting blockiert den Seitenwechsel nicht mehr. Markieren, Handles und Paletten schließen behalten ihre getrennten Gesten.
- EPUB mit zusätzlichem Regler für obere/untere Ränder, dauerhaft sicherem und symmetrischem Textfeld sowie erreichbarem Bookmark-Filter in der Sidebar.
- Begrenzter JavaScript-Miniaturspeicher; Crop-Lernen ohne gleichzeitiges Halten aller Raster-Samples. Unveränderte Seitenrahmen werden beim erneuten Blättern wiederverwendet.
- E-Reader: obere Leiste ohne normale Einblendanimation, weniger entfernte Seiten gleichzeitig vorbereiten und Hintergrundanalyse während Fingereingaben zurückstellen.
- [Messungen, Grenzen und Prüfumfang](docs/READER_322.md). Physische Geräte und Kontosync bleiben separat.

## Reader und EPUB: Build 321 / 1.0.6

- Bestehende PDF-Highlights/Unterstreichungen nach langem Druck an den Enden ändern, Bereichsrahmen vergrößern/verkleinern, Notizen verschieben; EPUB mit CFI-Endpunkten und verschiebbaren Notizankern. Identität und Undo bleiben erhalten.
- EPUB mit PDF-Drag-Highlighting und gemeinsamer Schnellpalette; schwarze Bookmark-Fähnchen oben rechts, 70 % auf der Seite.
- Schwebender EPUB-Kopf und untere Annotationsleiste ohne Miniaturen; kein Umbruch beim Ein-/Ausblenden, Vollbildstatusleiste mit gemeinsam ausgeblendeter Abdeckung.
- EPUB-Rückkehr ohne veraltete Unschärfe/Skalierung; Schutz gegen veraltete asynchrone Arbeit, begrenzte Wortanalyse und Aktualisierung pro Bild.
- „Margins“ als echter Regler, Schriftwahl Buch/Serif/Sans serif, vorhandene Größen-/Abstandsregler. Fortschrittsanzeige ausschließlich unten antippen.
- E-Reader-Modus und Textauswahl global unter Reader controls; Stylus-Schnellzugriff unten in Appearance. Optionaler Reader-Randschutz innerhalb der Android-Grenzen.
- Lautstärketasten scrollen Collections und Titellisten normal; vorhandene Hardware-Navigation muss aktiviert sein. Downloaded-Files-Filter mit sicherem unteren Abstand.
- Randsterne/-punkte folgen Include/Exclude. „Text“ behält bei Fit to Width die volle Seitenhöhe, bei Fit to Height die volle Seitenbreite; „Text + crop“ entfernt die äußeren Ränder beider Achsen.
- [Umfang und Prüfnachweise](docs/READER_NEXT_UPDATE.md). Physische Geräte und Kontosync bleiben separat zu prüfen.

## PDF.js: Build 320 / 1.0.5

- Zotero-Pin `5f95f712bc629ac11159cb4859ed8091fdffa87b`, PDF.js 5.7.330: korrekte eingebettete Fett-/Kursivschriften und bereichsweise Textfärbung. Keine zusätzlichen UI-Funktionen oder Änderungen der gespeicherten Annotationen.
- Gemeinsamer Client-/Worker-/Viewer-Build mit Prüfung gegen den Quell-Pin; bisherige Android-Polyfills, Zotero-Viewer-CSS, Lizenzen und Laufzeitpakete erhalten.
- Freigabe umfasst die bisherigen Reader-/Android-/Browserregressionen, zusätzliche Engine-Pixel-/DOM-/Schrifttests und API-31/35-Updates von 303 und 319. Physische BOOX-/GrapheneOS- und Kontosync-Prüfungen bleiben separat.
- [Änderungen, Herkunft und Prüfumfang](docs/PDFJS_UPDATE.md).

## Korrektur: Build 318 / 1.0.3

Veröffentlicht und unabhängig geprüft: 333 Reader-, 125 native Tests, 14 Browser-Suiten und beide API-31/35-Update-Gates bestanden. [Prüfberichte](qa/build318/).

- Neue Randmasken auf gepufferten Nachbarseiten aktualisieren sich auch bei unverändertem Seitenrahmen. Inkrementelles Zeichnen und die schnelleren Layout-Schreibvorgänge bleiben erhalten. Ein zusätzlicher Regressionstest sichert diesen Fall ab.

## Reader-Nachbesserungen: Build 317 / 1.0.2

- Gleiche Symbolspaltenbreite für Bookmark-Fähnchen und andere Annotationen; Seitenlabels bleiben ausgerichtet.
- Jumped/SmartScroll: vorwärts am Anfang, rückwärts am Ende langer Seiten; kurze Seiten weiter zentriert, in allen Layouts und Eingabewegen.
- Manueller Crop-Editor mit gemessener Bedienhöhe, vollständigen sicheren Abständen, umbrechenden Bedienzeilen und Vorschaugrenzen für kleine/hohe/querformatige/große Bildschirme.
- Kombinierte Kopf-/Fußzeilenerkennung einschließlich Romanfolien, Schriftmerkmalen, lokalen Kapitelgrenzen und konservativem Erhalt von Fußnoten/Überschriften. Textgeometrie nur bei geprüften reinen Textseiten, sonst Rasteranalyse.
- Vorbereitung in Leserichtung ohne Timer-Verhungern, priorisierte Analyse mit reserviertem Vordergrundplatz, gezielte Cache-Verfeinerung, weniger Pixelanalysen und unveränderte Seiten ohne zusätzliche DOM-Layout-Lesezugriffe.
- Offene Drag-Highlight-Leiste zuerst schließen; der gleiche Tipp löst keine weitere PDF-/Toolbar-Aktion aus.
- Reproduzierbare Vergleichsfälle, bounded lokale Zeitmessungen und kalte/warme Browser-Prüfung. [Algorithmus, Recherchequellen und Prüfumfang](docs/CROPPING_AND_SCROLLING.md). Direkter Forumabruf weiterhin HTTP 403, keine vollständige Forumrecherche behauptet.

## Reader-Nachbesserungen: Build 316 / 1.0.1

- Jumped: aktuelle Seite vertikal zentriert nach Wischen, Randtippen und Übersichtssprüngen, einschließlich Breitenanpassung; erste/letzte ungecroppte Seiten werden ebenfalls mittig dargestellt.
- Alle Annotationskarten zeigen Jump-to links neben dem Menü, in beiden Auswahlzuständen. Menüs verwenden die Identität der angeklickten Karte.
- Bookmark-Filter: nicht ausgewählt Jump-to + Löschen, ausgewählt Jump-to + Menü. Andere Ansichten behalten das Menü.
- Der vollständige Sidebar-Kopf einschließlich der freien Mitte fängt Berührungen ab. Symbolaktionen bleiben bedienbar; der schwebende Kopf bleibt unverändert.
- Höhere Buildnummer, unveränderter privater Signierer und Android-Update-Prüfung von 303 und 315.

## Vorheriger Stand

Build 315 ist der erste als „Motero 1.0“ benannte Release.

## Reader-Nachbesserungen: Build 315 / 1.0

- Jumped / Continuous als zweite Knopfreihe unter Scrolling ohne neue Rubrik. Continuous bleibt Standard; Jumped zeigt eine Leseseite und blättert bei deutlicher Wischgeste vollständig weiter. Herauszoomen und Übersicht bleiben zugänglich.
- Weißer innerer Auswahlring im Highlight-Schnellmenü und bei Annotationsfarben, runde Tipp-Rückmeldung; ausgewählte Hashtag-Kürzel ohne Haken.
- Farbzeile mit fünf sichtbaren Plätzen: vier horizontal verschiebbar, Violett fest erreichbar. Stiftbreite und Radierergrößen bleiben in derselben zweiten Dockzeile.
- Undo ganz links, langer Druck für Redo. Native Verfügbarkeit folgt dem Annotationsverlauf; neue Änderungen leeren den Redo-Verlauf.
- Dock-Breite zuerst ändern, dann Vorschau/Werkzeuge austauschen; funktioniert bei schmalerer und breiterer Zielfläche.
- Deckende Statusleisten-Unterlage im Reader-Theme, gemeinsam mit den Toolbars ein-/ausgeblendet. Vollbild ohne Unterlage und ohne reservierten Statusbereich; kein Gradient.
- GitHub: erster stabiler Titel „Motero 1.0“, bisherige Releases als Alpha. Technische Tags und APK-Namen bleiben für Obtainium erhalten; keine alten Downloads werden ersetzt.

## Vorheriger Stand

Build 314 setzt die 13 gesammelten Reader-Nachbesserungen um.

## Reader-Nachbesserungen: Build 314

- Vollständig radierte Striche werden sofort im lokalen Annotationsmodell und Undo-Verlauf entfernt; die Rückmeldung aus Android ist keine Voraussetzung mehr für die sichtbare Löschung.
- Reihenfolge im Dock: Notiz, Text, Undo, Bereich, Stift, Radierer, Farbe. Bereich direkt links vom Stift; Stift/Radierer/Farbe bilden eine zusammenhängende Gruppe.
- Vorschau bleibt beim Werkzeugwechsel montiert; Breite und Unterkante bleiben beim Zurückwechseln stabil.
- Obere Symbolgruppen gleiten beim Öffnen/Schließen der Sidebar in derselben Komponentenstruktur zum Rand; Hintergrund und Ecken werden mitgeführt.
- „Fit relative to“ direkt unter „Content cropping“ und vor „Page fitting“, nur bei Automatic und Breiten-/Höhenanpassung. Manual verwendet immer den gewählten Rahmen; die automatische Bezugswahl bleibt gespeichert.
- Appearance-Menü mit Systemabstand und zusätzlichem unteren Scrollraum.
- Bookmark-Sprung mit oberem Kreisbogen; Spiegelung an einer vertikalen Achse kehrt die Richtung um und lässt den Bogen oben.
- Bookmark-Fähnchen etwas größer, bei gleichen PDF-/Sync-Koordinaten und bisheriger Deckkraft.
- PDF-Vollbild ohne reservierten Statusleistenbereich; native Bedienelemente behalten ihre sicheren Abstände.
- Unteres Dock fährt mit festem Navigationsleistenabstand direkt an die endgültige Position.
- Dark-Mode-Miniaturen: weißes Originalpapier wird genau einmal durch den PDF.js-Theme-Blender eingefärbt; Browserprüfung misst Textkontrast.
- Gestrichelte Scroll-Hilfslinie verschwindet nach fünf Sekunden; ein neuer Hinweis startet eine neue Frist.
- Farbauswahl im Schnellmenü mit hervorgehobener Farbkachel nach Zotero Desktop, ohne fontabhängigen Haken im Farbkreis.

## Vorheriger Stand


Stand: 9. November 2026. Build 313 behebt die rückständige Crop-Auswahl und erweitert das gemeinsame Reader-Dock.

## Reader-Nachbesserungen: Build 313

- „Fit relative to“ bei Breiten-/Höhenanpassung wieder sichtbar und wirksam; explizite Bezugsfläche wird gespeichert. Bestehende Fit-Einstellungen bleiben bis zu einer neuen Auswahl erhalten.
- Die Einstellungen lesen beim erneuten Öffnen den aktuellen dokumentbezogenen Crop-Modus. Manual Apply bleibt aktiv; Automatic lässt die manuellen Rahmen gespeichert.
- Normale Seitenwechsel fordern das aktuelle Vorschaubild an; dieses wird vor den Nachbarseiten gerendert. Feste Miniaturslots verhindern Größenänderungen beim Nachladen.
- Eine gemeinsame schwebende Fläche mit fester Unterkante: erst verbreitern, dann Vorschauen nach oben und Werkzeuge von unten bewegen; beim Schließen umgekehrt. Seitenzahl nur im Vorschaumodus.
- Farbfeld öffnet eine zusätzliche Zeile im Dock. Zotero-Farbpalette, Stift-/Textgröße und Radierergröße; beim Radierer rechts zwischen Fläche und Strich wechseln. Einstellung lokal gespeichert, bestehendes Undo und Syncformat erhalten.
- Bookmark-Sprung mit offenem, schräg gebogenem Pfeil nach der Nutzerzeichnung.
- Auslieferung mit Reader-/Android-/Browserregressionen sowie unveränderter Signieridentität und Update-Prüfung von Build 303 und 312 auf API 31/35. Physische GrapheneOS-/BOOX-Prüfung separat.

## Vorheriger Stand


Stand: 8. November 2026. Build 310 enthält die Reader-Überarbeitung aus Build 309 und die zusätzliche Korrektur für verzögerte Toolbar-Tipps nach einem priorisierten Shortcut.

## Reader-Überarbeitung: Build 309

- Lesezeichen: neue Einträge schwarz, vorhandene Farben unverändert; zentrierte Seite als Ziel; direkter Sprung und roter Löschknopf nur im Schnellfilter bei nicht ausgewählten Karten.
- Randtipps schmaler (12 %, maximal 64 CSS-Pixel), vor Annotationen priorisiert; Links, längere Gesten und Werkzeuge geschützt. Untere Filterleiste mit 4 dp Zusatzabstand und System-Navigationsabstand.
- Lesen / Zwei-Finger-Vorschau / Übersicht getrennt: zwei vollständig sichtbare Originalseiten halten die Übersicht offen; ansonsten Snap-back. Seitentipp stellt den Fit in allen drei Scrollmodi wieder her.
- Inhaltszuschnitt Automatic / Manual zwischen Scrolling und Page fitting; gespeicherte Rahmen bleiben beim Umschalten erhalten, Abbrechen verändert die vorherige Wahl nicht. Off entfernt den Zuschnitt. Native Material-Bedienelemente steuern die vorhandene Vorschau ohne WebView-Neuerstellung. Lupe auf 1,4-fache Vergrößerung.
- Kant: getrennte B-/Römerzahlen vor Zeilenbildung gruppieren und gegenüber der Textspalte bewerten. Fuchs: isolierte untere Folien zusätzlich anhand Positionsband und Nummernfolge bewerten. Die neuesten Originaldateien aus den Screenshots liegen nicht vor; diese Muster sind synthetisch geprüft.
- EPUB: persistente Fortschrittsanzeige mit vier Zuständen, ohne Umbruch beim Umschalten; alte Toolbar-Reserve entfernt, Systemabstände einmal angerechnet. Theme initial aus Einstellung und Betriebssystem; WebView-eigene Verdunkelung aus.
- Stabilität: priorisierte Analysewarteschlange pro Dokument, maximal zwei Rasteranalysen, 32 schwere Cache-/Vorschau-Einträge, kleine Geometriedaten getrennt; veraltete Arbeiten abbrechen, Layout-Schreibvorgänge bündeln. Kontrollierte Wiederherstellung bei beendetem Renderer.
- Prüfung und Auslieferung: Reader-/Android-Tests, Browserfälle, privates Plessner-Original, signierte APK, API-31/35-Update von 303 sowie 308, Datenmarker-/UID-Erhalt und Ablehnung des alten Schlüssels. Physische Geräte- und Kontosync-Prüfung separat.

Historischer Stand: 7. November 2026. Build 308 enthält die folgende Reader-Überarbeitung; Signieridentität, Paketkennung und Android-9+-Anforderung bleiben erhalten. Die Installation von Build 307 ist auf Pixel 8/GrapheneOS vom Nutzer bestätigt.

## Reader-Überarbeitung: Build 308

- Permanenter Zuschnitt und kompakter Seitenfluss in Vertical, Horizontal und Wrapped. Kleine Geometriedatensätze decken alle Seiten ab; aktuelle Seiten und jeweils vier Nachbarseiten werden vorab analysiert. Noch nicht vorbereitete Seiten erscheinen nicht kurz mit falschem Papierzuschnitt. Die Rasteranalyse bleibt auf einen begrenzten Cache beschränkt.
- Nur Zwei-Finger-Gesten geben die Originalseiten vorübergehend frei; ein Finger scrollt weiter in der zugeschnittenen Darstellung. Loslassen stellt den gewählten Fit an der bisherigen Lesestelle wieder her.
- Automatik berücksichtigt freistehende römische Kant-Verweise und zusammengehörige Verlagswasserzeichen; vollständige Fußnoten bleiben geschützt. Die ursprünglichen Kant-/Hobbes-/Fuchs-Dateien aus den neuen Screenshots liegen nicht vor, daher sind die passenden Muster synthetisch geprüft.
- Manueller Editor mit reaktionsfähigen Touch-Knöpfen, ausgeblendeten nativen Reader-Leisten, Zotero-Gestaltung, Vorschauseiten, geraden/ungeraden Seiten und Abbrechen über Android-Zurück. Vorschau und Zuschnitt bleiben reine Darstellung; Dateien und Annotationskoordinaten werden nicht umgeschrieben.
- Bookmark-Schalter neben der Suche, bestehende graue und neue blaue Lesezeichen, knappe Karten mit Seite/Datum und vorhandenen Angaben. Die untere Filterleiste berücksichtigt die Android-Navigationsleiste und bietet größere Touch-Ziele.
- Übersichtsnavigation stellt in allen drei PDF-Scrollmodi den Fit für die angeklickte Seite her. EPUB und Text-Lesemodus erhalten einen gespeicherten Schriftgrößenregler mit Prozentwert.

Prüfberichte werden unter `qa/build308/` und im GitHub-Release abgelegt. Physische Bedienung der neuen Funktionen sowie BOOX- und echter Kontosync-Test sind getrennt von Browser-/Emulatorprüfungen zu betrachten.

## Update-Korrektur: Build 307

Der Nutzer meldete den Installationskonflikt von 303 auf 306 sowohl auf GrapheneOS/Pixel 8 als auch BOOX Go Color 7. Ursache: Androids Prüfung bestehender Signaturberechtigungen benötigt das alte `PERMISSION`-Vertrauen, das bewusst widerrufen wurde. Die AndroidX-Receiver-Berechtigung bekommt deshalb einen neuen Motero-Namen; Manifest und AndroidX-Lookup werden gemeinsam angepasst. Paketkennung, Signierschlüssel und App-Datenpfade bleiben erhalten. Alte Schlüssel behalten keine Permission-/Rollback-Berechtigung. Der Release-Job muss die Migration auf Android API 31/35 samt Datenerhalt und Negativproben tatsächlich installieren, bevor eine APK veröffentlicht wird. Neue Funktionen gegenüber 306 sind nicht Bestandteil dieser Korrektur.

## Vorbereitung zur öffentlichen Freigabe: Build 306

Eigene Motero-Anpassungen als vollständig mit ChatGPT/Codex programmiert ausgewiesen; Zotero, Android, Reader und Community-Beiträge bleiben korrekt zugeordnet. Historie/Anhänge geprüft, alte Debug-Releases als Entwürfe archiviert, neues privates Zertifikat und eingeschränkte V3-Rotation vorbereitet. Öffentliche Builds benötigen Android 9+ und sind nicht debuggbar. Das ersetzt für öffentliche APKs die ältere Entscheidung zum unveränderten Testschlüssel; Paketkennung und Datenpfade bleiben erhalten. Der Workflow veröffentlicht ohne das private Secret keine APK. Das private Actions-Secret ist eingerichtet und der signierte GitHub-Release 306 mit sämtlichen Prüfungen erfolgreich. Stand, Prüfumfang und verbleibende Gerätetests: `docs/PUBLICATION_READINESS.md`.

## Festgehaltene Entscheidungen

**App-Name Motero ab Build 295 umgesetzt.** Beschluss vom 30. Oktober 2026. Der sichtbare Android-App-Name ist geändert; die Paketkennung `org.zotero.android.debug`, den bisherigen Signierschlüssel und die Speicherpfade beibehalten. Die Umbenennung erfolgt als normales Update mit Erhalt der bisherigen Paket- und Datenidentität. Build 294 wird für diese Namensänderung allein nicht neu gebaut.

Am 29. Oktober wurden F01, F02, F05, F06, F16, F17, F18, F20 und F21 für die nächste Umsetzung ausgewählt und in Build 293 implementiert. Die damalige APK hatte dieselbe Paketkennung und Signatur wie Build 292 und den höheren Versionscode 293. 206 Reader-Tests, 6 Android-Logiktests und die Browserprüfungen sind bestanden. Der tatsächliche Einsatz am BOOX muss noch erprobt werden.

Die danach beauftragten Fit-Modi und F07 sind in Build 296 umgesetzt. Die weiteren Nachbesserungen sind im Abschnitt Build 297 erfasst; die übrigen Punkte bleiben im Backlog. Ein eigener Outline-Editor auf Android wird weiterhin nicht benötigt; die Outline soll am Desktop in die PDF geschrieben werden. F19 Tag-Autocomplete ist auch nicht Teil von Build 296.

Build 292 war die zuvor ausgelieferte Basis. Der Nutzer hatte erfolgreiche Installation als Update, gutes direktes Markieren und funktionierendes SmartScroll bestätigt. Build 293 verwendet denselben Signierschlüssel, dieselbe Datenhaltung und die unveränderten weiteren Laufzeitpakete.

## Auftrag vom 7. November: F19, F22 und F23 in Build 305

Die ersten drei zuletzt priorisierten Features sind umgesetzt:

- **F19 – Tag-Vorschläge:** Bis zu acht passende bestehende Tags, sortiert nach aktiven Annotations-Zuweisungen im aktuellen Dokument, dann Nutzung in derselben Bibliothek, dann Name. Ausgewählte Tags stehen separat und können wieder entfernt werden. Ab drei Zeichen erscheint eine graue Präfix-Ergänzung; bei einem exakten vorhandenen Tag hat dieser Vorrang. Enter, Tastaturbestätigung und Speichern verwenden denselben Bestätigungspfad. Neue Tags entstehen nur über die ausdrückliche Anlegeaktion. Bei unerledigter Eingabe bleibt der Dialog mit Hinweis offen. Komposition und Cursorbearbeitung bleiben erhalten; Pfeiltasten wählen Vorschläge. Zählung und Sortierung erfolgen im Hintergrund pro Datenbanksnapshot; neue Suchen verwerfen alte Treffer sofort. Gruppen, Bibliotheken, gelöschte Einträge und Papierkorb-Eltern werden berücksichtigt. Tag-Zuweisungen nutzen die bestehenden Speicher-/Syncwege.
- **F22 – Manueller Zuschnitt:** PDF-Einstellungen → „Manueller Zuschnitt…“. Die vollständige Beispielseite erhält einen an Ecken ziehbaren und innen verschiebbaren Rahmen. Alle, ungerade oder gerade PDF-Seiten auswählen; in der Vorschau passende weitere Beispielseiten durchblättern. Ungerade beginnt mit PDF-Seite 1. Gerade und ungerade können den allgemeinen Rahmen unabhängig überschreiben; erneutes Speichern für alle ersetzt beide Ausnahmen. Übernehmen aktiviert den Inhalt-Fit. Die gemeinsame Fit-Geometrie bereitet aktuelle und beide Nachbarseiten vor. Geometrie wird pro Bibliothek und Anhang lokal gespeichert und bei Drehung korrekt umgerechnet. „Automatisch (alle zurücksetzen)“ entfernt die manuellen Rahmen. Abbrechen ändert nichts. Keine Änderung an PDF-Datei, Annotationskoordinaten oder Syncformat; der Zuschnitt selbst wird nicht synchronisiert und beim Abmelden gelöscht.
- **F23 – Randtippen:** Links zurück, rechts vor in vertikalem, horizontalem und Wrapped-PDF-Scrollmodus, auch bei schreibgeschützten Dokumenten. Der vorhandene Navigationspfad erhält Zoom und Pan bzw. die aktive Fit-Geometrie. Bookmark-Fläche, Wrapped-Übersicht, Links, vorhandene Annotationen und Textauswahl behalten Vorrang. Lange Druckgesten, Wischen und aktive Zeichenwerkzeuge lösen kein zusätzliches Randblättern aus.

**Prüfung:** 276 Reader-Tests und 109 Android-Tests in 25 Suiten bestanden; zehn Browserprüfungen bestanden. Neue Prüfungen decken Tag-Ranking, Bestätigung ohne versehentliche Neuanlage, Komposition/Cursor, überholte Suchläufe und Datenbankänderungen ab. Der Zuschnitt wurde mit echten Touch-Ziehgesten, geraden/ungeraden Seiten, weiteren Beispielseiten, Wiederöffnen, Abbrechen, Drehungen und Rückkehr zur Automatik geprüft. Native Tests prüfen ungültige Nutzdaten, getrennte Bibliotheken/Anhänge, Speichern/Wiederöffnen und Abmelden. Randtipps wurden in allen drei PDF-Modi samt Bookmark-Erstellen/Löschen, langen Druckgesten und Wischen geprüft. Bestehende Reader-, Annotations-, EPUB- und Original-Plessner-Prüfungen sind weiter bestanden.

Gleiche Paketkennung und gleicher Signierer wie 304, höherer Versionscode 305. Die 57 weiteren Laufzeitdateien und alle 207 PDF.js-Dateien sind unverändert. Nachweise: BUILD_STATUS.md, BUILD_VERIFICATION.json und qa/build305/. Physischer BOOX-/Smartphone-Test, BOOX-Tastatur und echter Kontosync stehen noch aus. Der Code und die APK werden im privaten GitHub-Repository bereitgestellt; die Sichtbarkeit bleibt privat.

## Reader-Auftrag vom 6. November: zusätzliche Änderungen für Build 304

Die ersten drei Punkte des wiederaufgenommenen Auftrags sowie Bookmark-Umschaltung, Nachbarzuschnitt und dauerhafte Fit-Einstellungen sind implementiert. Die breitere neue EPUB-Recherche aus Punkt 4 ist nicht Teil dieses Folgeauftrags. Die bereits rekonstruierten EPUB-Änderungen bleiben enthalten.

- **PDF-Footer:** Kleine, unten abgesetzte Beschriftungen werden durch eine stabile, über Stichprobenseiten bestätigte Footerposition und eine getrennte Seitenzahl derselben Grundlinie erkannt. Auch die dünne zugehörige Trennlinie wird aus der Zuschnittanalyse entfernt. `PDF` oder `PDF-Seite` ist kein pauschales Ausschlusswort. Anmerkungen und ihre Quellenzuordnungen bleiben Inhalt. Die originale Plessner-Datei wurde auf allen 116 Seiten geprüft; ihre 19 Quellenlabels im Anmerkungsbereich bleiben erhalten. Normale, wiederholte oder sehr tief liegende Fußnoten sind weiterhin durch Regressionen geschützt.
- **Originaltext kopieren:** Ein Tipp auf den Originaltext im großen Annotationsfenster kopiert den vollständigen Text einschließlich Zeilenumbrüchen und Unicode in die Android-Zwischenablage. Die begrenzte, scrollbar bleibende Zitatfläche und das getrennte Kommentarfeld bleiben erhalten. Ziehen zum Scrollen ist keine Kopieraktion.
- **EPUB-Lautstärketasten:** Die bestehende gemeinsame native Tastenanbindung bleibt erhalten: leiser vorwärts, lauter zurück, Richtungsumkehr aus den Einstellungen genau einmal. Eingabefelder, Such-/Annotationsfenster und nicht aktive Reader werden weiterhin geschützt. Der gescrollte Reader erlaubt jetzt auch den letzten unvollständigen Scrollschritt am Anfang oder Ende, damit keine Schlusszeile unerreichbar bleibt. Die gemeinsame Brücke meldet am Dokumentende keinen erfolgreichen Seitenwechsel mehr. Browserfälle prüfen beide Flows, beide Leserichtungen, vorwärts/rückwärts über Kapitelgrenzen und Texteingabe.
- **Bookmark-Tipp schaltet um:** Ein weiterer kurzer Tipp in dieselbe obere rechte Bookmark-Zone löscht das dortige datierte Lesezeichen über den normalen Annotationsmanager. Das gilt für PDF und EPUB. Ein nachfolgender Tipp legt wieder eines an. Andere Notizen und schreibgeschützte Lesezeichen werden nicht gelöscht. PDF-Tipps werden pro Seite geordnet, damit schnelle wiederholte Eingaben keine konkurrierenden Neuanlagen erzeugen. Links, normale Annotationseingaben, Auswahl und langer Druck behalten ihre vorhandenen Schutzregeln.
- **Vorbereitete Nachbarseiten:** Vor dem Fit-Abschluss werden aktuelle Seite, Vorgänger und Nachfolger analysiert. Zuschnitt und horizontale Inhaltsausrichtung aller drei Seiten werden gemeinsam gesetzt. Damit erscheinen bereits sichtbare kurze Nachbarseiten nicht zuerst mit Papier-/Fußzeilenrändern und versetztem Textblock. Die vorhandene 32-Seiten-Begrenzung bleibt erhalten. Beim Ausschalten werden die zusätzlichen Darstellungsstile wieder entfernt; PDF- und Annotationskoordinaten ändern sich nicht.
- **Fingerzoom ohne Verlust des Fits:** Bei aktivem Fit ist Fingerzoom vorübergehend frei; erst nach dem letzten losgelassenen Finger wird die gewählte Einstellung wieder angewendet. `Off` während einer Geste bleibt `Off`. Die Menüeinstellung wird durch Zoom nicht mehr als `none` zurückgespeichert. Einfingriges Verschieben darf die aktuellen Seitenränder zum Nachsehen freigeben, ohne den Fit abzuschalten oder sofort zurückzuzentrieren; Nachbarseiten behalten ihren Zuschnitt. Markier-/Annotationsgesten haben Vorrang. Die expliziten Zoomknöpfe lassen weiterhin den Zugang zur Wrapped-Übersicht zu; ein Seitentipp dort stellt den gemerkten Fit wieder her.

Frisch geprüft: 268 Reader-Tests, 91 native Tests in 21 Suiten und acht Browserprüfungen ohne Fehler oder übersprungene Tests. Dazu gehören 116 Original-PDF-Seiten, alle 19 Anmerkungs-Quellenlabels, EPUB-Navigation und echte Bookmark-Tipps in vier Flow-/Leserichtungsvarianten sowie die bisherigen Browser-Regressionen. APK-Paketkennung, gleiches Signierzertifikat, Versionsanstieg 303 → 304, v2-Signatur, ZIP-Ausrichtung, eingebettete Quellen, unveränderte PDF.js-Dateien und weitere Laufzeitdateien sind geprüft. Nachweise stehen in `BUILD_STATUS.md`, `BUILD_VERIFICATION.json` und `qa/build304/`. Kein physischer BOOX-/Smartphone-Test und kein echter Kontosync behauptet. Die älteren Original-Kant-/Höffe-/Fuchs-/Mul-Dateien lagen in dieser Sitzung nicht vor; dafür werden keine neuen Originaldatei-Prüfungen behauptet.

## EPUB-Update 304: wiederhergestellter Ausgangsstand

Die Änderungen wurden aus dem gesicherten Quellarchiv und dessen Git-Bundles wiederhergestellt und zusammen mit den zusätzlichen Änderungen oben nativ neu gebaut. Die neue Test-APK hat Versionscode 304. Die folgenden historischen Abschnitte beschreiben den damaligen Ausgangsstand; die aktuellen Nachweise stehen oben und in den Build-Berichten. Die lokale Speicherung und Wiederherstellung des EPUB-Lesestands bleibt zusätzlich am Gerät zu erproben.

F30: Schriftgröße, genauer lokaler CFI-Versatz, Anwendung von Breite/Abständen und sichere EPUB-/HTML-Initialisierung. F31: EPUB-Lesezeichen als graue datierte Standardnotizen. F32: Lautstärketasten in beiden EPUB-Ansichten einschließlich Kapitelgrenzen prüfen. Paketkennung, bisherige Einstellungen und Signierschlüssel beibehalten. F19/F22/F23 bleiben offen. Die vollständige recherchierte Liste folgt am Dateiende.

## Umsetzung der drei Rückmeldungen in Build 303

Der Nutzer hat F27/F28/F29 nach der zunächst ausdrücklich gewünschten Sammlung gemeinsam zur Umsetzung freigegeben. Build 303 ist als Update derselben App vorgesehen. Paketkennung, Signierschlüssel, Datenhaltung und PDF-Dateien bleiben erhalten. F19/F22/F23 bleiben offen.

### F29: Absturz beim Teilen, zuerst bearbeitet

Meldung: Share Document ließ die neueste Testversion bei PDF und EPUB abstürzen. Im Quellstand von Build 302 sammelte `setupFileObservers()` die Download-Ereignisse in einer IO-Coroutine. Der neue Teilen-Zweig rief dort direkt `triggerEffect()` bzw. bei Fehlern `updateState()` auf. `BaseViewModel2` prüft den ursprünglichen UI-Thread und wirft bei genau diesem Aufruf eine Ausnahme. Das liegt vor dem Fehlerfang für Androids Teilenansicht.

Der echte Download-Collector läuft jetzt in `viewModelScope` auf dem UI-Thread, wie die bestehenden State-/Effect-Wege verlangen. Der Hintergrunddownload selbst bleibt unverändert. Sechs neue JVM-Regressionen verwenden das tatsächliche ItemDetailsViewModel mit aktivierter Thread-Prüfung und IO-Ereignissen: PDF, EPUB, fehlende Datei, fehlgeschlagener Download, gleiche Schlüssel in einer fremden Bibliothek und Abbruch mit verspätetem Ready-Ereignis. Die bisherigen MIME-/Intent-/Leseberechtigungstests bleiben bestehen. Dateiinhalte bleiben unverändert; separat gespeicherte Zotero-Markierungen werden weiterhin nicht eingebettet. Eine erfolgreiche reale Übergabe an eine zweite Android-App muss noch am Gerät bestätigt werden.

### F28: Sporadischer Fit-Verlust, Fuchs-PDF als Originalfall

Meldung: zeitweise nur oberer/unterer Zuschnitt oder ganz aussetzender Zuschnitt; Herauszoomen vermutet, Neustart und Include/Exclude ohne gesicherten Zusammenhang. Originaltestfall ist die [Fuchs-PDF von 2024](https://chatgpt.com/library?file_id=libfile_d3dc9d4475a08191ad96d382cd5d9ad3&account_id=personal). Die ursprüngliche freie Beobachtung war nicht vollständig reproduzierbar.

Ein konkreter Zustandsfehler wurde mit dieser PDF nachgestellt: Beim Fit-eigenen Skalierungsereignis war der neue Fit-Snapshot noch nicht gespeichert, sodass die gemerkte Leseansicht fälschlich als manuell eingestuft wurde. Nach Herauszoomen über Zoomknöpfe und Rückkehr aus Wrapped wurde dann nur die alte Zoomstufe wiederhergestellt, ohne aktiven Fit und ohne Clipping. Ein Pinch, der im äußeren Seitenzwischenraum beginnt, besitzt außerdem keinen Pointerdown auf einer PDF-Seite und konnte deshalb denselben gespeicherten Ausgangszustand verlieren.

Ab Build 303 werden abgeschlossene Fits ausdrücklich als Leseansicht gespeichert; eigene Fit-Skalierungen überschreiben diesen Zustand nicht als manuell. Der vorherige Fit wird auch ohne Pointerdown auf einer Seite vor dem ersten manuellen Skalieren festgehalten. Wrapped stellt Modus, Randgröße, Include/Exclude und Zuschnitt gemeinsam wieder her. Explizites Off verwirft den alten Fit, damit er beim nächsten Tippen nicht unerwartet zurückkommt.

Neue Browserfälle verwenden echte Touch-Tipps und einen Pinch mit beiden Fingern außerhalb der PDF-Seite; der Zoom-Ausgangszustand wird nicht künstlich eingespeist. Die Original-Fuchs-Seiten 6/100/201/206/207/208/301/411 werden auf vierseitiges Clipping, Seitensprünge, Include/Exclude, Wiederherstellung und erneutes Öffnen geprüft. Die eigentliche Rahmen-/Paritäts-/Fußnotenlogik und Scrollmathematik bleiben bytegleich zu Build 302. Der belegte Zustandsfehler ist damit adressiert; die genaue ursprüngliche sporadische Gerätefolge und weitere unbekannte Varianten bleiben bei der Geräteprüfung zu beobachten.

### F27: Sicherer oberer Leseanker bei Displaykameras

Meldung: Beim Scrollen und Blättern konnte lesbarer Text unter der eingebauten Displaykamera liegen. Auf Geräten mit gemeldeter Displayaussparung erhält die PDF-/HTML-WebView nun einen festen Sicherheitsbereich aus der Statusleistenhöhe unabhängig von ihrer Sichtbarkeit und der tatsächlichen Aussparung auf allen Seiten. Geräte ohne Aussparung behalten die bisherige volle Lesefläche. Seitliche bzw. unten liegende Aussparungen bei Drehung werden ebenfalls berücksichtigt. Der Hintergrund dieses Bereichs entspricht der Material-Fläche des Themes.

Die schwebenden Leisten verändern diesen Sicherheitsbereich nicht. Die eigentliche WebView-Lesefläche beginnt darunter; vorhandene Fits, Seitennavigation und SmartScroll verwenden dadurch dieselbe sichere Fenstergröße. Der PDF-Inhaltsrahmen und gespeicherte Annotationskoordinaten werden nicht verschoben. EPUB behält seine bisherige native Aufteilung. Eine simulierte obere Aussparungsfläche von 42 CSS-Pixeln wird im Browser zusammen mit Leistenwechseln und Hardware-Blättern in allen drei Scrollmodi geprüft. Die native Compose-Anbindung ist erfolgreich kompiliert; eine echte physische Kameraaussparung wird hier nicht als getestet behauptet.

258 Reader-Tests, 89 Android-Tests in 20 Suiten sowie alle sieben Browserprüfungen sind bestanden. Die sechs neuen Thread-Tests lassen die Main-Thread-Prüfung des ViewModels aktiviert; lediglich die künstliche Coroutine-Debug-Umbenennung von JVM-Testthreads ist ausgeschaltet. APK-Identität und Nachweise stehen in BUILD_STATUS.md, BUILD_VERIFICATION.json und qa/. Die vorliegenden Original-PDFs und internen Screenshots werden nicht im Quellarchiv veröffentlicht.

## Neue Bedienwege in Build 302

**F16 Satzende und Schnellpalette:** Direktes Wortmarkieren schließt angehängte Satzzeichen einschließlich Punkt und schließender Anführungszeichen ein. Die Erweiterung überschreitet weder echte Leerzeichen noch Zeilen-, Fluss- oder Rotationsgrenzen; normale Android-/Desktop-Auswahl bleibt unverändert. Die Palette hat drei gleich breite, vollständig antippbare Bereiche: Highlight, mittiges abgerundetes X zum Löschen, Underline. Das Löschen verwendet den vorhandenen Annotationsmanager einschließlich normalem Speichern/Sync; Auswahl und Pointerzustand werden bereinigt. Kommentare/Tags bleiben beim Moduswechsel erhalten.

**Langer Druck:** Langes Drücken auf eine editierbare Annotation öffnet dieselbe Schnellpalette erneut, ohne ein Duplikat anzulegen oder sofort das native Bearbeitungsfenster zu öffnen. Farben und Löschen funktionieren auch für Notizen; Highlight/Underline sind bei ungeeigneten Annotationsarten deaktiviert. Native Größen-/Auswahlgriffe und das Verschieben bereits ausgewählter Notizen/Ink/Text behalten Vorrang. Schreibgeschützte und externe Annotationen werden nicht verändert. Der Weg funktioniert auch mit Android-Auswahlmodus und sichtbaren Leisten.

**F26 Lupe:** Während des direkten Ziehens erscheint eine kleine, abgerundete Lupe mit vergrößertem Seiteninhalt, Auswahlvorschau und Positionsstrich. Sie kopiert einen kleinen Ausschnitt des bereits gerenderten PDF-Canvas, ohne erneute PDF-Analyse oder permanente Animationsschleife. Loslassen, Mehrfinger-Geste, Abbruch, Fenster-/Dokumentwechsel und Größenänderung entfernen sie wieder. Sie fängt keine Eingaben ab.

**F25 Share Document:** Im Info-/Eintragsdetailfenster erscheint beim langen Drücken auf einen Dateianhang zusätzlich `Share Document`/`Dokument teilen`. Ein fehlender Download wird über den vorhandenen Dateidownloader geholt; danach öffnet sich die Android-Teilenansicht. PDF, EPUB und andere Dateianhänge verwenden ihren passenden MIME-Typ, `content://`-URI und vorübergehenden Lesezugriff. Es wird kein Schreibzugriff erteilt. Die gespeicherte Originaldatei bleibt unverändert. Separat gespeicherte Zotero-Annotationen werden in diesem Schritt nicht zusätzlich eingebettet; eine spätere PDF-Exportoption mit Annotationen kann denselben Teilen-Endpunkt nutzen. Kein zusätzlicher Knopf in der Floating Toolbar.

**Aussparung/Statusleistenbereich:** Das Annotationsfenster malt seine Material-Hintergrundfläche vor der Insets-Polsterung und berücksichtigt zusätzlich Displayaussparungen. Auch während des Ladens wird die Fläche gefüllt, sodass der PDF-Hintergrund nicht im oberen freien Bereich durchscheint. Farbe entspricht der Oberfläche des aktuellen Annotationsfensters.

**Recherche:** [Zotero Android PR #205](https://github.com/zotero/zotero-android/pull/205), „Add the ability to share downloaded attachments“, beschreibt genau den langen Druck in den Eintragsdetails. Am 3. November geschlossen und nicht gemergt. Die eigene Umsetzung nutzt den aktuellen Downloader und AndroidX FileProvider und hängt nicht vom entfernten PDF-SDK ab. Auch EPUB ist als normale Datei teilbar. Die Android-Teilenansicht und die Aussparungsdarstellung müssen zusätzlich am physischen Gerät überprüft werden; keine Geräteprüfung behauptet.

Die bisherigen Zuschnitt-, Randreferenz-, Wrapped-, Scroll-, Bookmark-, Tag- und Vollbildpfade bleiben erhalten. F19 Autocomplete, F22 manueller Zuschnitt All/Odd/Even und F23 Randtippen bleiben offen. 258 Reader-Tests und 83 Android-Tests in 19 Suiten sowie alle sechs Browserprüfungen sind bestanden. Nachweise stehen in BUILD_STATUS.md, BUILD_VERIFICATION.json und qa/. Androids tatsächliche Teilenansicht und die Aussparungsfläche müssen noch am physischen Gerät geprüft werden.

## Nachbesserungen in Build 301

**F07 römische Editionsreferenzen:** Die konkrete Screenshot-Stelle liegt auf PDF-Seite 133 der gelieferten Kant-Datei. Bisher erkannte der A-/B-Referenzzweig nur arabische Zahlen; `BXLI` blieb stehen, während `B XLII`/`B XLIX` in einzelnen OCR-Objekten mit dem Haupttext verbunden wurden. Kanonische römische Folioangaben werden jetzt vor dem Zusammenführen von Textspannen als Randreferenzen behandelt. Auch das Auftrennen eines kombinierten OCR-Objekts verwendet denselben A-/B-Erkenner und weiterhin Zeichenposition, Grundlinie und die getrennte Randspalte. Bloße römische Zahlen, gewöhnliche Wörter wie `bill`, Fließtext und Fußnoten werden dadurch nicht pauschal entfernt.

**Exclude/Include auf Nachbarseiten:** Bereits analysierte Seiten erhalten ihre Anzeige-Masken über denselben auf 32 Seiten begrenzten Inhaltscache. So werden Randreferenzen auch auf gleichzeitig sichtbaren Nachbarseiten ausgeblendet. Einschließen entfernt die Masken sofort wieder; Drehungen verwenden dieselben normalisierten PDF-Rahmen. PDF-Datei, gespeicherte Markierungen und Fußnoten werden nicht verändert.

**Ansichtsknöpfe:** Die volle lokalisierte Beschriftung wird mit aktueller Schrift, Schriftgröße und verfügbarer Breite gemessen, einschließlich des Platzes für das Häkchen. Passt sie nicht einzeilig, erscheinen Initialen, etwa `M` statt `Medium` oder `FTC` statt `Fit to Content`. Bei gleichen Initialen werden unterscheidbare kurze Präfixe verwendet, etwa `Ke`/`Kl` für `Keine`/`Klein`. Keine Verkleinerung der Schrift und kein zweizeiliges Anwachsen beim Auswählen. Die Mindest-Touchhöhe bleibt 48 dp; der vollständige Name bleibt als Bedienungshilfe erhalten. Nur bei extrem knapper Breite darf das Häkchen zugunsten des Textes entfallen; die ausgewählte Material-Fläche und der Auswahlzustand bleiben bestehen.

**Prüfung:** Neue Regressionen prüfen die Original-Kant-Seiten 133/134/140 einschließlich `BXLI`, `B XLII`, `B XLIX`, `B L`, Include/Exclude, beider vollständiger Fußnoten der Screenshot-Seite, Nachbarseiten, drei Scrollmodi und alle Bildschirmdrehungen. 254 Reader-Tests, 81 Android-Tests und alle fünf Browserprüfungen sind bestanden. Die bisherigen Original-PDF-Fälle wurden erneut geprüft; Nachweise stehen in BUILD_STATUS.md und BUILD_VERIFICATION.json. Die native Knopfdarstellung ist kompiliert und in der Label-Logik geprüft, aber nicht auf einem physischen BOOX visuell getestet. SDK-Freiheit und Update-Identität bleiben erforderlich. F19/F22/F23 und die übrigen offenen Erweiterungen bleiben unverändert im Backlog.

## SDK-Entfernung in Build 300

**F24 umgesetzt:** PSPDFKit/Nutrient ist aus Build-Konfiguration, Startinitialisierung, Manifest, Herstellerklassen, altem Reader und Laufzeitdateien entfernt. Der aktive Zotero-/PDF.js-Reader samt vollständigem Reader-Paket bleibt bytegenau auf dem Stand von Build 299. Die aktuellen Fit-Modi einschließlich Randreferenzen, Wrapped-Auswahl, SmartScroll, direktes Markieren, Palette, Quick Tags, Bookmark-Notizen, Vollbild und schwebende Leisten behalten ihre Implementierung.

Gemeinsame Typen und Helfer sind SDK-unabhängig: dieselben sechs Zotero-Annotationsarten, direkte `ReaderAnnotation`, ursprüngliche Farb-/Alpha-Logik, identisches Sortierindexformat und AndroidX-Parcelable-Zugriff. AndroidX WebKit und Compose Material werden jetzt direkt in genau den Versionen aus Build 299 eingebunden. Paketkennung, Signierschlüssel, Speicherpfade, Realm-/Syncformat und Einstellungen bleiben erhalten; keine Neuinstallation oder Datenrücksetzung vorgesehen.

F19 Autocomplete, F22 manueller All/Odd/Even-Zuschnitt, F23 Randtippen und die optionalen Stifterweiterungen bleiben offen und technisch anschlussfähig. Die nativen Reader-/TagPicker-Pfade, Pointer-Brücke, Rahmen-/Paritätslogik und PDF-/Document-Worker wurden dafür erhalten. Einzelheiten und Prüfung: `SDK_REMOVAL.md`, `BUILD_STATUS.md`, `BUILD_VERIFICATION.json`, `qa/`. Kein physischer BOOX und kein echter Kontosync geprüft. Keine Veröffentlichung auf GitHub beauftragt.

## Nachbesserungen in Build 299

**Sidebar und Leisten:** Bei geöffneter Sidebar zeigt die obere Leiste wieder einen durchgehenden, undurchsichtigen Hintergrund. Die zwei schwebenden Gruppen werden nur bei geschlossener Sidebar verwendet. Der Reader selbst behält seine volle Fläche.

**Erster PDF-Tipp:** Bei sichtbaren Leisten blendet ein kurzer Tipp im PDF zuerst die Leisten aus und öffnet keine Annotation oder Verknüpfung. Der nächste Tipp funktioniert normal. Der Reader meldet dafür ausdrücklich „ausblenden“, statt die Sichtbarkeit umzuschalten; eine verspätete Rückmeldung kann die Leisten deshalb nicht erneut öffnen. Eingabefelder und Paletten behalten ihre Bedienung. Langes direktes Markieren behält seine 450-ms-Erkennung; Scrollen, Stiftgesten und mehrere Finger werden weitergegeben.

**F07 Fit to Width:** Drei Bezüge: `PDF page`, `Text`, `Text + crop`. Die dritte Variante verwendet genau denselben Breitenzoom wie `Text`, blendet aber oben/unten Papier außerhalb des Textbereichs aus. Sie passt die Höhe nicht auf den Bildschirm ein; langer Text bleibt vertikal scrollbar. SmartScroll verwendet bei dieser Variante die Inhaltsgrenzen und überspringt ausgeblendete Papierstreifen. `Text` lässt weiterhin die ganze Papierhöhe erreichbar. Die vorhandenen vier Hauptmodi und ihre Ränder bleiben bestehen.

**Zeilen- und Editionsangaben:** Unter den Rändern gibt es eine eigene Auswahl `Line and edition references → Exclude / Include`. Sie gilt für Inhaltsfit und Textbezug der Achsenfits, unabhängig von der Randgröße. Seitentitel, Seitenzahlen und Download-Footer werden weiterhin gesondert erkannt; Fußnoten bleiben immer Inhalt. Beide Rahmenvarianten werden aus derselben Seitenanalyse gecacht. Erkannte Randreferenzen werden bei Exclude zusätzlich durch eine reine Anzeigeebene verdeckt, damit weder ein außenstehender Fußnotenmarker noch größere Margins halbe Zahlen sichtbar lassen. Diese Ebene liegt unter den normalen Annotationen und verwendet die aktuelle Papierfarbe. Bookmarks verwenden weiterhin den ungerandeten Inhaltsrahmen ohne Randreferenzen.

**Konkrete PDF-Korrekturen:** In Höffes Klassiker-Auslegen-Datei blieb ein grafischer Strich zwischen Seitenzahl und Autor nach dem Entfernen der Kopftexte übrig. Er wird jetzt nur dann zusammen mit der Kopfzeilenhöhe entfernt, wenn dort kein beizubehaltender Text überlappt. Bei Kant werden getrennte Randreferenzen vor dem Zusammenführen von Textspannen separiert. Zusammengefasste OCR-Textobjekte mit angehängter kleinerer Zeilenzahl werden anhand der tatsächlichen Zeichenpositionen und Grundlinie getrennt; hochgestellte Fußnotenmarker bleiben bestehen. Eckige Editionsreferenzen wie `[372]` werden ebenfalls berücksichtigt. Getrennte gerade/ungerade Profile bleiben erhalten.

**Prüfung:** 250 Reader-Einheitstests und Browserprüfungen für vorhandene Funktionen, Gesten, Stabilität, alle Fit-Modi und die neuen Bedienelemente. Die bereitgestellte Höffe-Datei wurde auf PDF-Seiten 26/27 und 191/192 geprüft, die Kant-Datei auf 369/370 und 380/381. Die Höffe-Oberkante liegt danach bei rund 9,76 % statt am Kopfstrich bei rund 4,83 %. Kant zeigt beim Einschließen der Randreferenzen den entsprechend breiteren Rahmen; die unterste Inhaltszeile/Fußnoten bleiben erhalten. Original-Mul liegt in diesem Arbeitsstand nicht erneut vor; dafür wird kein neuer konkreter Test behauptet. Android-Testergebnis und technische Update-Prüfung stehen nach Abschluss in BUILD_STATUS.md und BUILD_VERIFICATION.json. Physischer BOOX und tatsächlicher Kontosync sind nicht geprüft.

**Damals nächster eigener Schritt, inzwischen in Build 300 umgesetzt:** PSPDFKit/Nutrient vollständig aus der Android-App entfernen. Der aktuelle Reader verwendet PDF.js; alter Reader, Startinitialisierung und gemeinsame SDK-Typen/Hilfsfunktionen bleiben in Build 299 vorhanden. Erst die aktuelle Version am Gerät bewerten, dann diese Abhängigkeiten gezielt ersetzen und alle bisherigen Funktionen erneut prüfen. Keine Veröffentlichung auf GitHub oder öffentliche APK-Verteilung in diesem Auftrag.

## Nachbesserungen in Build 298

**Vollbild:** PDF/HTML belegen durchgehend die volle Fläche der Edge-to-Edge-Activity. Die in Build 297 dauerhaft reservierten Systemleisten-Ränder sind entfernt; die schwebenden Bedienelemente liegen darüber. Systemleisten werden nach dem Compose-Commit sowie bei Rückkehr von Fenstern, Dialogen und App-Hintergrund erneut gemäß der Toolbar-Sichtbarkeit gesetzt. Beim Verlassen des Readers werden sie wieder gezeigt. Die Sidebar berücksichtigt ihren eigenen Statusleistenabstand; dadurch bleibt die PDF-Geometrie konstant. Echte BOOX-Darstellung muss am Gerät geprüft werden.

**Motero-Symbol:** Das Z ist durch ein geometrisches, kräftiges M ersetzt. Adaptives Symbol und Legacy-PNGs in fünf Dichten verwenden den ursprünglichen Rotverlauf `#ff6666` → `#db2c3a`, weißen Hintergrund und dieselben Proportionen. Das monochrome Symbol verwendet dieselbe M-Geometrie. Paketkennung und Signierschlüssel bleiben unverändert. Vektorquelle und reproduzierbarer Export sind im Quellarchiv enthalten.

**F16 Moduswahl:** Highlight und Underline belegen jeweils die vollständige linke bzw. rechte Hälfte der unteren Palettenzeile. Originalsymbole sind in ihrer Hälfte zentriert, die gesamte Fläche ist antippbar. Native Werkzeugwahl und normale Zotero-Konvertierung bleiben erhalten. Browser-Touchprüfungen verwenden ausdrücklich die äußeren Ränder beider Schaltflächen.

**F20 neue Ausrichtung:** Die Mittelpunkte der äußersten Hashtag-Symbole liegen direkt unter den Mittelpunkten der äußersten Highlight-Farbpunkte. Zwischenliegende Tags sind gleichmäßig verteilt; ein einzelner Tag steht mittig. 48-dp-Höhe bleibt erhalten, Breite passt sich der Zahl der Tags und dem Fenster an. Diese neue Anforderung ersetzt die bisherige Ausrichtung an erweiterten Farbfeldgrenzen.

**Obere Inhaltskante:** Zusammenhängende, bis zu dreizeilige kleine Kopfbereiche werden als Block erkannt. Zusätzlich zu gemeinsamen Mustern können gerade/ungerade PDF-Seiten eigene Kopfzeilenmuster aus mindestens drei passenden Stichprobenseiten bilden. Unterschiedliche Titel und einzelne Kapitelanfänge stören das Modell dadurch weniger. Kleine Kopfzeilen können bis 18 % der Seitenhöhe berücksichtigt werden; echte größere Kapitelüberschriften und gewöhnliche erste Absätze bleiben erhalten. Überlappende Schriftkästen werden als fortlaufender Text erkannt und nicht als künstliche Weißraumlücke verwendet. Fußnoten bleiben Inhalt.

240 Reader-Tests und die Browserprüfungen einschließlich einer neuen mehrzeiligen Kopfzeilen-Fixture sowie der originalen Mul-PDF sind bestanden. In Mul bleibt der Inhaltsbeginn auf den geprüften PDF-Seiten 250/251 bei 10,44 % der Seitenhöhe; der laufende Kopf wird ausgeschlossen. Die konkrete neu erwähnte Problem-PDF wurde nicht mitgeschickt, daher ist dieser Einzelfall nicht verifiziert. Heuristische Erkennung kann mehrdeutige Randtexte erhalten. 73 Android-Tests sind ebenfalls bestanden. Paketkennung und Signierer sind identisch zu Build 297, Code 298 erhöht, Signatur/Ausrichtung geprüft; beide M-Vektoren, fünf Rasterdichten und unveränderter Rotverlauf sind direkt an der APK geprüft. Nachweise und Hashwerte stehen im finalen Prüfbericht. Kein physischer BOOX-Test oder echter Kontosync behauptet.

F19 Autocomplete, F22 manuelles Zuschneiden und F23 Randtippen in allen Modi bleiben offen. Die übrigen bestehenden Funktionen und IDs bleiben erhalten. Grundrecherche weiterhin vom 28. Oktober; keine neue PR-Recherche für dieses Update.

## Nachbesserungen in Build 297

Seitenwechsel mit aktivem Fit bereiten die Geometrie der Zielseite vor dem sichtbaren Wechsel vor. Navigation, Skalierung, Zentrierung und gegebenenfalls Clipping erfolgen zusammen, ohne dazwischen eine ungepasste Seite zu zeichnen. Eine neue Eingabe verwirft eine noch wartende Anpassung. Nachbarseiten werden mit begrenztem Vorlauf im vorhandenen Cache vorbereitet. Die Wrapped-Übersicht nutzt denselben vorbereiteten Einstieg.

Die obere Android-Leiste liegt bei PDF/HTML als zwei abgerundete Material-Flächen über der Ansicht: links Zurück/Sidebar/Lesemodus, rechts Zeichnen/Suche/Einstellungen. Die Mitte bleibt transparent und für PDF-Eingaben frei. Ein-/Ausblenden der Leiste und Systemleisten ändern die PDF-Fensterhöhe nicht mehr. Sidebar und Zeichenleiste berücksichtigen den Platz der schwebenden Buttons. EPUB behält seine bisherige Leiste.

Beim Löschen einer ausgewählten Annotation werden Reader-Auswahl, Pointer-/Drag-Zustand, wartende Eingaben und das zugehörige native Annotationsfenster bereinigt. Ein verspätetes Schließen eines älteren Fensters darf eine neue Auswahl nicht löschen. Die bestehenden Kommentar-/Tag-Speicherwege bleiben erhalten.

Die Drag-Palette verwendet unverändert die acht Zotero-Originalfarben (`#ffd400`, `#ff6666`, `#5fb236`, `#2ea8e5`, `#a28ae5`, `#e56eee`, `#f19837`, `#aaaaaa`): runde Farbpunkte ohne schwarze Kästen, Theme-Farben, kleiner Zeiger und Originalsymbole für Highlight/Underline darunter. Der Werkzeugwechsel verwendet Zoteros reguläre Konvertierung: neue Annotations-ID, alte ID löschen, Text/Kommentar/Tags/Position übernehmen. Er ändert keinen unveränderlichen Annotationstyp unter derselben ID. Weitere direkte Markierungen übernehmen das gewählte Werkzeug im geöffneten Dokument; explizite native Werkzeuge haben Vorrang. Der native Löschpfad ist auf Annotationen des geöffneten Anhangs begrenzt.

F05/F20: Farbfelder und Quick Tags haben keine schwarzen Rahmen mehr. Die Sidebar-Farben stehen ohne zusätzlichen Zwischenraum nebeneinander; die Touchflächen bleiben erhalten. Auswahl wird durch dezente Material-Fläche und Häkchen kenntlich. **Für künftige UI-Änderungen gilt:** Zotero-/Material-Design, Originalfarben und -symbole, zurückhaltende Flächen/Trennlinien; keine schweren schwarzen Kästen. Touchgrößen erhalten.

F18: Lesezeichen liegen immer am ungerandeten erkannten Inhaltsrahmen, unabhängig von Off/Content/Width/Height und gewählter Margin. Die rechte Markerkante liegt 8 PDF-Punkte innerhalb der Inhaltskante, die obere 4 Punkte unter dem Inhaltsbeginn; bei sehr kleinen Rahmen wird die Position begrenzt. Gedrehte Seiten verwenden die visuelle obere rechte Ecke. Erneuter Shortcut öffnet die vorhandene datierte Notiz und versetzt nur diese bei Bedarf. Normale andere graue Notizen und schreibgeschützte Notizen werden nicht versetzt. Kein Massenverschieben vorhandener Annotationen. Der erste Shortcut kann bei bisher manueller Ansicht die erste Inhaltsanalyse abwarten.

Bild-PDFs: Bei überwiegend neutralgrauem Papier und mindestens acht getrennten textähnlichen Zeilenbändern wird der Papierhintergrund vor der Bild-Randanalyse normalisiert. Ein reproduzierbares eingebettetes Bild-PDF mit null Textobjekten wird im Browser geprüft, einschließlich tiefer Fußnotenzeilen. Farbbilder und ein graues Foto ohne solche Bänder bleiben konservativ. Keine neue OCR; schräge/verrauschte Scans und semantische Kopf-/Footer-Unterscheidung ohne Textschicht bleiben eingeschränkt. Fußnoten gehören weiterhin zum Inhalt. Fit to Content schneidet ausschließlich die Ansicht zu, nicht die PDF-Datei.

233 Reader-Tests und die Browserprüfungen für Gesten, bisherige Funktionen, Fit-Modi einschließlich Original-Mul sowie die neuen Stabilitätsfälle sind bestanden. 73 Android-Tests und der APK-Vergleich gegen Build 296 sind ebenfalls bestanden: gleiche Paketkennung und gleicher Signierer, Code 297, v2-Signatur, ZIP-Ausrichtung und unveränderte weitere Laufzeitpakete. Signatur, Hashwerte und Nachweise stehen in BUILD_STATUS.md und BUILD_VERIFICATION.json. Keine physische BOOX- oder echte Kontosynchronisationsprüfung. F19 Autocomplete, F22 manueller Zuschnitt und F23 Randtippen in allen Modi bleiben offen.

## Neue Fit-Modi in Build 296

Vier eindeutige Modi: Off, Fit to Content (ganzer Inhalt in Breite und Höhe), Fit to Width und Fit to Height. Bei den beiden Achsenmodi kann zwischen Papier und Inhalt plus None / Small / Medium / Large gewählt werden. Width lässt die ganze Papierhöhe erreichbar, Height die ganze Papierbreite. Eine bereits aktive Auswahl wird beim erneuten Antippen neu angewendet. Manueller Zoom hebt den aktiven Fit auf; die Wrapped-Übersicht stellt beim Seitentipp den vorherigen Fit wieder her. Fit arbeitet mit Einzelseiten; Doppelseitenanzeige und automatischer Einzelseitenfit schließen sich aus.

Inhaltsmodell aus bis zu vier benachbarten Seitenpaaren nahe der Dokumentmitte, getrennte horizontale Profile für gerade und ungerade PDF-Seiten, gemeinsame typische Lesebreite für gleichartige Buchseiten. Jede neu besuchte Seite wird einmal zusätzlich auf breitere Inhalte oder tiefere Fußnoten geprüft; bis zu 32 Seitenergebnisse sind zwischengespeichert. Keine neue Analyse aller Stichprobenseiten bei jedem Blättern. Rotationen verwenden den gedrehten Rahmen derselben natürlichen Leseorientierung.

**Fußnoten einschließlich Trennlinien bleiben Inhalt.** Kopfzeilen, separate Zeilen-/Editionenzahlen und eindeutige Downloadmetadaten werden nach Inhalt und Seitengeometrie erkannt. Wiederholung oder eine tiefe Position allein entfernt keine Fußnote. Ein JSTOR-Link kann eine Fußnote sein und bleibt ohne erkannten Downloadblock erhalten. Uneindeutige Texte werden beibehalten. Reine Scans ohne verwertbare Textschicht bleiben bei der semantischen Randunterscheidung eingeschränkt; manuelle Korrektur folgt später. Die PDF selbst bleibt unverändert.

Historischer Stand 296: Marker sollten künftig relativ zum Inhaltsrahmen platziert werden. Damals noch nicht umgesetzt; normale graue Notizen bleiben an ihrer bisherigen Papierecke. Auch ein enger Fit kann sie deshalb noch aus dem sichtbaren Ausschnitt entfernen. Die erkannten Seitenrahmen stehen als Grundlage bereit. Randtippen in allen Scrollmodi und manueller Zuschnitt bleiben nächste Schritte.

229 Reader-Tests und 73 Android-Tests sowie Browser-Gesten-, Funktions- und neue Fit-Prüfungen sind bestanden. Die zugehörige APK wurde gegen Build 295 auf identische Paketkennung und Signatur sowie einen höheren Versionscode geprüft; die Nachweise stehen in BUILD_VERIFICATION.json des Quellpakets. Die Fit-Prüfung verwendet eigene PDFs und die originale Mul-PDF. Keine physische BOOX-Prüfung oder echte Kontosynchronisation behauptet. Die APK erhält Paketkennung und Signatur der Vorgängerversion und hat Versionscode 296.

## Historie: Nachbesserungen in Build 295

Der Nutzer bestätigte die übrigen Änderungen aus Build 294. Die Quick-Tag-Grenzen werden gemäß seiner Präzisierung pro Seite einen halben Mittelpunktabstand außerhalb der äußersten Highlight-Farbe gesetzt. Bei der vorhandenen SpaceEvenly-Anordnung ist der äußere Einzug der Tag-Reihe damit halb so groß wie der Zwischenraum von der Fensterkante bis zum äußersten Farbkreis. Bis zu neun Tag-Felder bleiben zentriert und vollständig sichtbar.

Nach der Farbwahl in der kleinen Drag-Highlight-Palette öffnet der erste folgende Tipp wieder das Annotationsfenster. Der Fehler wurde an Build 294 nachgestellt: Das Pointerdown-Ereignis einer Palettentaste setzte den globalen PDF-Zeigerzustand; das zugehörige Loslassen erreichte ihn wegen der Paletten-Ereignisbehandlung nicht. Die Korrektur ignoriert Android-Paletteneingaben vor dem Start einer PDF-Aktion. Regressionen prüfen den ersten Tipp nach Maus- und Touch-Farbwahl und die erneute Auswahl nach Done. Das direkte Markieren selbst bleibt unverändert.

Der sichtbare App-Name lautet Motero. Die technische Update-Identität bleibt erhalten. Zuschnitt, gerade/ungerade Ausrichtung und sonstige offene Features sind weiterhin zurückgestellt.

## Nachbesserungen in Build 294

Der Nutzer bestätigte die gut funktionierende Wrapped-Seitenauswahl und Bookmarks in Build 293. Dieses Update bündelt die danach beauftragten Korrekturen: Nach Done bzw. Schließen wird die passende Annotation in Android und Reader abgewählt. Ein verspätetes Schließereignis eines anderen Highlights lässt eine neuere Auswahl bestehen. Quick Tags haben keine Überschrift mehr, erhalten die vorhandenen Formular-Trennlinien und sind innerhalb der äußeren Grenzen der Highlight-Farbreihe zentriert. Alle bis zu neun Tag-Felder bleiben sichtbar. Der Originaltext steht ohne Überschrift und Kasten als eingerücktes Blockzitat zwischen denselben Trennlinien.

F17 verwendet 50 % Deckkraft. F18 nutzt die rechte Hälfte des oberen Elftels des Reader-Bereichs bis zum äußeren Rand und hat dort Vorrang vor dem Blättern. Neue Marker sitzen unabhängig von Tippkoordinate und Zoom visuell oben rechts auf der PDF-Seite, etwa 1 cm vom rechten Papierrand und 4 PDF-Punkte unter dem oberen Rand. Der sichtbare Abstand skaliert mit dem PDF-Zoom. Ein vorhandenes datiertes Lesezeichen derselben Seite wird geöffnet; vorhandene Marker werden nicht nachträglich verschoben. Die Seitenauswahl in der Wrapped-Übersicht sowie vorhandene Links/Annotationen behalten Vorrang.

Fit to Content, Fit to Width, Randgrößen und die gesonderte Ausrichtung gerader/ungerader Seiten sind ausdrücklich zurückgestellt und bleiben in diesem Update unverändert. Aktuell werden bis zu acht Seiten über das ganze Dokument verteilt gemeinsam ausgewertet, nicht die mittleren zehn Prozent. Der gemeinsame Rahmen kann bei versetztem Buchsatz breiter als der einzelne Textblock sein. Als spätere Verbesserung sind eine stabile gemeinsame Lesebreite und getrennte horizontale Ausrichtungen gerader/ungerader Seiten zu untersuchen; noch nicht implementiert.

## Was ein Paket bedeutet

| Paket | Zweck | Android vollständig neu kompilieren? |
|---|---|---|
| 0 | Geräte- und Tastatureinstellungen ausprobieren | Nein, keine neue APK |
| A | Priorität: Positionsfehler und Wrapped-Seitenauswahl | Voraussichtlich nein: Reader bauen, Reader-Assets und Hash in APK aktualisieren, ausrichten und mit bisherigem Schlüssel signieren |
| B | Spätere Reader-Verbesserungen: Farbbox, Lesekante, Lesezeichen-Shortcut, Stifte und Darstellung | Für den Reader-Kern voraussichtlich nein; neue native Einstellungen gehören zu C |
| C | Gesammelte Änderungen der nativen Android-Oberfläche | Ja, einmal für das gesamte Paket |
| D | Desktop-Plugin bzw. Bearbeiten der PDF am Desktop | Keine Änderung der Android-App |
| E | Experimente mit Druckdaten, Hardwaretasten oder BOOX-SDK | Je nach Teil Reader oder Android; SDK-Integration benötigt Android-Neubau und Tests am Gerät |

Ein Reader-Update ist weiterhin eine neue installierbare APK. Es ersetzt nicht nur eine Datei auf dem Boox. Der geplante Schnellweg vermeidet die erneute Kompilierung der unveränderten Android-App. Der Reader wird über `assets/reader/reader.zip` ausgeliefert; der geänderte `reader_hash.txt` veranlasst den vorhandenen ReaderLoader zum Aktualisieren der entpackten Reader-Dateien. Paketierung, Ausrichtung und Signatur müssen geprüft werden. Dieser Schnellweg ist im Quellcode begründet, aber noch nicht als neuer Reader-only-Updatezyklus auf dem physischen Gerät getestet.

Die Leistenkopplung selbst ist eine kleine Änderung. Ein nativer Neubau muss nicht wieder drei Stunden dauern. Der vorherige Aufwand wurde durch den ersten vollständigen Build, Bibliotheksverarbeitung und Verbindungsabbrüche vergrößert. Caches und Ausführungsumgebung beeinflussen die tatsächliche Dauer. Deshalb keine feste Zeitgarantie und die native Oberfläche gesammelt in C ändern.

## Gesamttabelle

Aufwand: S = überschaubare Codeänderung, M = mehrere Eingabe-/Layoutfälle und Regressionstests, L = Integration mit größerem Testbedarf. Diese Angaben beschreiben Implementierung und Prüfung, keine garantierte Laufzeit.

| ID | Feature und gewünschtes Verhalten | PR / Plugin / Forum und Einordnung | Paket / Ebene | Aufwand / Priorität | Stand |
|---|---|---|---|---|---|
| F01 | **Positionsfehler beheben:** Beim Vor- und Zurückblättern bleiben Zoom und horizontaler Ausschnitt erhalten, besonders in Wrapped. | [Reader-PR #256](https://github.com/zotero/reader/pull/256) ist gemergt und behandelt ähnliche Sprünge über den Scrubber. [#254](https://github.com/zotero/reader/pull/254) betrifft den Wechsel des Scrollmodus. Teile sind bereits vorhanden; der Richtungs-/Tastenpfad in Wrapped fehlt in unserem Stand. Fehler an der Mul-PDF reproduziert. | **A, Reader** | S–M; in Build 293 umgesetzt | **Build 297; Fit-Wechsel stabilisiert** |
| F02 | **Wrapped-Seitenübersicht:** Herauszoomen, eine Seite antippen und mit bisherigem Lesezoom bzw. eingestellter Inhalts-/Seitenbreite dort einsteigen. Wrapped bleibt aktiv. | Kein passgenauer fertiger PR bei der Suche nach Wrapped/overview/click gefunden. Vorhandene Navigation und Zoomfunktionen sowie [Reader-PR #260](https://github.com/zotero/reader/pull/260) liefern Bausteine. Eigenständige Änderung nötig. | **A, Reader** | M; in Build 293 umgesetzt, mit F01 bündeln | **Build 297; vorbereiteter Fit-Einstieg** |
| F03 | **Handschrift zuverlässiger und mit weniger Zeichenarbeit:** Kurze Striche und Punkte erhalten; vorhandene Anmerkungen nicht bei jeder Stiftbewegung neu aufbauen. | [Reader-PR #263](https://github.com/zotero/reader/pull/263), offen, kein Draft. Konkrete Eingabe-/Renderoptimierungen und Tests vorhanden. [Zotero-Forum: Stiftverzögerung](https://forums.zotero.org/discussion/128717/free-drawing-with-pen-is-so-challenging-in-zotero-app-for-android-tablet). Gemeldete Tests des PR sind vor allem Desktop-Tests, keine Garantie für Boox-Latenz. | **B, Reader-Kern**. Ein neuer Android-Schalter und dessen Speicherung wären C. | M; sinnvoll nach A | Gezielt erweitert in 311/319; Druck-Gruppierung separat |
| F04 | **Stift zeichnet, Finger navigiert:** Im Zeichenmodus unbeabsichtigte Fingerstriche vermeiden, Finger zum Bewegen der PDF nutzen. | Kein passgenauer Palm-Rejection-PR gefunden. [#263](https://github.com/zotero/reader/pull/263) enthält verwandte Pointer-Verfolgung. Zuerst auf dem Gerät prüfen, ob Stift und Finger als unterschiedliche Eingabetypen in der WebView ankommen. | **B, Reader-Kern**; sichtbare neue Einstellung gegebenenfalls C | M; optional | Portable Eingabe in 319; Hardwareprüfung separat |
| F05 | **Farben direkt unten in der Annotations-Seitenleiste; eigener Tags-Knopf.** Farben an-/abwählen, mehrere Farben kombinieren, Tagfilter beibehalten. | Kein passgenauer Android-PR gefunden. Die Farb-/Tagfilterung und Farbauswahl existieren bereits in ReaderFilterScreen/ReaderFilterViewModel und können wiederverwendet werden. [Weavero](https://mjthoraval.github.io/Weavero/) bietet vergleichbare Filterideen am Desktop, ist kein Android-Plugin. | **C, native Android-Oberfläche** | S–M; vorgemerkt | **Build 297; rahmenlos/kompakter** |
| F06 | **Leisten koppeln:** Obere Bedienleiste und untere Seitenanzeige/-navigation gemeinsam ein- und ausblenden; obere Buttons schweben ohne PDF-Verschiebung in zwei abgerundeten Gruppen; bei offener Sidebar wieder durchgehend und undurchsichtig. | [Android-PR #348](https://github.com/zotero/zotero-android/pull/348) und [Issue #344](https://github.com/zotero/zotero-android/issues/344) sind verwandt. Der PR meldet Seitenwechsel an die Sichtbarkeitslogik; er ist nicht die vollständige gewünschte Kopplung. Unser Code unterdrückt den Scrubber noch separat. | **C, native Android-Oberfläche** | S; in Build 293 umgesetzt | **Build 299; Sidebar-Hintergrund und erstes Ausblenden** |
| F07 | **Echte Höhenanpassung und klare Fit-Modi:** Off, Content, Width und Height; Achsenfit mit PDF-/Textbezug und Rand, Width zusätzlich Text + crop; Randreferenzen separat ein-/ausschließen. | Eigenständige Implementierung mit gemeinsamer Inhaltserkennung und getrennter Ausrichtung gerader/ungerader Seiten. Frühere Recherche: [Android-Issue #330](https://github.com/zotero/zotero-android/issues/330). | **C + Reader** | Mit Fit-Korrektur gebündelt | **Build 299; Höffe/Kant konkret geprüft** |
| F08 | **Eigene Outline am Desktop erstellen und in die PDF speichern**, danach dieselbe Gliederung auf Android lesen. | [Jasminum](https://github.com/l0o0/jasminum) hat einen manuellen Outline-Editor und „Outline in PDF speichern“. [Bookmark Editor](https://github.com/gmf3/zotero-bookmark-editor) ist ein darauf basierender schlankerer Fork. [Zotero-Forendiskussion](https://forums.zotero.org/discussion/95515/feature-request-create-bookmarks-in-the-integrated-pdf-viewer). Versionskompatibilität vor Installation prüfen. | **D, Desktop**; Android nutzt die eingebettete Outline | Keine Android-Implementierung; gewünschter Weg | Offen / optional |
| F09 | **Markierungen einer Farbe zu einer Outline umwandeln:** Text/Kommentar als Titel, reale PDF-Seite und Position als Sprungziel. | [Foren-Workaround mit einer Farbe](https://forums.zotero.org/discussion/95515/feature-request-create-bookmarks-in-the-integrated-pdf-viewer). Der Farbfilter ergibt zunächst nur ein provisorisches Inhaltsverzeichnis. Kein passgenauer fertiger Farb-zu-PDF-Outline-Konverter in der Recherche verifiziert. Jasminums manueller Editor allein erledigt diese Konvertierung nicht. | **D**, falls später als Desktop-Erweiterung gewünscht; Android-Editor gestrichen | M; **zurückgestellt** | Offen / optional |
| F10 | **BOOX-App-Profil für Zotero:** Kontrast/Schrift und Refresh-Verhalten vergleichen; manuellen Vollrefresh gut erreichbar machen. | Offizielle [App-Optimierung](https://help.boox.com/fa5fa/af413/7b9a8), [Refresh-Modi](https://help.boox.com/fa5fa/66f00/fd1e1) und [Kontrast/Farbe](https://help.boox.com/fa5fa/66f00/5cc9a). Kein PR nötig. Verfügbarkeit und Bezeichnungen unterscheiden sich nach Modell und Firmware. | **0, Geräteeinstellung** | S; einfacher Versuch ohne Build | Offen / optional |
| F11 | **Handschrift als Kommentartext über die Systemtastatur**, statt alles frei auf die PDF zu schreiben. | [BOOX: Sprache und Eingabe](https://help.boox.com/fa5fa/23ee5/11b1d); [Zotero-Forenbericht zur BOOX-Handschrifttastatur](https://forums.zotero.org/discussion/110371/available-for-beta-testing-zotero-for-android/p2). Der Forenbericht betrifft ein anderes Boox-Modell. Prüfen, ob die eigene Firmware bzw. installierte Tastatur Handschrifterkennung anbietet. | **0, Tastatureinstellung** | S; optionaler Praxisversuch | Offen / optional |
| F12 | **E-Ink-Darstellung:** Deutlichere Rahmen, ausgewählte Farben klarer markieren, unnötige Animationen reduzieren. | [Android-Issue #296: E-ink optimizations](https://github.com/zotero/zotero-android/issues/296); [Forenbericht über schwach erkennbare UI-Ränder](https://forums.zotero.org/discussion/110371/available-for-beta-testing-zotero-for-android/p2). Allgemeine Anforderungen, kein fertig überprüfter Komplett-Patch. | Reader-CSS in **B**; native Leisten/Filter/Dialoge in **C** | S–M; zusammen mit dem jeweiligen Paket | Lokales App-/Reader-Profil in 319 |
| F13 | **Druckempfindliche Stiftbreite.** | [Reader-PR #264](https://github.com/zotero/reader/pull/264), **offener Draft**, abhängig von #263. Teilt einen Druckstrich gegebenenfalls in mehrere Anmerkungen auf. Cloud-Sync/Plugin-Interaktionen laut Autor nicht umfassend validiert. | **E**, Reader-Kern; Android-Schalter/Speicherung wäre C | M–L; zunächst nicht übernehmen | Offen / optional |
| F14 | **Stifttaste/Radierer zum schnellen Wechseln.** | [Android-Issue #106: Stylus eraser support](https://github.com/zotero/zotero-android/issues/106) und [Forenhinweise](https://forums.zotero.org/discussion/120043/pdf-annotation-post-zotfile-boox-or-other). Kein fertiger gerätespezifischer Fix verifiziert. Das konkrete vom InkSense-Stift gelieferte Ereignis muss gemessen werden. | **E**: Reader, wenn das Ereignis dort ankommt; andernfalls native Android-Anbindung | M; geräteabhängig | Hold/Toggle und Eraser-Tip in 319; Geräteprüfung separat |
| F15 | **BOOX-SDK für besonders schnelle Stiftvorschau oder kontrollierte Display-Refreshs.** | Offizielles [OnyxAndroidDemo](https://github.com/onyx-intl/OnyxAndroidDemo) mit WebView-Stiftbeispiel und [Pen-SDK](https://github.com/onyx-intl/OnyxAndroidDemo/blob/master/doc/Onyx-Pen-SDK.md). [Issue #321](https://github.com/zotero/zotero-android/issues/321) sammelt verwandte Latenzberichte. Kompatibilität mit Go Color 7 Gen II / InkSense ist damit nicht nachgewiesen. | **E, native Integration**, eigener Forschungsblock | L; kein kurzfristiger Schnellweg | Schnittstelle vorbereitet; SDK/Hardware weiter gesperrt |
| F16 | **Farbbox direkt nach dem Markieren:** Nach dem Loslassen erscheint unter der Textstelle eine kleine Palette. Antippen einer Farbe ändert unmittelbar die gerade erstellte Markierung. | Die Desktop-Farbauswahl ist bereits im [SelectionPopup](https://github.com/zotero/reader/blob/master/src/common/components/view-popup/selection-popup.js) enthalten. Die [Android-Anbindung](https://github.com/zotero/reader/blob/master/src/index.android.js) reicht Popup-Ereignisse bisher an die App weiter. Bei gezielter Suche kein passgenauer fertiger Android-PR gefunden. Für unseren direkten Markiermodus eigene Palette bzw. Anpassung nötig; kein Desktop-Plugin erforderlich. | **B, voraussichtlich Reader** bei eigener kleiner Palette in der WebView. Nutzung/Erweiterung des nativen Android-Popups wäre C. | S–M, vorläufig; **hoher Wunsch**, nach F01/F02 | **Build 298; zwei vollständig antippbare Modushälften** |
| F17 | **Lesekante nach dem Scrollen anzeigen:** Eine graue gestrichelte Linie mit 50 % Deckkraft kennzeichnet die vorherige untere Bildkante an ihrer neuen Position im Text; beim Rückwärtsscrollen entsprechend die vorherige obere Kante. Besonders für SmartScroll per Hardwaretaste. | Bei gezielter Suche kein passgenauer Reader-PR gefunden. [MobileRead: Scroll Mode in Onyx Boox](https://www.mobileread.com/forums/showthread.php?t=345411) beschreibt genau das Problem des Wiederfindens nach überlappenden Scrollschritten und eine NeoReader-Punktlinie. Dort wird auch fehlende Sichtbarkeit bei Fit to Width berichtet: Linie deshalb im sichtbaren Inhaltsbereich zeichnen. Vorhandene SmartScroll-Geometrie ist der direkte Ansatzpunkt. | **B, Reader / SmartScroll**; voraussichtlich ohne nativen Android-Neubau. Ein neuer nativer Einstellungsschalter wäre C. | S für Tastenschritte, M einschließlich freier Wischgesten; nach A gut mit F16 bündelbar | **Build 294, Nachbesserung** |
| F18 | **Lesezeichen / mehrere Lesestände:** Tipp in der rechten Hälfte des oberen Elftels, einschließlich Blätterrand, erzeugt eine graue Haftnotiz mit Datum und Uhrzeit an einer festen oberen rechten Position im ungerandeten Inhaltsrahmen. Darüber Seiten/Positionen wiederfinden; bestehende Notiz erneut öffnen und normal löschen. | Grau ist bereits eine [Standardfarbe des Readers](https://github.com/zotero/reader/blob/master/src/common/defines.js). Normale Notiz-Annotationen verwenden die vorhandene [Zotero-Speicherung und Synchronisierung](https://www.zotero.org/support/kb/annotations_in_database). Die [Bookmark-Forendiskussion](https://forums.zotero.org/discussion/95515/feature-request-create-bookmarks-in-the-integrated-pdf-viewer) enthält verwandte Annotations-Workarounds. Bei gezielter PR-Suche kein passgenauer fertiger Reader-PR für diese Tippzone mit datierter Haftnotiz gefunden. | **B, voraussichtlich Reader** für den Shortcut mit bestehenden Zotero-Notizen. Eigene native Bookmark-Liste/Knopf wäre C und zusätzliche Logik. Desktop benötigt für die normalen Notizen keine Anpassung. | S–M für den Shortcut, vorläufig; nach A sammeln. Eigenständiges Bookmark-System aufwendiger. | **Build 297; Inhaltspositionierung umgesetzt** |
| F19 | **Tag-Autocomplete nach Häufigkeit:** Passende vorhandene Tags oben anzeigen; den besten passenden Namen im Eingabefeld grau vervollständigen und mit Enter oder OK vollständig übernehmen. Häufigkeit in der aktuellen PDF bevorzugen, sonst Bibliothek. Vorschau etwa ab drei Zeichen; neue Tags weiterhin ausdrücklich anlegen können. | [TagPickerViewModel](https://github.com/zotero/zotero-android/blob/master/app/src/main/java/org/zotero/android/screens/tagpicker/TagPickerViewModel.kt) filtert bereits lokal, sortiert jedoch farbige Tags zuerst und dann alphabetisch. [RTag](https://github.com/zotero/zotero-android/blob/master/app/src/main/java/org/zotero/android/database/objects/RTag.kt) hat Verknüpfungen zu den Tag-Zuweisungen. [Forum: relevante/häufige Vorschläge](https://forums.zotero.org/discussion/124723/feature-request-prioritize-recently-used-and-relevant-tags-when-adding-tags); [Performance-Erklärung des Zotero-Teams](https://forums.zotero.org/discussion/72729/feature-request-partial-tag-completion). [Desktop-Issue #6050](https://github.com/zotero/zotero/issues/6050) ist verwandt, kein fertiger Android-Port. [Zotero Tag Recommender](https://github.com/kinranlau/zotero_tag_recommender) bietet Desktop-Autocomplete, dafür ohne API-Key; Häufigkeitssortierung und diese Android-Bedienung damit nicht nachgewiesen. Kein passgenauer Android-PR bei gezielter Suche gefunden. | **C, native Android-Tag-Auswahl**; Datenbankabfrage/Cache dazu. Normale Tags bleiben mit Desktop kompatibel, die neue Eingabehilfe wird dort dadurch nicht automatisch ergänzt. | M; mit den übrigen nativen UI-Änderungen bündeln. Laufzeitbedarf voraussichtlich überschaubar; große Tagbestände gesondert prüfen. | **Umgesetzt / Build 305; Gerätetest offen** |
| F20 | **Farbige Tags direkt im Markierungsfenster:** Zentrierte Reihe mit bis zu neun farbigen Hashtags; die äußeren Hashtag-Mittelpunkte liegen unter den Mittelpunkten der äußeren Highlight-Farben. Antippen schaltet die Zuordnung; vollständige Tags-Auswahl darunter. | [ReaderAnnotationTagsSection](https://github.com/zotero/zotero-android/blob/master/app/src/main/java/org/zotero/android/screens/reader/annotation/sections/ReaderAnnotationTagsSection.kt) und [ReaderAnnotationViewModel](https://github.com/zotero/zotero-android/blob/master/app/src/main/java/org/zotero/android/screens/reader/annotation/ReaderAnnotationViewModel.kt) bieten bestehende Tag-Auswahl/Speicherung. [ReadColoredTagsDbRequest](https://github.com/zotero/zotero-android/blob/master/app/src/main/java/org/zotero/android/database/requests/ReadColoredTagsDbRequest.kt) lädt die farbigen Tags der Bibliothek. Kein passgenauer fertiger PR bei gezielter Suche gefunden. Vorhandene Daten und Speicherwege wiederverwenden; kein zusätzliches Plugin nötig. | **C, natives Android-Annotationsfenster**; mit F19/F21 bündeln. Tags bleiben normale Zotero-Tags. | S–M; voraussichtlich begrenzte UI-/Zustandsänderung | **Build 298; Mittelpunkte ausgerichtet** |
| F21 | **Highlight-Text oben im Markierungsfenster anzeigen:** Den markierten Originaltext als eingerücktes Blockzitat zwischen Formular-Trennlinien ohne Überschrift und Kasten anzeigen, ungefähr ein Fünftel der Bildschirmhöhe; längere Textstellen dort lesbar durchscrollen. Kommentar bleibt ein eigener Bereich. | [ReaderAnnotation](https://github.com/zotero/zotero-android/blob/master/app/src/main/java/org/zotero/android/screens/reader/data/ReaderAnnotation.kt) besitzt bereits `text`, getrennt von `comment`. [ReaderAnnotationScreen](https://github.com/zotero/zotero-android/blob/master/app/src/main/java/org/zotero/android/screens/reader/annotation/ReaderAnnotationScreen.kt) übergibt die Annotation, [ReaderAnnotationRows](https://github.com/zotero/zotero-android/blob/master/app/src/main/java/org/zotero/android/screens/reader/annotation/ReaderAnnotationRows.kt) zeigt bei Highlights bisher Kommentar, Farben und Tags. Kein passgenauer fertiger PR bei gezielter Suche gefunden. Anzeige vorhandener Daten, keine neue OCR nötig. | **C, natives Android-Annotationsfenster**; dieselben Layoutstellen wie F20 | S; zusammen mit F20 prüfen | **Build 294, Nachbesserung** |
| F22 | **Manueller Zuschnitt:** Rechteck an Beispielseite wählen; All / Odd / Even, bei Bedarf zwei Beispielseiten. Pro PDF speichern, später in die gemeinsame Fit-Geometrie einspeisen. | Kein neuer PR recherchiert; aktueller Entwurf aus dem Nutzerauftrag. Eigenes Auswahlfenster erforderlich. | **C + Reader** | In gemeinsame Fit-Geometrie integriert | **Umgesetzt / Build 305; Gerätetest offen** |
| F23 | **Randtippen zum Blättern in allen Scrollmodi:** Links zurück, rechts vor; vorhandene Highlights/Links und obere Bookmark-Fläche berücksichtigen. | Vorhandenen Android-Randtipp-Pfad untersuchen und auf alle Modi erweitern; keine neue externe Recherche behauptet. | **Reader**, ggf. C für Einstellung | Alle drei PDF-Scrollmodi | **Umgesetzt / Build 305; Gerätetest offen** |
| F24 | **PSPDFKit/Nutrient entfernen:** Alten Reader und Startinitialisierung abbauen, gemeinsame SDK-Typen und Hilfsfunktionen ersetzen; PDF.js-Reader beibehalten. | Prüfung des aktuellen Motero-Quellstands am 31. Oktober; keine neue PR-/Plugin-Recherche. | **C, native Android-Abhängigkeiten** | Separater nativer Build 300; PDF.js und Datenformate unverändert | Umgesetzt / Build 300 |
| F25 | **Share Document im Anhangsmenü:** Originaldatei als PDF/EPUB/andere Datei über Android teilen; fehlenden Download zuvor laden. | [PR #205](https://github.com/zotero/zotero-android/pull/205), geprüft am 3. November; geschlossen, ungemergt. | **C, native Menü-/Intent-Anbindung** | Build 303: UI-Thread-Korrektur aus F29; späterer PDF-Export mit Annotationen bleibt anschlussfähig | Umgesetzt / Build 303; reale Teilenübergabe noch zu prüfen |
| F26 | **Lupe beim direkten Markieren:** Vergrößerter Bitmap-Ausschnitt mit Auswahlvorschau, ohne neue PDF-Analyse. | Eigene Prüfung der vorhandenen PDF.js-/Pointerwege. | **A, Reader** | Mit F16 und erneuter Schnellpalette gebündelt | Umgesetzt / Build 302 |
| F27 | **Oberer Leseanker unter Kamera/Statusleistenbereich:** Beim Scrollen und Blättern darf lesbarer Text auch im Vollbild nicht hinter die Displaykamera geraten. | Nutzerrückmeldung vom 3. November nach Build 302; nur vorgemerkt. | **Reader + Android-Inset-Übergabe prüfen** | Build 303: feste sichere WebView-Fläche aus sichtbarkeitsunabhängiger Statusleiste und Displayaussparung | Umgesetzt / Build 303; physische Aussparung noch zu prüfen |
| F28 | **Sporadisch unvollständiges Fit to Content:** Bei der Fuchs-PDF bleiben Seitenränder zeitweise stehen; teilweise setzt auch oberer/unterer Zuschnitt aus. | Nutzerrückmeldung und beigefügte Fuchs-PDF vom 3. November; derzeit nicht reproduzierbar, Ursache offen. | **Reader/Fit-Zustand prüfen, Ursache offen** | Build 303: gemerkten Fit nach Wrapped samt Zuschnitt wiederherstellen; Original-Fuchs-Regression ergänzt | Reproduzierter Zustandsfehler behoben / Build 303; weitere Sporadik beobachten |
| F29 | **Kritisch: Share Document lässt die App abstürzen.** Laut Nutzer bei PDF und EPUB zuverlässig; Teilen funktioniert bei seinen Versuchen nicht. | Geräterückmeldung vom 3. November nach Build 302; Ursache und Crash-Log noch offen. | **Native Teilenfunktion F25** | Build 303: echten Download-Collector auf UI-Scope verlegt; sechs Thread-/Fehlerregressionen ergänzt | Behoben / Build 303; Empfang in zweiter Android-App noch zu prüfen |

„Kein passgenauer PR gefunden“ bezieht sich auf die durchsuchten öffentlichen Zotero-Android- und Reader-PRs samt Web-/Forensuche. Das ist keine Aussage, dass weltweit kein anderer Ansatz existiert. Desktop-Plugins sind Referenzen bzw. Desktop-Lösungen und nicht direkt in Android installierbar.

## Umsetzung und verbleibende Pakete

**Build 293:** F01/F02 aus A, F16/F17/F18 aus B und F05/F06/F20/F21 aus C sind gemeinsam in einer Test-APK umgesetzt. Die Paketnummern in der Tabelle beschreiben die ursprüngliche technische Einteilung.

**Stand nach 319:** F03/F04 und das lokale E-Reader-Profil F12 sind gezielt erweitert; physische Stift-/Latenzprüfung sowie F15-SDK-Anbindung bleiben separat. Druck-Gruppierung aus #264 wurde nicht übernommen.

**Stand C:** F19 Tag-Autocomplete und F22 manueller Zuschnitt sind in Build 305 umgesetzt. Weitere native Kontrast-/Animationsanpassungen bleiben bei Bedarf offen. F07 ist ab Build 296 umgesetzt.

**Paket 0:** Geräteprofile und Handschrifttastatur können unabhängig ausprobiert werden. „Handwriting Optimization“ ist laut BOOX nur für unterstützte Apps dokumentiert; eine Zotero-Unterstützung ist hier nicht nachgewiesen.

**Paket D:** Outline weiterhin am Desktop ausdrücklich in der PDF speichern und die Dateisynchronisierung abschließen. Eine nur im Desktop-Plugin gespeicherte Gliederung erscheint nicht automatisch in Android.

**Paket E:** Druck-Gruppen, gerätespezifische Radierertasten und BOOX-SDK bleiben eigene spätere Experimente.

## Erkenntnisse aus unserem Code und PDF-Test

Die folgenden Messungen beschreiben die Diagnose der Basis 292. Build 293 behebt F01; der Ausschnitt von 106 Pixeln bleibt beim Vor-/Zurückblättern nun erhalten. Die Mul-PDF hat 499 Seiten. In Wrapped wurde mit der unveränderten Version 292 nachgestellt:

| Ansicht | Horizontaler Ausschnitt relativ zur Seite vor dem Wechsel | Nach dem Wechsel | Zoom |
|---|---:|---:|---|
| Fit to Content | 106 CSS-Pixel | 0 CSS-Pixel | unverändert |
| Manueller Zoom | 82 CSS-Pixel | 0 CSS-Pixel | unverändert |

Vor- und Zurückblättern zeigen denselben Fehler. In `PDFView._navigateToPage()` erhält der Richtungswechsel bisher nur im horizontalen Modus den Pan; Wrapped und vertikal fallen beim Richtungswechsel in den normalen PDF.js-Seitenwechsel zurück. Das erklärt den Positionsverlust und ist unabhängig davon, ob eine kurze Überschrift zuerst auf der Seite steht.

Beim Test von „Fit to Width“ in Wrapped blieb der Zoom bei 600 Pixeln Breite sowohl mit 500 als auch mit 1000 Pixeln Fensterhöhe gleich. Eine Höhenbegrenzung war dort nicht die Ursache. Die vorher diskutierte Höhenbegrenzung betrifft „Fit to Content“ im horizontalen Modus.

Für F02 sind die kritischen Fälle: unterschiedliche PDF-Seitengrößen, Zoom-Reflow der Wrapped-Zeilen, verlässlich getroffene Zielseite, frühere manuelle Zoomstufe, aktives Fit to Content, vorhandene Links/Anmerkungen und die Unterscheidung zwischen einem kurzen Tippen, Wischen und langem Markieren. Tippen zum Einsteigen soll nur in der klar herausgezoomten Übersicht greifen.

Für F05 existieren Farb- und Tagfilter bereits. Die Anordnung kann wiederverwendet werden; die Farbpunkte gehören in die native Seitenleistenzeile. Bei schmaler Seitenleiste eine horizontal scrollbar bleibende Farbreihe vorsehen, statt die Trefferflächen zu klein zu machen. Der Tags-Knopf bleibt separat, gewählte Farben und Tags kombinierbar, ausgewählte Farben sichtbar markiert.

### F16: Farbauswahl an der Textstelle

Gewünschter Ablauf: Wie bisher halten, ziehen und loslassen. Direkt danach erscheint eine kompakte Farbbox unter der Markierung. Ein Farbtipp aktualisiert dieselbe gespeicherte Annotation; es darf keine zweite Markierung entstehen. Weiterblättern, Scrollen oder Tippen außerhalb schließt die Box, ohne die Markierung zu verlieren. Fehlt darunter Platz, die Palette oberhalb bzw. innerhalb des sichtbaren Bereichs platzieren.

Für BOOX ausreichend große Trefferflächen und einen deutlichen Rahmen um die aktive Farbe vorsehen. Die Palette erscheint erst nach Abschluss der Ziehgeste. Bestehende Textauswahl, Annotation-Popups, Links, Scrollen, Zoom und Wrapped-Seitenauswahl dürfen dadurch nicht versehentlich ausgelöst oder blockiert werden. Ob die gewählte Farbe auch für folgende Markierungen übernommen werden soll, ist noch keine festgelegte Anforderung.

Technische Einordnung nach Sichtung des aktuellen öffentlichen Upstream-Codes: Das Desktop-SelectionPopup enthält bereits Farbtasten und erzeugt beim Farbtippen eine Annotation. Unser direktes Markieren speichert dagegen bereits beim Loslassen; hier muss die Palette die bestehende Annotation aktualisieren. `src/index.android.js` stellt vorhandene Speicher- und Popup-Ereignisse bereit, bindet aber nicht einfach die Desktop-React-Oberfläche ein. Eine eigene kleine WebView-Palette ist in Build 293 umgesetzt und im Browser mit Touch-/Stift-Eingabe geprüft. S–M war die vorläufige Aufwandsschätzung.

### F17: Alte Bildkante nach einem Scrollschritt

Beim Vorwärtsscrollen die untere Kante des tatsächlich sichtbaren Lesebereichs vor der Bewegung erfassen. Nach dem Scrollen eine graue gestrichelte Linie an genau dieser Dokumentstelle einblenden. Beispiel: Bei 600 Pixeln Lesehöhe und einem tatsächlichen Scrollschritt von 400 Pixeln liegt die Linie danach 200 Pixel unter dem oberen Leserand. So markiert sie die Grenze zwischen zuvor sichtbarem und neu hinzugekommenem Text. Sie bleibt an der Textstelle verankert und wandert bei weiterer Bewegung mit dem Dokument. Beim Rückwärtsscrollen die frühere obere Kante verwenden.

Die einfachste Fassung braucht weder Texterkennung noch eine Analyse der ganzen PDF: Vorherige Kante und tatsächliche Scrollbewegung reichen bei gleichbleibendem Zoom aus. Die Linie ist eine temporäre Reader-Anzeige; sie wird nicht als PDF-Annotation gespeichert oder synchronisiert. Sie soll keine Gesten abfangen, deutlich genug für E-Ink sein und keine laufende Animation benötigen.

Für die Implementierung beachten: verfügbare Höhe nach Abzug eingeblendeter Leisten, verkürzte Schritte am Seitenende, Richtungswechsel, schneller mehrfacher Tastendruck, unterschiedliche Seitengrößen sowie Wrapped mit mehreren Seiten nebeneinander. Bei einem echten Seitenwechsel, Zoomwechsel oder einem unabhängigen Seitensprung die alte Linie entfernen, damit sie nicht auf der falschen Seite erscheint. Nur eine Kante anzeigen, die im neuen Ausschnitt tatsächlich noch sichtbar ist. Bei freien Wischgesten die Ausgangskante zu Gestenbeginn erfassen und erst nach Ende einschließlich Nachlauf setzen; dies ist aufwendiger als die bereits kontrollierten Tastenschritte. Kein passgenauer PR bei den gezielten Suchen nach Scroll-Indikator und Leseposition im öffentlichen Reader-Repository gefunden.

### F18: Lesezeichen über datierte graue Haftnotizen

Ziel: Zwei oder mehrere Lesestände bzw. wichtige Seiten dauerhaft merken und über vorhandene Annotationen wieder anspringen. Bevorzugter Workaround ist eine normale Zotero-Notiz-Annotation in Grau (`#aaaaaa`). Die Beschriftung kommt in den Notiz-/Kommentartext, beispielsweise „Lesezeichen · 28.10.2026 22:15“. So ist kein separates Titelfeld oder neues Bookmark-Datenformat erforderlich. Datum und Uhrzeit werden bei Erstellung lokal erzeugt; mehrere Einträge am gleichen Tag bleiben unterscheidbar.

Shortcut ab Build 294: Die rechte Hälfte des oberen Elftels des sichtbaren Reader-Bereichs ist die Touchfläche, einschließlich äußerem Blätterrand und schmalem PDF.js-Zwischenraum. Kurzes Tippen erzeugt die Notiz auf der angetippten PDF-Seite bzw. im Zwischenraum auf der aktuellen Leseseite. Die Markerposition ist fest im PDF verankert, unabhängig vom Tipppunkt und von der Zoomstufe. Auch bei gedrehten Seiten wird visuell oben rechts positioniert. Ein bereits vorhandenes datiertes Lesezeichen der Seite wird geöffnet, statt ein weiteres anzulegen. Ab Build 297 wird die beim erneuten Shortcut ausdrücklich ausgewählte datierte Notiz an den Inhaltsrahmen angepasst; andere Marker bleiben an ihrer gespeicherten Position.

Bestehende Annotationen und Links in der Zone behalten ihre normale Bedienung. Halten zum Markieren, Ziehen, Wischen, Doppeltippen, Pinch und aktives Zeichnen dürfen kein Lesezeichen erzeugen. In der Wrapped-Seitenübersicht hat das Antippen zum Einsteigen aus F02 Vorrang. Die neue Aktion muss den Klick verbrauchen, damit sie nicht gleichzeitig eine Seite weiterblättert oder die Leisten umschaltet.

Erneutes Antippen der vorhandenen Haftnotiz öffnet sie wie üblich. Ein erneuter Shortcut an derselben Stelle soll keine Duplikate erzeugen; vorgeschlagene Lösung: die vorhandene passende Lesezeichen-Notiz öffnen. Normale graue Notizen ohne Lesezeichen-Kennzeichnung bleiben unverändert. Löschen erfolgt über die bestehende Notiz-/Annotationsfunktion; ein Tap soll nicht stillschweigend löschen. Mehrere Lesezeichen pro Dokument sind möglich, ohne Beschränkung auf genau zwei. Wiederfinden über die bestehende Annotations-Seitenleiste, gegebenenfalls mit grauem Farbfilter; ein zusätzlicher Tag wäre optional und noch keine festgelegte Anforderung.

Desktop-Kompatibilität: Als normale Zotero-Notiz-Annotation mit Farbe, Kommentar und PDF-Position nutzt das Lesezeichen den vorhandenen Annotations-Sync und erscheint nach erfolgreicher Synchronisierung auch in Zotero Desktop. Dort lässt es sich normal öffnen, anspringen, bearbeiten und löschen. Die neue Android-Tippgeste selbst wäre nur auf Android vorhanden. Zotero speichert solche Annotationen regulär in seiner Datenbank; sie stehen nicht automatisch in der Original-PDF für externe Reader. Für den hier gewünschten Austausch zwischen Android und Zotero Desktop ist keine Änderung am PDF-Outline nötig.

Aufwand vorläufig S–M: Eingabegeste und Koordinaten sauber einordnen, vorhandene Notiz-Erstellung/Speicherung nutzen und Doppelanlage verhindern. Der Reader-Weg ist in Build 293 umgesetzt. Erstellen, Wiederherstellen, normales Löschen und mehrere Lesezeichen wurden im Browser geprüft. Der echte Geräteneustart und Android-/Desktop-Sync müssen noch am Gerät geprüft werden. Eine separate Bookmark-Liste mit eigener Verwaltung und Synchronisation wäre ein größeres Folgefeature.

### F19: Tags vervollständigen und nach Häufigkeit vorschlagen

Gewünschte Bedienung: Ohne Eingabe einige häufige Tags anbieten. Beim Tippen passende bestehende Tags anzeigen, häufige Treffer oben. Ab etwa drei Zeichen den besten Präfix-Treffer als graue Ergänzung hinter dem selbst eingegebenen Text zeigen. Beispiel: Eingabe „anth“, Vorschau „anthropologie“, wobei nur „ropologie“ grau dargestellt wird. Die genaue Startlänge ist ein Vorschlag, keine technische Notwendigkeit. Bereits vorhandene kurze Tags müssen weiterhin auswählbar sein.

Enter bzw. die Bestätigung auf der Bildschirmtastatur übernimmt den aktuell sichtbaren vollständigen Vorschlag. OK verwendet denselben Bestätigungspfad, bevor die Tag-Auswahl gespeichert wird. Ein exakter vorhandener Tag darf nicht durch einen längeren Vorschlag ersetzt werden. Andere Vorschläge lassen sich antippen bzw. mit Pfeiltasten wählen. Neue Tags bleiben über eine ausdrücklich beschriftete Aktion „Neuen Tag … anlegen“ möglich; ein halber Suchtext soll nicht unbeabsichtigt zu einem neuen Tag werden. Ohne Vorschlag darf kein fremder oder veralteter Treffer übernommen werden. Die genaue Behandlung noch nicht übernommener Eingaben beim Speichern ist im Prototyp sichtbar zu machen. IME-Komposition, Cursorbewegungen, Löschen und die BOOX-Bildschirmtastatur mitprüfen.

Kontext und Häufigkeit: Im PDF-Annotationsdialog bevorzugt die Zahl aktiver Annotationen zählen, denen der Tag in der aktuellen PDF zugeordnet ist. Tags außerhalb der PDF bleiben aus der jeweiligen Bibliothek verfügbar. Vorgeschlagene Reihenfolge: Nutzung in dieser PDF absteigend, dann Nutzung in der Bibliothek absteigend, bei Gleichstand Name. Bereits ausgewählte Tags nicht erneut vorschlagen. Für die allgemeine Tag-Auswahl ohne PDF-Kontext genügt die Bibliothekshäufigkeit. Bibliotheken und Gruppen getrennt halten; gelöschte bzw. nicht relevante Einträge nicht mitzählen. Die Zählung bezieht sich auf gespeicherte Tag-Zuweisungen, nicht auf Vorkommen eines Worts im PDF-Text.

Einfacher effizienter Ansatz für die erste Fassung: Beim Öffnen einmal Tags, normalisierte Suchnamen und Häufigkeiten laden und nach Häufigkeit vorsortiert zwischenspeichern. Pro Eingabe die passende Liste filtern und höchstens etwa acht Vorschläge liefern; nicht bei jedem Buchstaben alle Häufigkeiten neu zählen und die ganze Liste neu sortieren. Neue bzw. geänderte Tag-Zuweisungen und Sync-Änderungen machen den Cache ungültig. Bei großen Listen eine kurze Eingabepause berücksichtigen, die Suche im Hintergrund ausführen und überholte Ergebnisse verwerfen. Die Bestätigung muss immer zum aktuellen Text passen, auch wenn der letzte Suchlauf noch nicht fertig ist.

Algorithmische Einordnung: Eine vorsortierte Liste benötigt einmal O(N log N) zum Sortieren; eine Präfixsuche darüber ist im ungünstigsten Fall linear in Zahl und Länge der Tags. Für überschaubare Bestände ist das die wartbare erste Lösung. Bei nachgewiesen sehr großen Listen bietet sich zusätzlich ein nach Namen sortierter Suchindex mit binärer Präfixbereichssuche an; daraus die besten K Treffer nach gespeicherten Häufigkeiten wählen. Ein Trie mit gespeicherten Top-Treffern je Präfix wäre eine weitere Option, benötigt aber mehr Speicher und aufwendigere Aktualisierung. Deshalb die konkrete Tagzahl und Messwerte über die spätere Optimierung entscheiden lassen. Ein Mindestpräfix von drei Zeichen verkleinert die Treffermenge, ersetzt aber keinen passenden Index bei sehr großen Beständen.

Abgrenzung zur diskutierten Performance: Das Zotero-Team beschreibt im verlinkten Forum insbesondere die Suche nach Zeichenfolgen mitten im Namen über Bibliotheken mit Hunderttausenden Tags. Eine Suche ab dem Tag-Anfang kann einen passenden Index nutzen. Für die graue Ergänzung zunächst Präfix-Treffer verwenden. Die bereits vorhandene Android-Suche nach enthaltenem Text kann in der Ergebnisliste erhalten bleiben, eignet sich aber nicht immer für eine einfache graue Endung. Der konkret erwähnte Stack-Overflow-Beitrag ist ohne Link nicht eindeutig zugeordnet; die Leistungsbedenken sind durch den verlinkten Zotero-Team-Beitrag konkreter belegt.

Geprüfter öffentlicher Android-Stand: `TagPickerViewModel.load()` lädt aus Realm und sortiert farbige Tags vor den übrigen, jeweils alphabetisch. `search()` filtert eine gespeicherte Liste per `contains(ignoreCase = true)`. `TagPickerScreen` leitet die IME-Bestätigung an `addTagIfNeeded()` weiter, das bisher den eingegebenen Text als Tag hinzufügt. `onSave()` speichert dagegen bereits ausgewählte Tags; dass OK im aktuellen Upstream allein einen halben Tag neu anlegt, wurde damit nicht belegt. F19 vereinheitlicht die gewünschte Bestätigung ausdrücklich. `RTag.tags` verweist auf Zuweisungen, aus denen Häufigkeiten ermittelt werden können. Eine separate, bereits nach Häufigkeit sortierte Tag-Datei wurde in diesen Stellen nicht gefunden. Relevante weitere Dateien: `TagPickerSearchBar.kt`, `ReadTagPickerTagsDbRequest.kt` und `RTag.kt`.

Desktop-Bezug: Die Standard-Dokumentation beschreibt schon Tag-Vorschläge mit Tab-/Enter-Auswahl. Der aktuelle README von Zotero Tag Recommender nennt Zotero 10 als Ziel und Vervollständigung über Wortanfänge; ein API-Key wird dafür nicht benötigt, sondern nur für dessen zusätzliche KI-Tagvorschläge. Das Plugin ist eine Desktop-Referenz, keine direkt installierbare Android-Lösung. Weder Häufigkeitssortierung noch graue Ergänzung mit den gewünschten Enter-/OK-Regeln sind durch den README als fertige Lösung belegt. Desktop-Issue #6050 ist offen und betrifft enthaltene Zeichenfolgen sowie Zahlentasten, nicht genau diese Funktion.

### F20/F21: Markierungsfenster mit Tag-Schnellwahl und Originaltext

Gewünschte Anordnung des vorhandenen Android-Fensters nach Antippen eines Highlights:

| Reihenfolge | Inhalt |
|---|---|
| 1 | Vorhandene Kopfzeile mit Seite und Bestätigung |
| 2 | Markierter Originaltext in einem eigenen lesbaren Bereich |
| 3 | Bestehendes Kommentarfeld für die eigene Anmerkung |
| 4 | Bestehende Auswahl der Highlight-Farbe |
| 5 | Neue Schnellwahl farbiger Tags als eingefärbte `#`-Symbole |
| 6 | Vorhandene Tag-Liste bzw. „Tags hinzufügen“ für alle weiteren Tags |

F20: Die tatsächlich in der jeweiligen Bibliothek konfigurierten farbigen Tags verwenden, bis zu den gewünschten neun Schnellplätzen; keine neun erfundenen Tags oder fest vorgegebenen Highlight-Farben einsetzen. Ihre gespeicherte Reihenfolge nutzen. Unter den Highlight-Farben eine eigene Reihe vorsehen, deren Symbole die Tag-Farbe tragen. Die Aktionen ändern die Tag-Zuordnung, unabhängig von der Highlight-Farbe. Zugeordnete Tags durch eine dezente Material-Fläche und ein zusätzliches Auswahlzeichen erkennbar machen, damit die Bedienung auch auf E-Ink verständlich bleibt. Als vorgeschlagene Bedienung schaltet erneutes Antippen die Zuordnung wieder aus; dabei nur die Zuordnung zu dieser Annotation entfernen. Tag-Namen für Bedienungshilfen und bei Bedarf über längeres Antippen anzeigen.

Bei neun Symbolen ausreichend große Trefferflächen behalten. Alle bis zu neun Symbole bleiben sichtbar; die gleichmäßig verteilten Felder erhalten 48 dp Höhe. Ab Build 295 liegen die äußeren Grenzen jeweils einen halben Mittelpunktabstand jenseits der äußersten Highlight-Farbe. Die Breite passt sich dem Fenster an. Existieren weniger farbige Tags, nur diese anzeigen; ohne konfigurierte farbige Tags keinen leeren großen Block erzeugen. Der vorhandene Weg „Tags hinzufügen“ bleibt für alle Tags erreichbar. Der Auswahlzustand muss mit der vollständigen Tag-Auswahl aus F19 übereinstimmen und bereits zugewiesene andere Tags beibehalten. Änderungen über den bestehenden Tag-Speicher-/Sync-Pfad weitergeben. Schreibrechte und nicht bearbeitbare Annotationen beachten.

F21: Gemeint ist ausdrücklich der markierte Originaltext der PDF, getrennt vom eigenen Kommentar und den Tag-Namen. Der obere Textbereich soll etwa ein Fünftel der Bildschirmhöhe beanspruchen; bei kurzen Zitaten darf er kleiner sein. Lange Markierungen innerhalb dieses begrenzten Bereichs scrollbar anzeigen, ohne ihren Inhalt unbemerkt abzuschneiden. Bei eingeblendeter Tastatur bzw. kleinem Fenster die Höhe an den verfügbaren Platz anpassen. Die konkrete Höhe bleibt eine Layout-Richtgröße. Keine Bearbeitung oder Neuberechnung des Highlight-Texts als Voraussetzung; zunächst vorhandenes `ReaderAnnotation.text` lesbar anzeigen. Falls kein Text gespeichert ist, einen passenden kurzen Hinweis statt einer großen leeren Fläche verwenden.

Codeprüfung am aktuellen öffentlichen Upstream: `ReaderAnnotationScreen` erhält die vollständige Annotation. `ReaderAnnotationHighlightRow` bekommt bisher nur Kommentar, Farben und Tags übergeben und stellt sie in dieser Reihenfolge dar. Das Datenmodell hat bereits getrennte Felder `text` und `comment`; für F21 muss der vorhandene Text lediglich bis zur Anzeige weitergegeben werden. F20 kann die vorhandene Abfrage `ReadColoredTagsDbRequest` verwenden, die durch `libraryId` eingegrenzt wird. Der vorhandene ViewModel-/Event-Pfad übernimmt Tag-Änderungen; die Schnellwahl soll denselben Weg nutzen. Beide Erweiterungen ändern somit native Compose-Oberfläche und gehören zu C, nicht zum reinen WebView-Reader-Update.

Vorläufiger Aufwand: F20 S–M, F21 S. Gemeinsam prüfen: kurze/lange Highlights, gleiche Tag-Farben, bereits gesetzte Tags, keine/wenige/neun farbige Tags, Tablet-Popup und kleines Vollbildfenster, Tastatur und große Schrift sowie Speichern, Wiederöffnen und Synchronisieren der Tag-Zuordnung. F16 bleibt die eigenständige kleine Farbbox unmittelbar nach dem Markieren; F20/F21 betreffen das vorhandene größere Bearbeitungsfenster.

## Schreiben auf dem genannten BOOX-Modell

Laut [offizieller Modellseite](https://shop.boox.com/products/gocolor7-gen2) sind Go 7 und Go Color 7 Gen II mit BOOX InkSense und InkSense Plus kompatibel; diese bieten 4096 Druckstufen. Daraus folgt noch nicht, dass die aktuelle Zotero-WebView sämtliche Druck-/Tasteninformationen erhält. Beliebige Wacom-EMR-Stifte sind für dieses Modell kein Ersatz.

Einfachste Schritte vor zusätzlicher Programmierung: vorhandenen kompatiblen Stift und Firmware-Funktionen prüfen, mit der nativen Notes-/NeoReader-App als Vergleich schreiben, Zotero-App-Profil vergleichen und Kommentare gegebenenfalls über eine Handschrifttastatur eingeben. Die originale Notes-App wird von BOOX für das Modell beschrieben. Diese Wege ändern keine Zotero-APK.

Die alte Forumslage umfasst auch den früheren Nutrient-/PSPDFKit-Reader. Unsere Testversion verwendet den WebView-/PDF.js-Reader. Deshalb ältere Empfehlungen zu einem Austausch von Nutrient nicht ungeprüft als Lösung für unsere Version übernehmen. Ein normaler Reader-Neuzeichnungsaufruf ist außerdem kein garantierter physischer E-Ink-Vollrefresh; dafür sind Systemeinstellungen oder passende native Geräte-APIs zuständig.

## Quellen und Prüfstand

Primärquellen: öffentliche PR-Beschreibungen/-Metadaten von zotero/reader und zotero/zotero-android, Jasminum-/Weavero-Projektseiten, BOOX-Produktseite, BOOX-Hilfedokumentation und die oben direkt verlinkten Original-Forenbeiträge. PR #263 war bei der Prüfung offen und kein Draft; #264 war offen und Draft. Die übrigen PRs sind Referenzen, keine pauschale Empfehlung zum ungeprüften Übernehmen.

Basis der ursprünglichen Recherche: Android-Commit `96e5a56745f3fb0201fb3a81adf2150c0df8be6d`, Reader-Commit `9f5e9b79b43c1321cfded4bd17a336450239b725`. Relevante Stellen: `reader/src/pdf/pdf-view.js`, `reader/src/pdf/hardware-navigation.mjs`, `ReaderViewModel.kt`, `ReaderBox.kt`, `ReaderFilterScreen.kt` und `ReaderFilterViewModel.kt`.

Dieser Featureplan dokumentiert Build 299, die bisherigen automatischen Fit-Modi und die noch offenen nächsten Schritte. Die vorhergehende APK und ihre Quellversion bleiben über die Versionshistorie erhalten. Eine physische Prüfung am BOOX und eine Verbesserung der Stiftlatenz werden nicht behauptet.



---

# EPUB-Reader: Recherche und Umsetzung für Motero 304

Recherche: 4. November 2026; Basis Motero 303. Die priorisierte Liste wurde vor Beginn der Änderungen im Gespräch vorgelegt. Öffentliche Android-/EPUB-Forenbeiträge und passende GitHub-Issues wurden mit unserem Code verglichen. Die Liste deckt die gefundenen Meldungen ab, ohne Vollständigkeit für jede Forumserwähnung zu behaupten. Historisch behobene Meldungen sind als solche gekennzeichnet.

| Problem oder Wunsch | Befund und Einordnung | Primärquelle |
|---|---|---|
| Schriftgröße nach Neustart vergessen | Native EPUB-Skalierung wurde verworfen. Lokale Speicherung pro Bibliothek/Anhang und Wiederherstellung ergänzt. | [Schriftgröße und Position](https://forums.zotero.org/discussion/132645/android-epub-reader-not-remembering-font-size-and-exact-position) |
| Öffnen landet vor der Lesestelle | Native Übergabe ließ `cfiElementOffset` weg. Lokaler Versatz wird ergänzt; gilt nur bei gleichem CFI. Ein neuer synchronisierter CFI hat Vorrang. Keine Garantie gegen jede Layoutabweichung. | [Position](https://forums.zotero.org/discussion/132524/android-epub-not-remembering-exact-reading-position), [Schriftgröße/Position](https://forums.zotero.org/discussion/132645/android-epub-reader-not-remembering-font-size-and-exact-position) |
| Große Ränder auf BOOX | Gespeicherte Textbreite und Zeilen-/Wort-/Zeichenabstände wurden beim Öffnen nicht übergeben. Die Initialisierung erhält diese Werte jetzt vor der Navigation, auch beim ersten Öffnen und bei Annotationen. | [Android EPUB-Beta, BOOX-Ränder](https://forums.zotero.org/discussion/132371/available-for-beta-testing-on-android-epub-snapshot-support) |
| Leeres EPUB-Fenster beim Start | Eigener Startfehler reproduziert: AnnotationManager setzte synchron eine Auswahl, bevor das EPUB-/HTML-Iframe existierte. DOM-Nebenwirkungen werden bis zur Initialisierung zurückgestellt. Andere problematische Dateien bleiben separat zu prüfen. | [Blank EPUB / Spinner](https://forums.zotero.org/discussion/132373/android-beta-some-epub-files-fail-to-open-display-a-blank-page) |
| EPUB-Lesezeichen | Normale graue, datierte Zotero-Notizen mit Standard-CFI-Textanker ergänzen. Tippzone: rechte Hälfte des obersten Elftels. Gleiche Stelle nicht duplizieren; normale Annotationsliste, Navigation und Löschung. | Nutzerwunsch; [Temporary bookmark](https://forums.zotero.org/discussion/116501/android-add-a-temporary-bookmark-option) |
| Lautstärketasten zum Blättern | Bereits vorhandene gemeinsame Anbindung für EPUB verifizieren. Leiser vorwärts, lauter zurück; bestehende Richtungsumkehr gilt. Beide Flows, Kapitelgrenzen, RTL und Texteingabe prüfen. | Nutzerwunsch; DashboardActivity, ReaderHardwareButtons, index.android.js und hardware-navigation.mjs |
| Paginated/Scrolled startet falsch | Historische Meldung wurde für 255 als gelöst bestätigt. Regression prüfen, kein unnötiger Engine-Austausch. | [Flow switching](https://forums.zotero.org/discussion/132444/android-beta-buggy-epub-paginated-scrollable-switching) |
| Helle Balken im Dark Mode | Im Forum für 255 als behoben bestätigt. Vorhandene Themes erhalten. | [Dark mode, fixed 255](https://forums.zotero.org/discussion/132374/android-epub-dark-mode-top-and-bottom-bar-uses-bright-color-fixed-in-1-0-0-255) |
| Große EPUBs langsam / manche leer | Konkrete Dateien wurden upstream repariert; größere Bücher teils weiter langsam. Dateispezifische Fälle offen. Unsere Startabsicherung ist keine allgemeine Lösung aller Ladeprobleme. | [Laden / große Bücher](https://forums.zotero.org/discussion/132373/android-beta-some-epub-files-fail-to-open-display-a-blank-page) |
| Spinner verschwindet nicht | Dedizierter `onViewContentInitialized`-Callback bereits vorhanden. Erfolgreichen Start prüfen; kaputte Dateien nicht pauschal als repariert ausgeben. | [Forum](https://forums.zotero.org/discussion/132373/android-beta-some-epub-files-fail-to-open-display-a-blank-page), [Reader #225](https://github.com/zotero/reader/issues/225) |
| Highlight-Größe ändern / Absturz | Android #300 war bei Recherche offen. Ohne reproduzierte Ursache kein pauschaler Patch der Auswahl. Eigenes nächstes Arbeitspaket. | [Android #300](https://github.com/zotero/zotero-android/issues/300) |
| Mehrfaches langes Drücken / Swipe-Auswahl | Reader-Issue geschlossen. Bookmark-Geste muss langen Druck, Drag und aktive Auswahl respektieren. | [Reader #206](https://github.com/zotero/reader/issues/206) |
| Swipe-Indikator bleibt hängen | Historisches geschlossenes Issue; vorhandene Bereinigung erhalten. Bookmark wird erst nach Beendigung des Swipe-Zustands verarbeitet. | [Android #305](https://github.com/zotero/zotero-android/issues/305) |
| Positionsdrift bei Drehung / Sidebar | Reader #205 geschlossen. Bestehende Reflow-Ankerlogik erhalten; Wiederöffnen und Bookmark-Auflösung nach Schriftänderung ergänzend prüfen. | [Reader #205](https://github.com/zotero/reader/issues/205) |
| Erster Aufruf mit CFI `0` | Geschlossenes Issue. Normalen Startanker erhalten; kein neues CFI-Format einführen. | [Android #304](https://github.com/zotero/zotero-android/issues/304) |
| Lesefortschritt / Restlesezeit | Native Prozent-/Positionsanzeige bei versteckter Toolbar vorhanden. Kapitelstatistik und Restlesezeit wären zusätzliche Funktionen. | [Reading progress](https://forums.zotero.org/discussion/132443/feature-request-epub-reading-progress) |
| EPUB öffnet extern statt intern | Historische Stable-/Beta-Unterscheidung, kein Beleg eines aktuellen Motero-Fehlers. Motero verwendet den eingebauten Reader. | [External apps](https://forums.zotero.org/discussion/132885/android-zotero-opens-pdfs-epubs-with-external-apps-instead-of-the-built-in-reader) |
| NeoReader-Annotationen nicht in Zotero | Externe Markierungen synchronisieren nicht automatisch. Unsere Bookmarks verwenden den normalen Zotero-Annotationspfad, keinen NeoReader-Import. | [BOOX EPUB combo](https://forums.zotero.org/discussion/131521/either-a-bug-or-not-supported-action-android-boox-epub-combo) |
| Vorlesen / TTS | Größeres Folgepaket mit Audio-, Fokus-, Positions- und Android-Systemanbindung. | [Beta-Thread](https://forums.zotero.org/discussion/132371/available-for-beta-testing-on-android-epub-snapshot-support) |
| Eigene Schriften / Buchprofile | Desktop-Diskussionen sind Referenzen, kein fertiges Android-Plugin. Eigene Auswahl/Ressourcenverwaltung nötig. | [Reader font](https://forums.zotero.org/discussion/116354/zotero-7-beta-reader-font), [Buchschriften](https://forums.zotero.org/discussion/107944/fr-use-fonts-specified-by-epubs) |
| Vertikale CJK-Bücher / Speziallayout | Eigenes Interoperabilitätspaket mit echten Büchern. Desktop-Meldungen nicht automatisch zu Android-Defekten erklären. | [Vertical EPUB](https://forums.zotero.org/discussion/116927/add-support-for-the-vertical-layout-epub-format-books) |
| CFI nach Pagebreak-Spans | Spezielle Generator-/Resolver-Abweichung. Nicht blind ändern, weil alte Annotationen davon betroffen wären. | [Reader #244](https://github.com/zotero/reader/issues/244), [epub.js PR #4](https://github.com/zotero/epub.js/pull/4) |

## Grenzen und Bündelung

304 umfasst lokale Zustandsübergabe, Startabsicherung, Standard-Notiz-Lesezeichen und die Prüfung der bestehenden Tastenanbindung. Danach sinnvoll getrennt: EPUB-Auswahl/Highlight-Größenänderung; Schriften/Buchprofile/Kapitelstatistik; Vorlesen als größeres Paket. Kein ungeprüfter Komplettaustausch von Reader oder epub.js und kein direkt übernehmbares Android-Plugin aus diesen Quellen.

Lesezeichen ändern die EPUB-Datei nicht. Sie sind graue Zotero-Notizen mit Datum und Uhrzeit an der ersten sichtbaren Textzeile. Über die Annotationsliste anspringen und normal löschen. Links, vorhandene Annotationen, aktive Auswahl, langer Druck, Drag und Schreibschutz haben Vorrang. Kein erfundener Textanker in einem nicht erreichbaren Bildabschnitt. Desktop-Kontosync und physischer BOOX-Test müssen am Gerät bestätigt werden.

Schriftgröße wird pro Anhang lokal gespeichert. Der synchronisierte Lesestand bleibt ein CFI. Zusätzliche lokale Zustände sind bibliotheksgetrennt und werden bei Abmeldung gelöscht. Für schmalere Ränder die vorhandene breite Textbreite speichern; die Korrektur sorgt für deren Anwendung beim Öffnen. Im gescrollten EPUB verwenden die Tasten den bestehenden Schritt mit leichter Überlappung; der PDF-SmartScroll-Prozentwert verändert diesen EPUB-Schritt nicht.

PDF-Fitting, PDF.js, vorhandene Markierungswerkzeuge, Tags und Sync-/Datenformate bleiben erhalten. F19 Tag-Autocomplete, F22 manuelles All/Odd/Even-Cropping, F23 Randtippen und Stifterweiterungen bleiben anschlussfähig. Kein physischer Test und keine öffentliche Veröffentlichung behauptet.


## Build 311 — Reader-Konsistenz und begrenzte Hintergrundarbeit

Umgesetzt: Theme vor dem ersten Bild und konsistente Systemleisten/Vorschaubilder; unteres PDF-Werkzeug-Dock mit Undo und Farbfeld; einheitliche Cropping-Auswahl und kompakter Editor; gebogener Bookmark-Sprungpfeil und schwarzes Fähnchen mit 70 % Deckkraft im PDF. Breiter verteilte und lokale Cropping-Stichproben, persistente Geometrie/numerisches Lernen, Pixel-/Speicher-/Warteschlangengrenzen und gezielte Stiftkorrekturen aus den Ansätzen von F03.

[Recherche, Quellen und verbleibende Kandidaten](docs/READER_OPTIMIZATIONS.md). F03 ist gezielt adaptiert, nicht als vollständiger Upstream-PR gemerged. Hardware-Radierertasten, variable Druckbreite und BOOX-SDK bleiben eigene Geräteprüfungen; direkte Forenlektüre bleibt wegen der Netzwerkregel offen.


## Build 312 — vollständige Vorschau-Wiederherstellung

Die Wünsche für Miniaturseiten bleiben bei einem neuen Renderer erhalten. Nur Bilddaten werden verworfen; der neue Renderer rendert nahe Seiten und die weiterhin benötigten entfernten Landmarken erneut. Native Regression ergänzt; alle Funktionen aus Build 311 bleiben enthalten. Build 311 wurde mit 305 Reader-Tests, 118 nativen Tests, zwölf Browser-Suites und erfolgreichen API-31/35-Updates veröffentlicht und unabhängig geprüft.


## Build 319 — E-Reader-Profil und tragbare Stifteingabe

- **F03:** Fertige Ink-Pfade nach Position und Transform zwischenspeichern; aktive Striche unverändert inkrementell; Hintergrundanalyse während des Schreibens pausieren. Reader-Regression für unveränderte Rahmen mit neuen Randmasken aus 318 bleibt erhalten.
- **F04:** Stift zeichnet, Finger navigiert; separate Finger-Zeichenoption, Pointer-Eigentum, Handballenschutz bis zur Freigabe und 300 ms Nachlauf vor allen Prioritätsgesten. PDF/EPUB und Text-Lesemodus berücksichtigen.
- **F12:** Lokales, standardmäßig ausgeschaltetes E-Reader-Profil für App und Reader: stärkere Kontraste und sofortige Übergänge, Light/Dark-Auswahl erhalten.
- **F14:** Hardware-Stifttasten pro Gerät zuweisen; Hold standardmäßig, Toggle optional, Wiederholungen ignorieren, physischen Radierer erkennen. Werkzeug/Farbe/Breite erhalten; Eingabediagnose ohne Dokumentinhalt oder Koordinaten.
- **F15:** Getestete, ausgeschaltete Vorschau-Transaktionsschnittstelle vorbereitet. Kein SDK ausgeliefert; Lizenz, InkSense/EMR-Kompatibilität, reale Koordinaten/ACK-Anbindung und ≥20 % p95-Latenzgewinn sind weiterhin Hardware-/SDK-Gates. Keine Behauptung eines fertigen nativen BOOX-Backends.
- Gezielte Upstream-Stabilität: Undo/Redo bei schnellem Löschen, nativen Bearbeitungen und eigenen Datenbank-Echos; kontrastreiche WebView-Auswahlgriffe; initiale Schrift/Lesemodusdarstellung. Bestehende Downloads/Session-Fixes erhalten. PDF.js und TTS nicht verändert.

[Bedienung, Quellen, Erhalt bestehender Funktionen und Hardwaregrenzen](docs/E_READER_AND_STYLUS.md).
