# Änderungen

## 1.0.0-313 — 9. November 2026

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
