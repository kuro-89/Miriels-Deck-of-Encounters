# Release Audit 0.25.2

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

Die Browser-Suite deckt ausgewählte Kernabläufe ab; eine vollständige End-to-End-Abdeckung ist noch nicht erreicht.

## Testarchitektur 0.25.2

Neu hinzugefügt wurden Vitest-Unit-Tests, Playwright-Browser-Smoke-Tests und eine ausführliche lokale Anleitung in `TESTING.md`.

Automatisch erfolgreich geprüft:

- 9 Vitest-Tests in 2 Testdateien
- Import-JSON-Fehler
- Schema-Version und Kartenlimit
- minimale gültige Importstruktur
- getrennte SRD-5.1-/SRD-5.2.1-Bibliotheken
- Bibliotheksduplikate und Pflichtfelder
- `node --check` für Produktivcode, Tests und Konfiguration

In dieser Erstellungsumgebung nicht ausführbar:

- Playwright-Browser-Smoke-Tests, weil der Browserdownload per DNS blockiert war.

Die 7 bisherigen Browser-Tests wurden vom Nutzer lokal erfolgreich bestätigt. Die 3 neuen Browser-Tests aus 0.25.2 sind syntaktisch geprüft, aber noch lokal auszuführen. Dies wird nicht vorab als bestandener Browserlauf gewertet.

## Patch 0.25.2 – Teststabilisierung und Kernabläufe

- stabiler semantischer Locator für den sichtbaren Kartenschmiede-Button
- Browser-Test für Kartenanlage mit Local-Storage-Reload
- Browser-Test für Encounterstart sowie nächsten und vorherigen Zug
- Browser-Test für Schaden und direktes Undo
- Testanleitung auf 19 automatische Tests aktualisiert
- Browser-Test für Heilung und temporäre HP
- Browser-Test für Condition hinzufügen und entfernen
- Mehrseiten-Test für die Synchronisation des Encounterstarts
- `package-lock.json` bewusst nicht ausgeliefert, damit `npm install` auf dem Zielsystem eine Registry-neutrale Lockdatei erzeugt
