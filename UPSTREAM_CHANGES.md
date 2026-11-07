# Übernommene Änderungen aus den Originalprojekten

Geprüft am 7. November 2026 anhand der Git-Historie und der GitHub-PR-Metadaten. Die ursprüngliche Urheberschaft und vorhandene Co-Author-Hinweise bleiben erhalten. Eigene Motero-Anpassungen wurden mit ChatGPT/Codex umgesetzt; diese Aussage schreibt die folgenden Originalbeiträge nicht ChatGPT zu.

| Originalbeitrag | Einordnung in Motero | Status im Original bei der Prüfung |
| --- | --- | --- |
| [Zotero Android #298 — Add volume buttons zoom](https://github.com/zotero/zotero-android/pull/298) | Der entsprechende Entwicklungszweig `add_volume_buttons_zoom` ist über Merge `ecb3f171` Teil der importierten Android-Historie. Die Hardware-Tasten wurden in Motero weiter angepasst. | **Offen, nicht im Original gemergt.** Der übernommene PR-Head ist `83a96c3e`. |
| [Zotero Android #353 — Fit to Content](https://github.com/zotero/zotero-android/pull/353) | PR-Stand `f5ff0a91` ist über den ausdrücklichen Merge `c826f975` enthalten und wurde anschließend für Motero erweitert. | **Offen, nicht im Original gemergt.** |
| [Zotero Android #348 — Leisten beim Randtippen ausblenden](https://github.com/zotero/zotero-android/pull/348) | Der Original-Merge `1faa4de7` ist ein Vorfahr unseres Android-Stands. | Im Original gemergt. |
| [Zotero Reader #254 — Position beim Scrollmoduswechsel erhalten](https://github.com/zotero/reader/pull/254) | Der Original-Merge `2a0bc655` ist in der Reader-Historie enthalten. | Im Original gemergt. |
| [Zotero Reader #256 — Zoom-/Positionsversatz beim Blättern](https://github.com/zotero/reader/pull/256) | Der Original-Merge `a94045fe` ist in der Reader-Historie enthalten; Motero erweitert die Navigation. | Im Original gemergt. |
| [Zotero Reader #260 — Fit to Content](https://github.com/zotero/reader/pull/260) | Der entsprechende Inhalts-Fit bildet eine Grundlage der anschließend erweiterten Motero-Fit-Geometrie. | **Offen, nicht im Original gemergt.** |

Nicht jeder im Featureplan verlinkte PR wurde übernommen. Dort werden auch recherchierte, abgelehnte oder später eigenständig nachgebaute Ansätze dokumentiert. Zum Beispiel ist Android #205 eine Referenz für das Teilen von Anhängen; die Motero-Implementierung nutzt eigene Anpassungen am aktuellen Downloader und FileProvider.

Vielen Dank an sämtliche ursprünglichen Autoren, Reviewer und Maintainer dieser Beiträge und an die Zotero-Community. Maßgeblich bleiben die Copyright- und Lizenzhinweise der Originalquellen.
