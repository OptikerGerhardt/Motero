# Änderungen

## 1.0.5-320 — 10. November 2026 — Motero 1.0.5

- PDF.js auf den von Zotero Reader verwendeten Stand `5f95f712` (5.7.330) aktualisiert. Eingebettete Schriften erhalten keine zusätzliche künstliche Fett-/Kursivzeichnung; semantische Schriftmerkmale bleiben für die Textanalyse verfügbar.
- Offizielle Unterstützung für bereichsweise Textfärbung einschließlich Theme-Kontrast, Überlagerungen und abgebrochener Renderaufträge übernommen. Keine neue Farbautomatik für vorhandene Annotationen aktiviert.
- Client, Worker und Viewer gemeinsam gepinnt; Build verhindert gemischte Versionen, abweichende Quellstände und fehlende Android-WebView-Kompatibilität. Schrift-/WASM-/CMap-Pakete und andere Laufzeitdateien unverändert.
- Zusätzliche Engine-Pixeltests und Browserprüfungen für eingebettete Schriften, Light/Dark Mode, Textauswahl und Renderabbrüche. Bestehende Cropping-, Jump-/SmartScroll-, Bookmark-, Toolbar-, EPUB- und Stiftregressionen bleiben Teil der Freigabeprüfung.

## 1.0.4-319 — 10. November 2026 — Motero 1.0.4

- Lokales E-Reader-Profil für die App und den Reader mit stärkeren Kontrasten und sofortigen Übergängen; vorhandene Theme-Auswahl bleibt bestehen.
- Tragbare Stifteingabe mit Pointer-Eigentum, Handballenschutz, Finger-Navigation oder explizitem Finger-Zeichnen; Hold/Toggle-Radierertasten und Eingabediagnose. Abgebrochene gemischte Stift-/Fingergesten können den Berührungsschutz nicht festhalten; normale Finger-Abbrüche bekommen keine Zusatzverzögerung.
- Gezielte offizielle Zotero-Korrekturen für Undo/Redo, Auswahlgriffe, Stifterkennung, fertige Ink-Pfade und Schriftinitialisierung. Hintergrundanalyse pausiert beim Schreiben.
- Bestehende Cropping-, Jump-/SmartScroll-, Bookmark-, Toolbar-, Theme- und EPUB-Funktionen bleiben regressionsgeprüft; PDF.js/Runtime unverändert.
- BOOX-Vorschau-Schnittstelle vorbereitet, echte SDK-Anbindung bis zur Lizenz-/Hardwareprüfung deaktiviert. Details: [E-Reader und Stift](docs/E_READER_AND_STYLUS.md).

- Veröffentlicht und unabhängig geprüft: 365 Reader-, 141 native Tests und 15 Browser-Suiten bestanden; API-31/35-Updates von 303/318 erhalten Daten und UID, alte Schlüssel abgewiesen. Signatur, Quellen, Tag und Prüfsummen geprüft. [Nachweise](qa/build319/).

## 1.0.3-318 — 9. November 2026 — Motero 1.0.3

- Neue Randmaskierungen gepufferter Seiten werden auch bei unverändertem Seitenrahmen sofort gezeichnet. Die Layout-Optimierung behält ihre gezielten Stiländerungen; der inkrementelle Renderer erhält weiterhin die erforderliche Aktualisierung.
- Veröffentlicht und unabhängig geprüft: 333 Reader-Tests, 125 native Tests und 14 Browser-Suiten bestanden. Signatur, Quellen und Prüfsummen stimmen; beide API-31/35-Gates erhalten Daten und UID bei Updates von 303 und 317. Alle Cropping-, Performance- und Bedienungsänderungen aus 317 enthalten.

## 1.0.2-317 — 9. November 2026 — Motero 1.0.2

- Jumped: kurze Seiten bleiben zentriert; lange Seiten beginnen vorwärts oben und rückwärts unten. SmartScroll und erneutes Fitting behalten den Lesebereich statt die Mitte der nächsten Seite zu übernehmen.
- Zuschnitt erkennt Kopf-/Fußzeilen anhand Position, Schriftmerkmalen, Abständen und Seitenfolgen; römische Folien und lokale Kapitelwechsel ergänzt. Fußnoten und größere Überschriften bleiben geschützt. Neue Geometrie-Cachegeneration verwirft veraltete Automatik-Ergebnisse.
- Reine Textseiten umgehen die zusätzliche Rasteranalyse, sobald PDF.js-Zeichenoperationen Grafiken, Scans und komplexe Inhalte ausschließen. Bei fehlenden optionalen Randverweisen genügt ein gemeinsames Analyseergebnis. Raster-Fallback und Pixelgrenzen bleiben erhalten.
- Aktuelle/sichtbare Seiten vor Nachbarn vorbereiten, einen Analyseplatz für Vordergrundarbeit freihalten und vorhandene gültige Zuschnitte bei neuer Layout-Erkennung erhalten. Unveränderte Seiten benötigen keine erneuten Stiländerungen; Positionskorrektur vermeidet erzwungene Layout-Lesezugriffe.
- Manueller Editor berücksichtigt gemessene Bedienelemente, Systemabstände und seitliche Ausschnitte, bricht schmale Bedienzeilen um und begrenzt Vorschaupixel auch bei ungewöhnlichen Formaten.
- PDF-Tipp bei offener Drag-Highlight-Leiste schließt ausschließlich diese Leiste; keine zusätzliche Toolbar-, Bookmark- oder Blätteraktion. Gemeinsame Symbolspalte richtet alle Annotations-Seitenlabels gleich aus.
- Zusätzliche Regressionen und lokale, begrenzte Performance-Messwerte. Details und Quellen: [Cropping and scrolling](docs/CROPPING_AND_SCROLLING.md). Physische BOOX-/Pixel-Prüfung und Kontosync bleiben separat.

## 1.0.1-316 — 9. November 2026 — Motero 1.0.1

- Veröffentlicht und unabhängig geprüft: 314 Reader-Tests, 125 Android-Tests, 13 Browser-Suiten und beide API-31/35-Updates bestanden. Signatur, Quellen und Prüfsummen stimmen. Zusätzlicher nativer Eingabetest durch Emulator-Start-/Grafikprobleme blockiert; physische UI-Prüfung und Kontosync separat.

- Jumped zentriert die Leseseite nach Wischen, Randtippen, direktem Seitensprung und Rückkehr aus der Übersicht. Breitenanpassung richtet nicht mehr am oberen Rand aus; ohne Zuschnitt erhalten erste/letzte kurze Seiten genügend Darstellungsraum zum Zentrieren.
- Jump-to im Kopf aller Annotationskarten, ausgewählt und nicht ausgewählt, direkt links neben den drei Punkten. Sprung schließt Sidebar, Werkzeugleisten und Annotationsdialoge und erhält die Fit-Einstellung.
- Im Bookmark-Schnellfilter ersetzt bei nicht ausgewählten Bookmarks der rote Löschknopf die drei Punkte; nach Auswahl stehen wieder Jump-to und die drei Punkte bereit. Löschberechtigungen bleiben wirksam.
- Menüaktionen richten sich ausdrücklich an die angeklickte Karte, auch wenn eine andere Annotation ausgewählt ist. Lange Seitenlabels lassen beide Aktionen sichtbar.
- Die freie Fläche im Sidebar-Kopf fängt Berührungen ab; darunterliegende PDFs erhalten dort keine Klicks. Im schwebenden Reader-Kopf bleiben die freien Zwischenräume unverändert.
- Patch-Release mit unveränderter Paket- und Signieridentität, höherem Android-Code 316 und Update-Prüfung von Build 315.

## 1.0.0-315 — 9. November 2026 — Motero 1.0

- Veröffentlicht und unabhängig geprüft: 314 Reader-Tests, 123 Android-Tests, 13 Browser-Suiten und beide API-31/35-Updates bestanden. Prüfsummen, Quellen und Produktionssignatur stimmen; physische Sicht-/Animations- und Kontosync-Prüfung separat.

- „Jumped“ und „Continuous“ direkt unter Scrolling: freie Bewegung wie bisher oder vollständige Seitenwechsel per Wischgeste, mit einer sichtbaren Leseseite. Zwei-Finger-Zoom und antippbare Seitenübersicht bleiben erhalten, unabhängig von Scrollrichtung und Zuschnitt.
- Undo ganz links im Annotationsdock, Redo per langem Druck und barrierefreier Langdruck-Aktion. Verlauf und Redo-Verfügbarkeit werden zwischen Reader und Android übertragen.
- Runde Farbfeld-Rückmeldung und weißer Auswahlring wie im Annotationsdialog; keine zusätzlichen Haken auf den Hashtag-Kürzeln. Vier verschiebbare Farben und ein dauerhaft erreichbares violettes Feld, mit einrastender Palette und adaptiver Breite.
- Dock-Breite wird vor dem Werkzeugwechsel angepasst, auch beim Verkleinern auf breiten E-Readern. Statusleisten-Abdeckung folgt Reader-Theme und Toolbars; im Vollbild bleibt kein reservierter oder abgedeckter PDF-Streifen zurück.
- Erster stabil benannter Release „Motero 1.0“. Ältere Releases werden als Alpha gekennzeichnet; bestehende Tags, APK-Dateien und Signaturen bleiben erhalten. Android-Buildnummer steigt auf 315, aktuelle Update-Basis ist Build 314.

## 1.0.0-314 — 9. November 2026

- Veröffentlicht und unabhängig heruntergeladen geprüft: 312 Reader-Tests, 122 native Tests, zwölf Browser-Suites und beide API-31/35-Update-Prüfungen bestanden. Signatur, Quellen und Prüfsummen stimmen überein; native Sichtprüfung wegen lokaler Emulator-Grafikprobleme begrenzt.

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


## 1.0.0-313 — 9. November 2026

- Veröffentlicht und unabhängig heruntergeladen geprüft: 308 Reader-Tests, 122 native Tests, zwölf Browser-Suites und beide API-31/35-Update-Prüfungen bestanden; Produktionssignatur, Quellen und Prüfsummen stimmen überein.

- „Fit relative to“ bei Breiten-/Höhenanpassung wieder sichtbar und wirksam; explizite Bezugsfläche wird gespeichert. Bestehende Fit-Einstellungen bleiben bis zu einer neuen Auswahl erhalten.
- Manual-Cropping-Auswahl zeigt beim erneuten Öffnen den gespeicherten Dokumentmodus; veraltete Einstellungswerte werden nicht erneut angewendet.
- Die aktuelle Seite erhält auch nach normalen Seitenwechseln ein Vorschaubild und wird bevorzugt gerendert. Feste Vorschauplätze verhindern nachträgliche Breitenänderungen.
- Gemeinsames unteres Dock mit fester Höhe und Unterkante, abgestimmtem Breitenwechsel und vertikalem Austausch von Seitenvorschau und Annotationswerkzeugen.
- Farbfeld öffnet eine zweite Werkzeugzeile mit Zotero-Palette und Größenreglern. Flächen- und Strichradierer sind direkt umschaltbar; Strichradierer erfasst auch schnell gezeichnete Segmente und erhält andere Striche.
- Neuer schräg gebogener Sprungpfeil für Bookmarks. Paketkennung und Produktionssignatur unverändert; aktuelle Update-Basis ist Build 312.

## 1.0.0-312 — 8. November 2026

- Veröffentlicht und unabhängig geprüft: 305 Reader-Tests, 119 native Tests, zwölf Browser-Suites und beide echten API-31/35-Updates bestanden; Signatur, Quellen und Prüfsummen stimmen überein.
- Entfernte PDF-Miniaturseiten werden nach einem Neustart des Readers oder seines Renderers erneut angefordert. Die gewünschten Seitenindizes bleiben erhalten, während alte Bilddaten weiterhin verworfen werden. Eine native Regression reproduziert den Fehler vor der Korrektur.
- Enthält alle Reader-UI-, Zuschnitt-, Speicher- und Stiftverbesserungen aus Build 311. Die Update-Prüfung verwendet Build 311 als aktuelle Vorgängerversion; Signierer und Paketkennung bleiben unverändert.

## 1.0.0-311 — 8. November 2026

- Gespeichertes Reader-Theme gilt vor dem ersten HTML-Bild; explizites Light/Dark wird nicht mehr vom System-Theme überschrieben. Status- und Navigationssymbole folgen dem Reader, Vorschaubilder werden bei Themewechsel zuverlässig erneuert.
- Unteres PDF-Werkzeug-Dock ersetzt bei aktiviertem Stift Seitenvorschau und Seitenzahl: Notiz, Text, Stift, Radierer, Bereich, Undo und Farbfeld. Einheitliche Außenrundung und erreichbare Touchflächen.
- Content-Cropping-Auswahl im Stil der übrigen Einstellungen. Kompakter nativer Crop-Kopf, neutraler Hintergrund und auf die PDF-Seite begrenzte Abdunklung; größere unsichtbare Greifflächen am Rahmen.
- Bookmark-Sprung mit gebogenem Rechtspfeil. Nur schwarze semantische Bookmarks erhalten das Fähnchen, auf der PDF mit 70 % und in der Liste mit voller Deckkraft. Normale Notizen und vorhandene andere Bookmark-Farben bleiben erhalten.
- Zuschnitt lernt aus verteilten und lokalen Seiten. Geometrie und numerisches Modell werden begrenzt zwischengespeichert. Analyse-Pixel, Vorschau-Speicher und Warteschlangen sind begrenzt; gültige Ergebnisse bleiben beim Nachlernen erhalten.
- Zuschnitt-Regressionsprüfungen schützen unterschiedliche Seitenformate und später eintreffende lokale Evidenz; bei Stiftkontakt wird nicht neu positioniert.
- Stifteingabe erhält kurze Striche, Endpunkte und gesammelte Eingabe bei Abbruch; veränderte Zeichenobjekte werden pro Frame aktualisiert und unveränderte wiederverwendet. Forschungsstand und weitere gerätespezifische Schritte: [Reader-Review](docs/READER_OPTIMIZATIONS.md).

## 1.0.0-310 — 8. November 2026

- Verhindert einen verzögerten, künstlichen Pointer-down nach priorisierten Randtipps oder Lesezeichen-Shortcuts bei sichtbarer Reader-Leiste. Der wartende Toolbar-Tap wird dabei vollständig abgebrochen; er startet nach dem Seitenwechsel keine neue Geste.
- Zusätzliche Timer-Regression reproduziert den Fehler vor der Korrektur und verhindert ein Wiederauftreten. Die Funktionen aus Build 309 bleiben enthalten.
- Update-Prüfungen umfassen nun Build 309 als aktuelle Vorgängerversion; Signierer und Paketkennung bleiben unverändert.
- Veröffentlicht und unabhängig heruntergeladen geprüft: 290 Reader-Tests, 118 native Tests, elf Browserprüfungen und beide API-31/35-Update-Prüfungen erfolgreich. Signatur, Quellen und Prüfsummen stimmen überein.

## 1.0.0-309 — 8. November 2026

- Neue Lesezeichen sind schwarz. Bestehende Farben bleiben erhalten. Der obere rechte Shortcut schaltet das Lesezeichen der zentrierten Leseseite um, auch wenn Fragmente anderer Seiten sichtbar sind.
- Im Lesezeichenfilter bieten nicht ausgewählte Karten einen direkten Seitensprung und einen roten Löschknopf. Ausgewählte Karten behalten das normale Bearbeitungsmenü. Die untere Filterleiste sitzt etwas tiefer.
- Schmalere Blätterbereiche: 12 % der Breite, maximal 64 CSS-Pixel. Randtipps haben vor Highlights Vorrang; Links und längere Auswahlgesten bleiben bedienbar.
- Zwei Finger zeigen die Originalseiten. Nach dem Herauszoomen bleibt eine Übersicht mit mindestens zwei vollständig sichtbaren Seiten offen; sonst kehrt der Reader zum Lesefit zurück. Ein Seitentipp stellt den Fit wieder her.
- „Content cropping“ trennt Automatic und Manual vom Seiten-Fitting. Manuelle Rahmen bleiben beim Wechsel zur Automatik gespeichert. Speichern verändert weder Fit noch Scrollmodus; Off zeigt das unbeschnittene Papier.
- Manueller Zuschnitt mit nativen Zotero-Material-Bedienelementen, gemessenen Vorschauabständen und denselben funktionierenden Ziehgriffen. Auswahl-Lupe mit größerem Kontext.
- Verbesserte Erkennung getrennter Kant-Randfolien und isolierter unterer Seitenzahlen; Fußnoten und zentrale Überschriften bleiben geschützt.
- EPUB-Fortschritt durch Antippen oder im Menü umschaltbar: Position und Prozent, ausgeblendet, Position, Prozent. Gespeicherte Darstellung; stabiler Viewport ohne alten Toolbar-Abstand. Gespeichertes Theme gilt beim Öffnen, zusätzliche WebView-Verdunkelung deaktiviert.
- Aktuelle Seiten warten nicht auf acht Nachbaranalysen. Priorisierte, deduplizierte Analyse mit maximal zwei laufenden Aufgaben, begrenztem Cache und zusammengefassten Layout-Aktualisierungen. Schnelle Blätterfolgen behalten ihr Endziel.
- Bei beendetem WebView-Renderer einmal kontrolliert an der gespeicherten Lesestelle neu laden, bei wiederholtem Ausfall manueller Neustart. Der gemeldete Geräteabsturz ist ohne Geräteprotokoll keiner einzelnen Ursache sicher zuzuordnen.
- Release prüft zusätzlich das Update von Build 308 samt Datenerhalt. Die bisherigen API-31/35-Migrations- und Signaturprüfungen bleiben bestehen.

## 1.0.0-308 — 7. November 2026

- PDF-Zuschnitt bleibt beim Ein-Finger-Scrollen erhalten. Sichtbare Seiten und ihr Puffer werden vorbereitet; zugeschnittene Inhaltsrahmen bestimmen den Seitenabstand, statt die unsichtbaren Papierränder mitzuscrollen. Das gilt für Vertical, Horizontal und Wrapped.
- Zwei Finger zeigen vorübergehend die vollständigen PDF-Seiten. Nach dem letzten Loslassen werden Lesestelle, Zentrierung und eingestellter Zuschnitt/Zoom wiederhergestellt.
- Seitliche römische Kant-Verweise sowie zusammenhängende Verlags-/Download-Wasserzeichen werden besser erkannt. Fußnoten bleiben durch Regressionen geschützt.
- Manueller Zuschnitt: echte Touch-Klicks auf Übernehmen, Abbrechen, Zurücksetzen und Vorschauseiten repariert; native Reader-Leisten während des Editors ausgeblendet. Überarbeitete Oberfläche mit Zotero-Farben, kompaktem Kopf und klarer Seitenbereichsauswahl; Android-Zurück bricht den Editor ab.
- Eigener Lesezeichenfilter neben der Annotationssuche, unabhängig von der Lesezeichenfarbe. Bestehende graue Lesezeichen bleiben erkennbar, neue sind blau; Karten zeigen Seite sowie Datum und weitere gespeicherte Angaben ohne redundanten Lesezeichen-Präfix.
- Größere Annotationsfilterleiste mit Abstand zur Android-Gestenleiste.
- Übersicht: Seitentipp stellt den Lesefit auch in Vertical und Horizontal wieder her.
- Schriftgrößenregler mit Prozentanzeige für EPUB und Text-Lesemodus; Einstellung wird gespeichert und tatsächlicher Textzoom zurückgemeldet.
- Prüfung: 282 Reader-Tests, 113 native Tests, zehn Browserprüfungen und elf Veröffentlichungs-/Signierprüfungen lokal bestanden; vollständige Original-Plessner-Prüfung über 116 Seiten. APK-Identität und eingebettete Quellen geprüft.
- Erfolgreiche Installation von Build 307 auf Pixel 8 mit GrapheneOS durch den Nutzer bestätigt. Die neuen Reader-Funktionen und BOOX-Bedienung benötigen weiterhin Rückmeldung vom Gerät.

## 1.0.0-307 — 7. November 2026

- Update-Konflikt beim Wechsel vom öffentlichen Testschlüssel zum privaten Motero-Schlüssel behoben: eigene neue Receiver-Berechtigung statt erneuter Deklaration der alten Signaturberechtigung.
- AndroidX-Receiver prüfen dieselbe neue Berechtigung auch auf Android 9–12. Der alte Schlüssel erhält weiterhin keine Signaturberechtigungs- oder Rollback-Rechte.
- APK-Prüfung kontrolliert gemeinsam Manifest, Schutzstufe und tatsächliche AndroidX-Strings im DEX-Code.
- Veröffentlichung setzt jetzt echte Android-Updateprüfungen auf API 31 und 35 voraus: ursprüngliches 303 installieren, 306-Konflikt reproduzieren, Update samt privatem Testdatensatz/UID prüfen und Updates/Berechtigungszugriff mit dem alten Schlüssel zurückweisen.
- Browser-Randtap-Prüfung wartet auf stabilen Readerzustand und abgeschlossene Navigation; Gesten- und Bookmark-Prüfungen bleiben erhalten. Lokal normal und mit zweifach gedrosselter CPU bestanden.
- Build 307 mit erfolgreichen echten Updateprüfungen auf Android API 31 und 35 veröffentlicht; Datenerhalt, unveränderte UID, App-Start und Abweisung alter Schlüssel geprüft. 276 Reader-Tests, 109 native Tests, zehn Browserprüfungen und sieben Veröffentlichungs-/Signierprüfungen bestanden. Physische Bestätigung auf GrapheneOS/BOOX steht aus.

## 1.0.0-306 — 7. November 2026

- Öffentliche Variante mit privatem Motero-Signierer, V3-Zertifikatsrotation, Android 9+ und deaktiviertem Debugging/Crash-Reporting; alter Testschlüssel ohne Rollback-Recht.
- GitHub baut ohne Signiersecret, prüft Quellen und veröffentlicht nur nach geschützter Signierung. Fehlende oder falsche Schlüssel stoppen den Release.
- Alte Test-Releases als private Entwürfe archiviert und das alte CI-Test-APK-Artefakt entfernt.
- Historie und Release-Anhänge auf bekannte Geheimnisse/persönliche Dateien geprüft; wiederholbare Veröffentlichungskontrolle ergänzt.
- ChatGPT-/Codex-Unterstützung offengelegt, übernommene Original-PRs eingeordnet und Zotero/Community ausdrücklich gewürdigt.
- Private GitHub-Signierung eingerichtet und Build 306 erfolgreich veröffentlicht; heruntergeladene APK erneut geprüft. 276 Reader-Tests, 109 native Tests, zehn Browserprüfungen und fünf Veröffentlichungs-/Signierprüfungen bestanden. Physischer Update-Test steht noch aus.

## 1.0.0-305 — 7. November 2026

- Tag-Vorschläge nach Häufigkeit im Dokument und in der Bibliothek; graue Ergänzung, einheitliches Bestätigen und ausdrückliche Neuanlage.
- Manueller PDF-Zuschnitt für alle, ungerade und gerade Seiten mit lokaler Speicherung pro Anhang.
- Randtippen in vertikalem, horizontalem und Wrapped-PDF-Modus; Bookmark-, Annotations- und Gestenvorrang bleiben erhalten.
- 276 Reader-Tests, 109 Android-Tests und zehn Browserprüfungen bestanden.
- Vollständigen Android-/Reader-Quellstand und nachvollziehbare Commits nach GitHub übernommen; Build-/Release-Workflow und Fork-Dokumentation vorbereitet.

## 1.0.0-304 — 6. November 2026

- Isolierte Footer samt Trennlinie erkennen, ohne Anmerkungen zu verlieren.
- Vollständigen Annotationstext per Tipp kopieren.
- EPUB-Restabschnitte und Kapitelgrenzen beim Blättern korrekt erreichen.
- Bookmarks durch erneutes Tippen entfernen.
- Aktuelle und beide Nachbarseiten gemeinsam für den Zuschnitt vorbereiten.
- Nach Fingerzoom zum gewählten Fit zurückkehren; vorübergehendes Verschieben bleibt möglich.

Ältere Funktionen und Prüfnachweise stehen in `FEATUREPLAN.md` und `qa/`. Physische Geräte- und echte Kontosync-Tests sind gesondert zu betrachten.
