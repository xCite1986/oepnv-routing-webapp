import { JourneySearchRequest, JourneySearchResponse, LocationPoint, IncidentAlert } from '../types/routing';
import { createMockViennaJourneys, MOCK_INCIDENTS } from './mockData';
import { searchViennaLocations } from './viennaLocations';
import { ScottyHafasClient } from './scottyHafasClient';
import { RealtimeIncidentsClient } from './realtimeIncidentsClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class TransitApiClient {
  private static useMockFallback = true;
  private static isBackendAvailable: boolean | null = null;

  static async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const contentType = res.headers.get('content-type') || '';
      const isHealthy = res.ok && contentType.includes('application/json');
      this.isBackendAvailable = isHealthy;
      return isHealthy;
    } catch {
      this.isBackendAvailable = false;
      return false;
    }
  }

  static async searchLocations(query: string): Promise<LocationPoint[]> {
    if (!query || query.trim().length === 0) {
      return searchViennaLocations('');
    }

    // 1. Try Python FastAPI Backend if running (local or cloud)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE}/locations/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Backend offline -> Fallback zu Proxy & lokalen Haltestellen
    }

    // 2. Lokale Haltestellen
    const localMatches = searchViennaLocations(query);
    const seen = new Set(localMatches.map(m => m.label.toLowerCase()));
    const remoteMatches: LocationPoint[] = [];

    // 3. Scotty & Photon Proxy (Netlify & Vite Reverse Proxy)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const scottyPromise = fetch(
        `/api/scotty/bin/ajax-getstop.exe/dn?REQ0JourneyStopsS0A=1&REQ0JourneyStopsB=12&S=${encodeURIComponent(query)}&js=true`,
        { signal: controller.signal }
      ).then(async (r) => {
        if (!r.ok) return [];
        const text = await r.text();
        const match = text.match(/SLs\.sls\s*=\s*({.*})/);
        if (match) {
          const parsed = JSON.parse(match[1]);
          return (parsed.suggestions || []).slice(0, 6).map((s: any) => ({
            lat: s.xcoord ? parseFloat(s.xcoord) / 1000000 : 48.2082,
            lon: s.ycoord ? parseFloat(s.ycoord) / 1000000 : 16.3738,
            label: s.value,
            type: 'STATION',
            stopId: s.extId,
            municipality: s.value.toLowerCase().includes('wien') ? 'Wien' : 'Österreich',
          }));
        }
        return [];
      }).catch(() => []);

      const photonPromise = fetch(
        `/api/photon/api/?q=${encodeURIComponent(query)}&lat=48.2082&lon=16.3738&limit=6`,
        { signal: controller.signal }
      ).then(async (r) => {
        if (!r.ok) return [];
        const data = await r.json();
        return (data.features || []).map((f: any) => {
          const props = f.properties || {};
          const coords = f.geometry?.coordinates || [16.3738, 48.2082];
          const name = props.name || props.street || '';
          const city = props.city || 'Wien';
          return {
            lat: coords[1],
            lon: coords[0],
            label: `${name}${props.housenumber ? ' ' + props.housenumber : ''}, ${city}`.trim(),
            type: 'ADDRESS',
            municipality: city,
          };
        });
      }).catch(() => []);

      const [scottyResults, photonResults] = await Promise.all([scottyPromise, photonPromise]);
      clearTimeout(timeoutId);

      for (const item of [...scottyResults, ...photonResults]) {
        if (item.label && !seen.has(item.label.toLowerCase())) {
          seen.add(item.label.toLowerCase());
          remoteMatches.push(item);
        }
      }
    } catch {
      // Ignoriere Netzwerkfehler im Fallback
    }

    return [...localMatches, ...remoteMatches].slice(0, 10);
  }

  static async searchJourneys(req: JourneySearchRequest): Promise<JourneySearchResponse> {
    // 1. Python FastAPI Backend (lokal oder Cloud-Container)
    try {
      const controller = new AbortController();
      // 30s Timeout, damit auch österreichweite Live-Anfragen genügend Zeit haben
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_BASE}/journeys/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && Array.isArray(data.journeys) && data.journeys.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Backend Verbindungssuche offline oder Timeout, frage ÖBB Scotty Gateway direkt an:', err);
    }

    // 2. Direktabfrage an das ÖBB Scotty HAFAS Gateway (z.B. auf Netlify via Reverse Proxy)
    try {
      const scottyJourneys = await ScottyHafasClient.planTrips(req);
      if (scottyJourneys && scottyJourneys.length > 0) {
        return {
          generatedAt: new Date().toISOString(),
          recommendedJourneyId: scottyJourneys[0].id,
          journeys: scottyJourneys,
          realtimeActive: true,
          disruptionSummary: undefined,
        };
      }
    } catch (scottyErr) {
      console.warn('ÖBB Scotty Direktabfrage fehlgeschlagen, verwende Fallback:', scottyErr);
    }

    // 3. Fallback: Generiere Route passend zum gewünschten Start und Ziel
    await new Promise(resolve => setTimeout(resolve, 300));
    return createMockViennaJourneys(req.dateTime, req.from, req.to);
  }

  static async getIncidents(): Promise<IncidentAlert[]> {
    // 1. Python FastAPI Backend (falls lokal aktiv)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(`${API_BASE}/incidents`, { signal: controller.signal });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Backend offline oder auf Netlify
    } finally {
      clearTimeout(timeoutId);
    }

    // 2. Direkte Live-Abfrage an Wiener Linien (OGD Realtime) & ÖBB Scotty (HAFAS HimSearch)
    try {
      const liveAlerts = await RealtimeIncidentsClient.fetchAllLiveIncidents();
      if (liveAlerts && liveAlerts.length > 0) {
        return liveAlerts;
      }
    } catch (liveErr) {
      console.warn('Live-Abfrage der Störungen fehlgeschlagen, verwende Fallback:', liveErr);
    }

    // 3. Fallback
    return MOCK_INCIDENTS;
  }
}
