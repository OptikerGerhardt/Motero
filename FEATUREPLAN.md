# Motero: offener Featureplan

Stand: **18. November 2026** · Code-/Releasebasis: **1.1.6 / Build 332**. Die 17 aktuellen Punkte sind gesammelt und noch nicht umgesetzt. Bereits veröffentlichte Funktionen stehen in [Changelog](CHANGELOG.md), [Build-Nachweisen](BUILD_STATUS.md) und [Plan-Historie](docs/FEATUREPLAN_HISTORY.md).

## Aktuell gesammelt: 17 Punkte

Die Nummern entsprechen dem Gespräch; spätere Präzisierungen ersetzen die frühere Formulierung. Alle Oberflächenänderungen verwenden Zotero-Komponenten, Abstände, Farben und Typografie.

| Nr. | Offene Arbeit / gewünschtes Verhalten |
| --- | --- |
| 1 | **Reading-Assist-Animation:** Die schwarze ovale Kontur zügig wie mit einem Laserpointer nachzeichnen und schnell verblassen lassen. Keine neue Annotation oder Verschiebung des Inhalts; E-Reader-/Animationsvorgaben berücksichtigen. |
| 2 | **Richtige Zeile markieren:** Schneidet die Hilfslinie ein Wort, besonders knapp unterhalb der Wort-/Zeilenmitte, darf die Lesemarke nicht eine Zeile zu tief erscheinen. |
| 3 | **Größeres Oval:** Mehr Abstand zwischen Kontur und Wort. |
| 4 | **Globale Option Reading Assist:** Lesehilfe im bestehenden Zotero-Einstellungsdesign ein-/ausschaltbar machen; Anwendungsbereich nach Punkt 8. |
| 5 | **PDF-Zentrierung:** Einzelne Seiten ohne Spreads bei Fit to Content und Fit to Height zuverlässig zentrieren; keine wechselnden linken/rechten Positionen beim Öffnen oder Navigieren. |
| 6 | **EPUB-Zentrierung:** Text vertikal korrekt zentrieren; Statusleiste, Displayaussparung und Navigationsleiste sowie deren Ein-/Ausblenden gemeinsam berücksichtigen, ohne unerwünschten Neuumbruch. |
| 7 | **PDF-Seitenabstände:** Um ungefähr ein Drittel verkleinern; Schatten und erkennbare Seitengrenzen erhalten, zusammengehörige Spread-Seiten weiterhin enger als aufeinanderfolgende Seitenpaare. |
| 8 | **Reading-Assist-Sichtbarkeit:** Bei Fit to Width und nur teilweise sichtbarer Seite anzeigen, auch nach einem Seitenwechsel. Keine Markierung, wenn die ganze Seite sichtbar ist. |
| 9 | **Ein-Finger-Scrollen:** Entlang der gewählten horizontalen/vertikalen Richtung wieder normal scrollen können; unbeabsichtigtes Verschieben quer dazu sperren. Bestehende Markierungs-, Zoom- und Hardwaregesten erhalten. |
| 10 | **Stiftbreiten-Regler ausrichten:** Linken Beginn der Reglerleiste dynamisch an der linken Außenkante des ersten sichtbaren Farbkreises ausrichten. |
| 11 | **Stiftbreiten-Zahl:** Innerhalb ihres Anzeigebereichs zentrieren. |
| 12 | **Bookmark bei Spreads stabilisieren:** Bei Odd/Even kein Springen zwischen PDF-Seitenecke und fester Bildschirmecke während normalem Scrollen. Ursache im Browser für beide Paritäten reproduziert: Der Sichtbarkeitsschwellwert wechselt die Darstellung trotz unveränderter PDF-Seite. |
| 13 | **Bookmark-Größe und Abstand:** Fähnchen etwas vergrößern; Abstand oben und rechts gleich groß wählen, jeweils Statusleistenhöhe plus kleiner Sicherheitsabstand. Notch und abgerundete Ränder sicher freihalten. |
| 14 | **Große Scan-PDFs / Scrubber:** Fehlende Teile von [Android c27fe0ad](https://github.com/zotero/zotero-android/commit/c27fe0ad5eebb2fa7d0513b628df297b99a8aae8) gezielt adaptieren: Navigation beim Ziehen höchstens alle 250 ms, Ziel beim Loslassen/Tipp sofort; wartende JS-Aufrufe bei Renderer-Verlust abschließen. Vorhandene Motero-Wiederherstellung, Speicherbudgets und Speicherbereinigung erhalten. |
| 15 | **Theme-/Vorschaukorrekturen:** Fehlende Teile von [Android fd3c884e](https://github.com/zotero/zotero-android/commit/fd3c884e7b413ba890982f5783eb2deb9d69f148) und [Reader 5581a8da](https://github.com/zotero/reader/commit/5581a8daa72013ae7424d41688dfbab5100b47ec) adaptieren: laufende/gecachte Seiten beim Themewechsel korrekt erneuern und Vorschaudaten vor asynchronen Wartephasen entwerten. Bestehende Theme-Guards und generationengebundene Caches nicht ersetzen. |
| 16 | **Tablet-Kollektionsbaum:** Elternpfad bei erfolgloser rekursiver Suche zurücksetzen, damit keine unbeteiligten Zweige aufklappen; [offener PR #322](https://github.com/zotero/zotero-android/pull/322). Fehlende Zeile im Motero-Code bestätigt. |
| 17 | **Download-Effizienz:** Fortschritt nur bei Prozentänderung statt jedem 1-KB-Block melden und unnötige wiederholte MD5-Berechnungen vermeiden; Cache bei Dateiänderung ungültig machen. Gezielt aus [offenem PR #355](https://github.com/zotero/zotero-android/pull/355) adaptieren; dessen zusätzlicher Hintergrunddienst bleibt eine getrennte Entscheidung. |

Vorgesehene Bearbeitung in einem Auftrag: zuerst 1–13, danach 14–17; gezielte Regressionen nach jedem Block, gemeinsame Abschlussprüfungen vor einem Release. Diese Reihenfolge ist kein Umsetzungsnachweis.

## Weitere optionale Erweiterungen

Diese älteren Ideen sind nicht Teil der 17 aktuellen Punkte; es gibt dafür noch keinen neuen Umsetzungsauftrag.

- **Outline-Werkzeuge (F08/F09):** Eigene PDF-Gliederung am Desktop in der Datei speichern bzw. aus Annotationen einer Farbe erzeugen. Eine reine Plugin-Gliederung wird nicht automatisch zur PDF-Outline.
- **Druckabhängige Handschrift und Strichgruppen (F13 / Rest F03):** Breitenvariation so integrieren, dass Undo, Annotationen und Austausch mit Desktop erhalten bleiben; [Reader-PR #264](https://github.com/zotero/reader/pull/264) bleibt eine Forschungsreferenz, kein fertig übernommener Port.
- **Native BOOX-Stiftvorschau / Refresh (F15):** Vorbereitete Schnittstelle an ein tatsächlich unterstütztes Backend anbinden. SDK-Lizenz, InkSense-/EMR-Kompatibilität, Koordinaten/ACK und gemessene Latenzverbesserung sind Voraussetzungen; kein SDK aktiviert. [Grenzen](docs/E_READER_AND_STYLUS.md#experimental-boox-boundary).
- **EPUB-Lesekomfort:** Import eigener Schriften, Buchprofile, Kapitelstatistik und Restlesezeit; vorhandene Buch-/Serif-/Sans-Schriften und Fortschrittsanzeige nicht als fehlend führen.
- **Android-Vorlesen / TTS:** Audiofokus, Bedienung und Positions-/Lebenszyklus-Anbindung als eigenes Paket. Vorhandener Web-Reader-Code allein ist keine ausgelieferte Android-TTS-Funktion.
- **Sync-Robustheit:** Retry-After/Backoff und Fehlerdiagnosen für Serverfehler prüfen; [Recherche](docs/READER_OPTIMIZATIONS.md).
- **Weitere nachrangige Rechercheideen:** Zitierfunktionen, Bilder in Notizen, Farbnamen für E-Ink und späterer PDF-Export mit eingebetteten Annotationen. Das Teilen der Originaldatei ist bereits vorhanden.

## Ausstehende Prüfungen, keine fehlenden Grundfunktionen

- **Echte Geräte:** BOOX Go Color 7 Gen II/InkSense, EMR-Stiftgerät, Pixel und Tablet: Stifttasten/Handballenschutz, Displayabstände, Sidebar/Rotation und E-Ink-Latenz bestätigen. Portabler Stiftmodus, Hold/Toggle, Eraser-Tip, Diagnostik und E-Reader-Profil existieren bereits.
- **Originaldateien:** Vollständige Leviathan-/Kant-Crop-Prüfung bleibt offen, solange die Originale nicht vollständig übertragbar sind. Born wurde in Build 329 vollständig am Original geprüft; neue konkrete Crop-Fehler weiterhin als Regression erfassen.
- **EPUB-Sonderfälle:** Kundera-Überschriften mit einer zweiten Datei gegenprüfen; CJK-/vertikale Layouts und spezielle CFI/Pagebreak-Dateien nur anhand reproduzierbarer Originalfälle ändern. Kein pauschaler Formatierungsfehler behauptet.
- **Echter Kontosync / externe Übergabe:** Live-Synchronisation und tatsächliches Öffnen geteilter Dateien in einer zweiten App separat bestätigen. Automatische Emulator-/Browserprüfungen ersetzen diese Nachweise nicht.
- **Geräteoptionen (F10/F11):** BOOX-App-Optimierung und Handschrifttastatur bei Bedarf erproben; das sind keine noch fehlenden Motero-Einstellungen oder ein nachgewiesener SDK-Support.

## Pflege

Nach geprüfter Umsetzung den Punkt aus der offenen Liste entfernen und im Changelog mit Build-Nachweis festhalten. Bei Teilumsetzung nur den tatsächlich fehlenden Rest stehen lassen. Eine ausstehende Geräteprüfung als Prüfung führen, nicht die fertige Funktion wieder als offen markieren. Historische Quellen/Entscheidungen bleiben im [Archiv](docs/FEATUREPLAN_HISTORY.md).
