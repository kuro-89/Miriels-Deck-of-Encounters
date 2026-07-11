# Release Audit 0.24.3

## Technisch geprüft

- JavaScript-Syntax aller Skripte
- lokale Datei- und Asset-Verweise
- keine macOS-Metadaten im Release
- kein Ordnername mit abschließendem Punkt
- keine Verweise auf die entfernte interne Review-Datei
- getrennte Lade-Reihenfolge für SRD 5.1 und SRD 5.2.1
- Hex/Verwünschung nicht mehr als SRD-5.1-Inhalt geführt

## Inhaltlich umgesetzt

- SRD 5.1 bleibt als 2014-Regelbibliothek erhalten.
- SRD 5.2.1 ist als getrennte 2024-Regelbibliothek ergänzt.
- Verwünschung ist der SRD-5.2.1-Bibliothek zugeordnet.
- Pakt der Klinge und Zurückdrängender Strahl wurden als geprüfte SRD-5.2.1-Merkmale wieder in die Demo aufgenommen.
- Andere zuvor entfernte Merkmale wurden nicht automatisch wiederhergestellt.

## Manuell vor dem Push testen

1. App über einen lokalen HTTP-Server öffnen.
2. Kartenschmiede → Spells → Aus SRD-Bibliothek.
3. Zwischen SRD 5.1 und SRD 5.2.1 wechseln.
4. In SRD 5.2.1 nach „Verwünschung“ suchen und hinzufügen.
5. Prüfen, dass freie eigene Spells weiterhin erstellt werden können.
6. Lioras Traits auf Pakt der Klinge und Zurückdrängender Strahl prüfen.
7. `legal.html`, `imprint.html` und `privacy.html` über den Footer öffnen.
8. Spieleransicht, Local Storage, Import/Export und BroadcastChannel kurz testen.

Ein vollständiger automatisierter Browser-End-to-End-Test ist in diesem Release noch nicht enthalten.
