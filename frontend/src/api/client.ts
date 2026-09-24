import { JourneySearchRequest, JourneySearchResponse, LocationPoint, IncidentAlert } from '../types/routing';
import { createMockViennaJourneys, MOCK_INCIDENTS } from './mockData';
import { searchViennaLocations } from './viennaLocations';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class TransitApiClient {
  private static useMockFallback = true;
  private static isBackendAvailable: boolean | null = null;

  static async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      this.isBackendAvailable = res.ok;
      return res.ok;
    } catch {
      this.isBackendAvailable = false;
      return false;
    }
  }

  static async searchLocations(query: string): Promise<LocationPoint[]> {
    if (!query || query.trim().length === 0) {
      return searchViennaLocations('');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE}/locations/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Backend nicht erreichbar -> Fallback
    }

    return searchViennaLocations(query);
  }

  static async searchJourneys(req: JourneySearchRequest): Promise<JourneySearchResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${API_BASE}/journeys/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Backend offline oder Timeout -> Fallback auf Phase 1 Mock-Engine
    }

    // Phase 1 Mock Response generieren
    await new Promise(resolve => setTimeout(resolve, 400)); // Realistische Latenz simulieren
    return createMockViennaJourneys(req.dateTime);
  }

  static async getIncidents(): Promise<IncidentAlert[]> {
    try {
      const res = await fetch(`${API_BASE}/incidents`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return MOCK_INCIDENTS;
  }
}
