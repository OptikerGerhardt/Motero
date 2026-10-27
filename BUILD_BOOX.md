# Zotero Boox: Build 292

## Neue Funktionen

**Direkt markieren:** Im PDF-Reader etwa 450 ms auf ein Wort drücken, den Finger oder Stift auf dem Display lassen und weiterziehen. Die Auswahl rastet an Wortgrenzen ein. Beim Loslassen wird sie als Hervorhebung gespeichert. Im Unterstreichen-Werkzeug wird eine Unterstreichung gespeichert. Im normalen Zeiger-Werkzeug wird die zuletzt in dieser Reader-Sitzung benutzte Markierfarbe verwendet, sonst Gelb.

Schnelles Wischen scrollt weiter. Ein zweiter Finger, eine abgebrochene Berührung, ein Größenwechsel oder das Verlassen des Readers verwirft die laufende Markierung. Notizen, vorhandene Anmerkungen, Links und Texteingaben behalten ihre eigenen Gesten. Die Funktion benötigt eine auslesbare Textebene; sie führt kein OCR aus. Unter den Reader-Einstellungen > Text markieren / Text marking kann auf Android-Auswahl / Android selection zurückgeschaltet werden.

**Fit to Width:** In den Reader-Einstellungen > Page fit / Seitenanpassung stehen Off, Fit to Content und Fit to Width zur Auswahl. Fit to Width passt die vollständige PDF-Seite an die verfügbare Breite an. Der normale Abstand des PDF.js-Viewers bleibt bestehen. Beim erneuten Öffnen wird die Breite für das aktuelle Display neu berechnet. Die gespeicherte vertikale Leseposition bleibt erhalten. Fit to Content und seine einstellbaren Restabstände bleiben als eigene Alternative verfügbar.

## Update auf dem Boox

Die APK über die installierte Zotero-Debug-App installieren, ohne diese vorher zu deinstallieren. App-ID: `org.zotero.android.debug`; Version-Code: 292. Es wird weiterhin der im Originalprojekt enthaltene Debug-Schlüssel benutzt. Sein Zertifikat stimmt mit der zuvor ausgelieferten SmartScroll-APK (Build 291) überein:

`C4:E7:0A:69:35:D2:39:24:65:40:53:2B:6D:3E:A5:14:EB:2A:42:8E:1E:8E:AA:CB:F9:4C:8A:9A:01:98:92:99`

Die App verwendet dadurch weiterhin ihre vorhandenen Daten, Anmeldung und Einstellungen. Die offizielle Zotero-App hat eine andere App-ID/Signatur und wird nicht ersetzt. Ein Installationstest auf dem physischen Gerät ist noch erforderlich.

## Bereits enthalten

- Android PR #298: Lautstärketasten und Einstellungen.
- Android PR #353 einschließlich #352 sowie Reader PR #260: Randbeschnitt und gespeicherter PDF-Zoom.
- Anbindung der Lautstärke- und Page-Up/Down-Tasten an den aktuellen Web-Reader.
- Scrollen innerhalb einer Seite; erst ein weiterer Druck am Seitenrand blättert um.

Unter Settings > Page turning wird die Tastensteuerung aktiviert. Standard: 2/3 der sichtbaren Bildschirmhöhe. Alternativen: direktes Umblättern, 1/3, 1/2 oder 1 Bildschirmhöhe. Die Richtung ist umkehrbar. Auf dem Boox die App-Tasten auf Lautstärke oder Umblättern stellen.

Leiser scrollt abwärts, bis zum unteren Seitenrand. Erst der folgende Tastendruck öffnet die nächste Seite oben. Lauter arbeitet umgekehrt und öffnet die vorige Seite unten. Randbeschnitt wird berücksichtigt; Zoom und horizontale Position bleiben erhalten. Gedrückthalten wiederholt nicht. Bei Suche und Texteingaben greift die Tastensteuerung nicht ein.

Die Änderungen gelten für den aktuellen, WebView-basierten PDF-Reader. Die alte Nutrient-Implementierung ist im Quellcode erhalten, wird durch diese Version aber nicht wieder aktiviert. Eine Produktionslizenz für den alten Reader ist nicht enthalten.

## Quellcode wiederherstellen

Das Archiv enthält einen lesbaren Quellcode-Snapshot und vollständige Git-Bundles für Android und Reader. Die lokalen Änderungen sind nicht auf GitHub veröffentlicht.

```bash
git clone -b boox-smart-scroll zotero-android.bundle zotero-boox
git clone -b boox-smart-scroll reader.bundle zotero-boox/reader
cd zotero-boox
git submodule update --init --recursive
```

Die unveränderten Submodule werden von ihren öffentlichen Ursprungs-Repositories geladen.

## APK bauen

Voraussetzungen: JDK 17, Node/npm, Python 3, zip/unzip, Android SDK mit Plattform 37.0 und Build Tools 36.0.0. `ANDROID_HOME` oder `local.properties` müssen auf das SDK zeigen.

```bash
bash scripts/build_boox_debug.sh
```

Der Reader muss lokal gebaut werden. Das normale `bundle_reader.sh` lädt einen vorgebauten Reader und würde die eigenen Änderungen verlieren. `bundle_reader_local.sh` erstellt stattdessen die Assets und ihren Hash aus dem lokalen Reader.

## Tests

```bash
cd reader
npm ci --no-audit --no-fund
npm test
```

205 Tests, darunter 9 neue Tests für langes Halten, Ziehen, schnelle Wischgesten, Stift und Finger, Multitouch, Abbrüche und verzögerte Textextraktion.

Zusätzlich liegt `reader/scripts/test-boox-browser.cjs` mit einer selbst erzeugten Test-PDF bei. Nach dem Android-Reader-Build kann das Skript mit installiertem Playwright ausgeführt werden. Optional weist `BOOX_TEST_BROWSER` auf eine vorhandene Chromium-Binärdatei. Die Prüfung deckt echtes PDF-Rendering, gespeicherten Zoom gegenüber Fit to Width, Größenwechsel, Finger- und Stiftmarkieren, Scrollen, native Textauswahl als Alternative und die Übergabe von Multitouch an PDF.js ab. Die Zoom-Skalenänderung der Touch-Simulation war auch im Vergleichsmodus ohne die neue Markiergeste nicht nachweisbar; ein erfolgreicher Pinch-Zoom auf dem Zielgerät wird damit nicht behauptet.

Ein physischer Boox ist nicht angeschlossen. Die praktische Bedienung, E-Ink-Reaktionszeit und die Installation als Update müssen am Gerät geprüft werden.
