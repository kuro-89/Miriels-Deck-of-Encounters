# Miriel’s Deck of Encounters
## Backend-Konzept und Umsetzungs-Roadmap
**Planungsstand: Juli 2026**


## 1. Zielbild und Terminologie
- **Spielstand:** gespeichertes Hauptobjekt mit Karten, Deck, Hand, Einstellungen, Chronik und Papierkorb.
- **Spieltisch:** sichtbare Bedien- und Anzeigeoberfläche.
- **Deck:** aktive Kartensammlung.
- **Hand:** aktuell ausgelegte Karten und damit die aktive Encounter-Zusammenstellung.
- **Encounter:** konkrete laufende Szene oder Kampf; in Version 1 kein dauerhaftes eigenständiges Datenobjekt.
- **Papierkorb:** gelöschte Karten, 90 Tage wiederherstellbar.

Import/Export, Demo, Handbuch und Metadaten werden auf die Terminologie **Spielstand** umgestellt.

## 2. Kern-Datenmodell
Ein Benutzer kann mehrere getrennte Spielstände verwalten. Zentrale Objekte:
- `game_states`
- `cards`
- `participants`
- `guest_sessions`
- `invitations`
- `event_log`
- `recovery_tokens`

## 3. Kartenmodell
- `CharacterCard` mit `role: player | npc | monster`
- `ItemCard` für interaktive Consumables
- `CustomCard` für Sonderfälle
- Karten gehören zum Spielstand; Player können Controller sein.

## 4. Kartenorte
- Deck
- Hand
- ausgeschieden
- Papierkorb

## 5. Rollen
- DM
- Player
- Viewer

## 6. Zugang
- Kein Pflichtkonto, kein Mailversand in Version 1.
- DM: sichere Sitzung plus rotierbarer Wiederherstellungscode.
- Player/Viewer: widerrufbare persönliche oder gruppenbasierte Links, danach eigene Serversitzung.
- DM-Sitzung: 30 Tage, bei Aktivität verlängerbar.
- Gastzugang: Löschung nach 90 Tagen Inaktivität.

## 7. Aktionen und Chronik
Erlaubte Aktionen:
- Schaden
- Heilung
- temporäre Trefferpunkte
- Zustände
- Effektmarker
- Itemnutzung

Playeraktionen werden sofort ausgeführt, sichtbar protokolliert und können 30 Sekunden lang vom Player selbst rückgängig gemacht werden. Der DM kann alle Aktionen rückgängig machen.

## 8. Encounter-Steuerung
- Hand vorbereiten
- Encounter manuell starten
- Startsnapshot und Chronik
- optional Initiative: keine, freie Reihenfolge oder feste Initiative
- Endsnapshot beim Beenden

## 9. Chronik
- maximal 5.000 Ereignisse oder 30 Tage
- Export als lesbare Datei und JSON
- Start- und Endsnapshot

## 10. Inventar und Itemkarten
- Inventar: einfache Liste, optionale Kategorien und optionale Verbrauchsaktion
- Itemkarten: Tränke, Schriftrollen und andere Consumables
- Menge als Zähler, aufteilbar
- Menge 0 = aufgebraucht, nicht automatisch gelöscht

## 11. API
Hybrid:
- Ressourcen-Endpunkte für Verwaltung
- Aktions-Endpunkte für Spielvorgänge

## 12. Datenbank
PostgreSQL mit relationalem Kern und validierten JSONB-Feldern.

## 13. Synchronisation
- atomare serverseitige Aktionen
- Versionsnummer pro Karte
- WebSockets für Live-Updates
- HTTP für Laden, Speichern und Verwaltung

## 14. Bilder
- Dateisystem des VPS
- PNG/JPEG/WebP
- maximal 5 MB
- längste Kante 2048 px
- serverseitige Neucodierung zu WebP
- Metadaten entfernen
- Original verwerfen

## 15. Sicherheit
- HTTPS
- sichere Cookies
- CSP
- CSRF-Schutz
- Security Headers
- Rechteprüfung
- Uploadvalidierung
- Audit-Log
- Rate Limits
- Updates
- Backups

## 16. Backups
- täglich auf VPS
- 14 Tage lokal
- monatlich verschlüsselt auf eigener Festplatte
- Restore-Test etwa halbjährlich

## 17. Betrieb
- Docker Compose
- Caddy
- Node.js
- PostgreSQL
- eine Domain:
  - `/`
  - `/api`
  - `/socket`
  - `/uploads`

## 18. Deployment
Versioniertes manuelles Release-Deployment per SCP/SFTP mit:
- Prüfsumme
- Backup
- Migrationen
- Healthcheck
- Rollback
- `current`-Symlink

## 19. Kosten
Zusätzlich zu VPS und Domain:
- Docker, PostgreSQL, Node.js, Caddy, Let’s Encrypt, WebSockets, Sharp und Sicherheitsbibliotheken: **keine Lizenzkosten**
- Maildienst: zunächst nicht nötig
- zweiter Backup-Server: nicht nötig
- eigene verschlüsselte Festplatte: keine laufenden Zusatzkosten

## 20. Roadmap
1. Terminologie und Exportformat
2. Gemeinsames TypeScript-/JSON-Schema
3. Backend-Grundgerüst
4. Datenbank und Migrationen
5. DM-Gastzugang
6. Karten und Spielstände
7. Einladungen und Gäste
8. Spielaktionen und Chronik
9. WebSocket-Echtzeit
10. Uploads
11. Encounter-Steuerung
12. Sicherheit und Tests
13. Rechtstexte und Deployment

## 21. Zurückgestellt
- Konten und E-Mail
- Co-DM
- Deckschmiede
- S3
- Monetarisierung
- vollständige Regelautomatisierung
