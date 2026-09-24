# WienMobil ÖPNV-Routing Webapp

Moderne, einfach bedienbare Webapp für ÖPNV-Routing in Wien mit Live-Echtzeit, dynamischer Verspätungsberechnung und regelbasierter Routen-Erklärung.

Entwickelt gemäß der Vorgabe in `oepnv-routing-webapp-entwicklungsprompt.md`.

---

## Highlights & Kernfunktionen

1. **Minimale realistische Ankunftszeit als Primärziel (§6, §18)**:
   - Die Anwendung priorisiert die frühestmögliche Ankunft am Ziel unter aktuellen Echtzeitbedingungen.
   - Mehr Umstiege sind ausdrücklich erlaubt, wenn dadurch Verspätungen oder Ausfälle umfahren werden und der Nutzer früher ankommt.
2. **Regelbasierte Erklärungen („Warum diese Verbindung?“, §7, §19)**:
   - Klare Begründung der Route aus strukturierten Fahrplan- und Echtzeitdaten (z. B. *„Trotz eines zusätzlichen Umstiegs bist du aktuell 8 Minuten schneller am Ziel. Die direkte Verbindung ist derzeit um 11 Minuten verspätet.“*).
   - Transparenter Vergleich mit Alternativen (*„8 min langsamer • Weichenstörung Rennweg“*).
3. **Vertikale Zeitlinie & Echtzeitstatus (§4, §9)**:
   - Zeitlinie mit Abschnitten (WALK, U-Bahn, S-Bahn, Tram, Bus, Regionalzug).
   - Zwischenhalte ein- und ausklappbar mit planmäßigen und prognostizierten Zeiten.
   - Genaue Umstiegsangaben (Station, Gehzeit, Meter, Umstiegsqualität: *„Entspannter Umstieg“* vs. *„Knapp, aber aktuell erreichbar“*).
4. **Optionale Vektorkarte (§12)**:
   - Integrierte MapLibre GL Karte mit OpenStreetMap / Carto Positron Tiles.
   - Streckenführung, Start-/Ziel-Marker und Umsteigepunkte.
   - Auf Desktop übersichtlich neben der Verbindungsauswahl, mobil per Button umschaltbar.
5. **Autonome lokale Lauffähigkeit**:
   - Vollständig innerhalb des Projektes lokal testbar – sowohl mit Live-FastAPI-Backend als auch über integrierte Offline- und Demo-Datensätze. Keine externen API-Schlüssel zwingend erforderlich.

---

## Projektarchitektur

```text
oepnv-routing-webapp/
├── frontend/                     # React + TypeScript + Vite + Tailwind CSS + MapLibre GL
│   ├── src/
│   │   ├── api/                  # API-Client mit automatischem Backend-Fallback
│   │   ├── components/           # UI-Komponenten (Zeitlinie, Badges, Suchmaske, Karte)
│   │   ├── types/                # Zentral typisierte Datenmodelle (§13 & §14)
│   │   └── utils/                # Formatierer & Linien-Design
│   ├── tests/                    # Vitest Unit- und Komponententests
│   └── netlify.toml              # Konfiguration für Netlify SPA-Deployment
├── backend/                      # Python FastAPI REST API
│   ├── app/
│   │   ├── api/v1/               # Endpoints (/journeys/search, /locations/search, /incidents)
│   │   ├── core/                 # App-Konfiguration & CORS-Settings
│   │   ├── schemas/              # Pydantic v2 Datenmodelle
│   │   ├── services/
│   │   │   ├── ranking/          # RankingEngine (§18)
│   │   │   ├── explanations/     # Regelbasierte ExplanationEngine (§19)
│   │   │   ├── routing/          # RoutingService
│   │   │   ├── geocoding/        # Haltestellen- und Adresssuche
│   │   │   └── realtime/         # Echtzeit-Adapter für Wiener Linien / ÖBB
│   │   └── db/init_db.sql        # PostgreSQL + PostGIS DDL-Skript (§20)
│   ├── tests/                    # Pytest Suite für API, Ranking & Erklärungen
│   └── Dockerfile                # Container-Image für das Backend
├── docker-compose.yml            # Docker Stack (backend, otp, postgres/postgis, redis, realtime-adapter)
├── run_tests.bat                 # Ein-Klick-Ausführung aller Tests (Backend & Frontend)
├── start-local.bat               # Ein-Klick-Start für Frontend & Backend
├── start-backend.bat             # Startet FastAPI Backend (Port 8000)
└── start-frontend.bat            # Startet Vite Frontend (Port 5173)
```

---

## Schnellstart: Lokal ausführen

Das Projekt ist so eingerichtet, dass es direkt auf dem lokalen Rechner ohne externe Docker-Dienste gestartet werden kann.

### Option A: Ein-Klick-Start (Windows)
Doppelklicke auf:
```bash
start-local.bat
```
Dies öffnet automatisch:
- Backend auf: [http://localhost:8000](http://localhost:8000) (Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs))
- Frontend auf: [http://localhost:5173](http://localhost:5173)

---

### Option B: Manuell starten

#### 1. Backend starten:
```bash
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --port 8000 --reload
```

#### 2. Frontend starten:
```bash
cd frontend
npm run dev
```

---

## Lokale Tests ausführen

Zur automatischen Überprüfung aller Funktionalitäten existiert das zentrale Testskript:
```bash
run_tests.bat
```
Dieses führt nacheinander aus:
1. **Backend Pytest** (`backend/tests/`):
   - `test_api.py`: Endpunkte für Health, Location-Autocomplete, Incidents und Journey-Suche.
   - `test_ranking.py`: Verifikation, dass Routen mit früherer Ankunft trotz Umstiegen Platz 1 belegen.
   - `test_explanations.py`: Prüfung der regelbasierten Erklärungsgenerierung.
2. **Frontend Vitest** (`frontend/src/test/`):
   - Suchmaske und Standardauswahl (Stephansplatz -> Flughafen Wien).
   - EMPFOHLEN-Karten, Zeitlinien-Rendering, Erklärungsbox und Alternativenvergleich.
3. **Frontend Production Build**:
   - TypeScript Strict Type-Check (`tsc`) und Bundle-Erstellung (`vite build`).

---

## API-Endpunkte (Backend)

| Methode | Pfad | Beschreibung |
| :--- | :--- | :--- |
| `POST` | `/api/v1/journeys/search` | Berechnet Verbindungen nach minimaler Ankunftszeit inkl. Erklärungen |
| `GET` | `/api/v1/locations/search?q=...` | Autocomplete für Wiener Haltestellen, Bahnhöfe & Adressen |
| `GET` | `/api/v1/incidents` | Aktuelle Störungsmeldungen im ÖPNV-Netz Wien |
| `GET` | `/api/v1/health` | Health-Check & Service-Status |
| `GET` | `/docs` | Interaktive Swagger OpenAPI Dokumentation |

---

## Netlify Deployment

Das Frontend ist vorkonfiguriert für das direkte Deployment auf Netlify:
- Datei: `netlify.toml`
- Build-Kommando: `npm run build`
- Publish-Verzeichnis: `dist`
- Umgebungsvariablen in Netlify:
  - `VITE_API_BASE_URL`: URL zum gehosteten FastAPI Backend (optional; falls leer, greift der integrierte Wien Demo-Modus)
  - `VITE_MAP_STYLE_URL`: Kartenstil (Standard: Carto Positron / OSM)

---

## Docker Compose Setup

Für den vollständigen Betrieb im Container-Stack mit PostgreSQL/PostGIS, Redis, OpenTripPlanner und Realtime-Adapter:
```bash
docker compose up -d
```
Startet:
- `backend`: FastAPI API auf Port `8000`
- `otp`: OpenTripPlanner 2.5 auf Port `8080`
- `postgres`: PostGIS Datenbank auf Port `5432` inkl. Schemas (`transport`, `realtime`, `incident`, `routing`, `analytics`)
- `redis`: Redis Cache auf Port `6379`
- `realtime-adapter`: Live-Daten Polling und Normalisierung
