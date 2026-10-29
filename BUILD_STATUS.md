# Build 293: Prüfstand

Die neun ausgewählten Features F01, F02, F05, F06, F16, F17, F18, F20 und F21 sind implementiert. Die APK wurde vollständig gebaut und auf Update-Kompatibilität zu Build 292 geprüft.

| Prüfung | Ergebnis |
|---|---|
| Paketkennung | `org.zotero.android.debug` |
| Version | `1.0.0-293` / 293 |
| Bisherige Version | 292 |
| Zertifikat SHA-256 | `c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299`; identisch zur bisherigen APK |
| APK SHA-256 | `c8904764e948fb850f99b995e6113866bd3a67960f2579de5c4bc225554d3f2e` |
| Größe | 199,618,328 Bytes |
| Reader SHA-256 | `fb61b75d50488a7f5b2ecdaaa61e629c72ff16d34412230810eb74243fe23967` |
| Reader-Tests | 206 bestanden |
| Android-Logiktests | 6 bestanden |
| Browser-Funktionsprüfungen | bestanden, einschließlich Mul-PDF und Touch/Stift |
| Unveränderte Laufzeitdateien/Bibliotheken | 88 bytegleich zur Basis |
| DEX-Dateien | 8 |
| Installation am physischen BOOX | hier nicht möglich |

Die APK als Update installieren und die bestehende App vorher nicht deinstallieren. Gleiche Paketkennung und Signatur sowie der höhere Versionscode wurden direkt an beiden APKs kontrolliert. Das Datenbankschema und die Anmeldedaten-Verwaltung wurden nicht verändert.

Die native Oberfläche wurde kompiliert und ihre Tag-/Filter-/Sichtbarkeitslogik geprüft; eine echte native Fensterdarstellung auf dem BOOX wurde nicht visuell geprüft. Details und praktische Bedienung stehen in BUILD_BOOX.md.
