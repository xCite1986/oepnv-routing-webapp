import { IncidentAlert } from '../types/routing';

const WL_TRAFFIC_URL = '/api/wl/trafficInfoList';
const SCOTTY_MGATE_URL = '/api/scotty/bin/mgate.exe';

function buildUrl(path: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    try {
      return new URL(path, window.location.origin).toString();
    } catch {
      return path;
    }
  }
  return path;
}

export class RealtimeIncidentsClient {
  /**
   * Lädt Live-Störungen von den Wiener Linien (OGD Realtime).
   */
  static async fetchWienerLinienIncidents(): Promise<IncidentAlert[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const url = buildUrl(WL_TRAFFIC_URL);
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) return [];
      const json = await res.json();
      const rawInfos = json?.data?.trafficInfos || [];
      const alerts: IncidentAlert[] = [];

      for (const item of rawInfos) {
        // Aufzugsstörungen überspringen (Kategorie 1) für fokussierte ÖPNV-Fahrtstörungen
        if (item.refTrafficInfoCategoryId === 1) continue;

        const title = (item.title || item.attributes?.station || 'Betriebseinschränkung')
          .replace(/\n+/g, ' – ')
          .trim();
        const descRaw = item.attributes?.reason || item.description || '';
        const desc = descRaw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const lines = (item.relatedLines || []).map(String);

        let severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
        const upper = (title + ' ' + desc).toUpperCase();
        if (upper.includes('SPERRE') || upper.includes('KEIN BETRIEB') || upper.includes('UNFALL')) {
          severity = 'WARNING';
        }

        alerts.push({
          id: `wl-${item.name || Math.random().toString(36).slice(2)}`,
          title,
          description: desc || 'Aktuelle betriebliche Anpassung.',
          lines: lines.length > 0 ? lines : ['Wien'],
          severity,
          validFrom: item.time?.start || new Date().toISOString(),
          validTo: item.time?.end,
        });
      }

      return alerts;
    } catch {
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Lädt bundesweite ÖBB Live-Störungen & Verkehrsmeldungen via HAFAS HimSearch.
   */
  static async fetchOebbIncidents(): Promise<IncidentAlert[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const payload = {
        id: 'oebb_him',
        ver: '1.57',
        lang: 'deu',
        auth: { type: 'AID', aid: 'OWDL4fE4ixNiPBBm' },
        client: { type: 'IPH', id: 'OEBB', v: '6030600', name: 'oebbPROD-ADHOC' },
        svcReqL: [
          {
            meth: 'HimSearch',
            req: {
              maxNum: 40,
            },
          },
        ],
      };

      const url = buildUrl(SCOTTY_MGATE_URL);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) return [];
      const json = await res.json();
      const msgs = json?.svcResL?.[0]?.res?.msgL || [];
      const alerts: IncidentAlert[] = [];

      for (const m of msgs) {
        const title = (m.head || 'ÖBB Verkehrsmeldung').trim();
        const descRaw = m.text || '';
        const desc = descRaw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        // Linien und Zugnummern aus dem Text extrahieren (z.B. IC 648, RJX 123, S3, REX 1)
        const lineMatches = desc.match(/\b(RJX\s*\d+|RJ\s*\d+|ICE\s*\d+|IC\s*\d+|EC\s*\d+|REX\s*\d+|CJX\s*\d+|S\s*\d+|WB\s*\d+|Bus\s*\d+)\b/gi) || [];
        const lines: string[] = Array.from(new Set(lineMatches.map((l: string) => l.replace(/\s+/, ' ').toUpperCase())));

        let validFrom = new Date().toISOString();
        if (m.sDate && m.sDate.length === 8) {
          const y = m.sDate.slice(0, 4);
          const mon = m.sDate.slice(4, 6);
          const day = m.sDate.slice(6, 8);
          const hh = m.sTime ? m.sTime.slice(0, 2) : '00';
          const mm = m.sTime ? m.sTime.slice(2, 4) : '00';
          validFrom = `${y}-${mon}-${day}T${hh}:${mm}:00+02:00`;
        }

        let validTo: string | undefined = undefined;
        if (m.eDate && m.eDate.length === 8) {
          const y = m.eDate.slice(0, 4);
          const mon = m.eDate.slice(4, 6);
          const day = m.eDate.slice(6, 8);
          const hh = m.eTime ? m.eTime.slice(0, 2) : '23';
          const mm = m.eTime ? m.eTime.slice(2, 4) : '59';
          validTo = `${y}-${mon}-${day}T${hh}:${mm}:00+02:00`;
        }

        let severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
        const upper = (title + ' ' + desc).toUpperCase();
        if (upper.includes('SPERRE') || upper.includes('ERSATZVERKEHR') || upper.includes('UNWETTER')) {
          severity = 'WARNING';
        }

        alerts.push({
          id: `oebb-${m.hid || Math.random().toString(36).slice(2)}`,
          title,
          description: desc,
          lines: lines.length > 0 ? lines : ['ÖBB'],
          severity,
          validFrom,
          validTo,
        });
      }

      return alerts;
    } catch {
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Kombiniert Live-Meldungen von Wiener Linien und ÖBB Scotty.
   */
  static async fetchAllLiveIncidents(): Promise<IncidentAlert[]> {
    const [wlIncidents, oebbIncidents] = await Promise.all([
      this.fetchWienerLinienIncidents(),
      this.fetchOebbIncidents(),
    ]);

    const combined = [...wlIncidents, ...oebbIncidents];
    return combined;
  }
}
