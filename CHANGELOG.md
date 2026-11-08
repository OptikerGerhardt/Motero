# Änderungen

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
