# Motero: offener Featureplan

Stand: **18. November 2026**. Die 17 Reader- und Stabilitätsarbeiten sind für **1.1.7 / Build 333** umgesetzt. [Details zu Build 333](docs/READER_333.md) · [Changelog](CHANGELOG.md) · [Build-Nachweise](BUILD_STATUS.md) · [Plan-Historie](docs/FEATUREPLAN_HISTORY.md)

## Weitere optionale Erweiterungen

Diese Ideen bleiben für spätere Updates vorgemerkt.

- **Druckabhängige Handschrift und Strichgruppen (F13 / Rest F03):** Breitenvariation so integrieren, dass Undo, Annotationen und Austausch mit Desktop erhalten bleiben; [Reader-PR #264](https://github.com/zotero/reader/pull/264) bleibt eine Forschungsreferenz, kein fertig übernommener Port.
- **EPUB-Lesekomfort:** Import eigener Schriften, Buchprofile, Kapitelstatistik und Restlesezeit; vorhandene Buch-/Serif-/Sans-Schriften und Fortschrittsanzeige nicht als fehlend führen.
- **Android-Vorlesen / TTS:** Auf eine offizielle Zotero-Android-Umsetzung warten und diese später gezielt übernehmen; keine eigene Umsetzung beauftragt.
- **Sync-Wiederholungen:** Auf die offizielle Zotero-Umsetzung warten; keine eigene Retry-/Backoff-Änderung beauftragt.
- **Weitere nachrangige Rechercheideen:** Zitierfunktionen, Bilder in Notizen, Farbnamen für E-Ink und späterer PDF-Export mit eingebetteten Annotationen. Das Teilen der Originaldatei ist bereits vorhanden.

PDF-Gliederungen werden am Desktop erstellt, nicht als Android-Feature verfolgt. BOOX-SDK-/Refresh-Arbeit ist zurückgestellt; eine spätere Erklärung ist gewünscht. EPUB-Erweiterungen, druckabhängige Stiftbreite und die nachrangigen Export-/Notizideen bleiben vorgemerkt.

## Ausstehende Prüfungen, keine fehlenden Grundfunktionen

- **Echte Geräte:** BOOX Go Color 7 Gen II/InkSense, EMR-Stiftgerät, Pixel und Tablet: Stifttasten/Handballenschutz, Displayabstände, Sidebar/Rotation und E-Ink-Latenz bestätigen. Portabler Stiftmodus, Hold/Toggle, Eraser-Tip, Diagnostik und E-Reader-Profil existieren bereits.
- **Originaldateien:** Vollständige Leviathan-/Kant-Crop-Prüfung bleibt offen, solange die Originale nicht vollständig übertragbar sind. Born wurde in Build 329 vollständig am Original geprüft; neue konkrete Crop-Fehler weiterhin als Regression erfassen.
- **EPUB-Sonderfälle:** Kundera-Überschriften mit einer zweiten Datei gegenprüfen; CJK-/vertikale Layouts und spezielle CFI/Pagebreak-Dateien nur anhand reproduzierbarer Originalfälle ändern. Kein pauschaler Formatierungsfehler behauptet.
- **Echter Kontosync / externe Übergabe:** Live-Synchronisation und tatsächliches Öffnen geteilter Dateien in einer zweiten App separat bestätigen. Automatische Emulator-/Browserprüfungen ersetzen diese Nachweise nicht.
- **Geräteoptionen (F10/F11):** BOOX-App-Optimierung und Handschrifttastatur bei Bedarf erproben; das sind keine noch fehlenden Motero-Einstellungen oder ein nachgewiesener SDK-Support.

## Pflege

Nach geprüfter Umsetzung den Punkt aus der offenen Liste entfernen und im Changelog mit Build-Nachweis festhalten. Bei Teilumsetzung nur den tatsächlich fehlenden Rest stehen lassen. Eine ausstehende Geräteprüfung als Prüfung führen, nicht die fertige Funktion wieder als offen markieren. Historische Quellen/Entscheidungen bleiben im [Archiv](docs/FEATUREPLAN_HISTORY.md).
