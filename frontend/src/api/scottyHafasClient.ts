import {
  Journey,
  JourneySearchRequest,
  Leg,
  LegType,
  LocationPoint,
  StopPoint,
  IntermediateStop,
  TransferInfo,
  RealtimeStatus,
} from '../types/routing';

const SCOTTY_BASE = '/api/scotty';

function parseHafasDateTime(dateStr: string, timeStr: string): Date {
  if (!timeStr) {
    const y = parseInt(dateStr.slice(0, 4), 10);
    const m = parseInt(dateStr.slice(4, 6), 10) - 1;
    const d = parseInt(dateStr.slice(6, 8), 10);
    return new Date(Date.UTC(y, m, d, 0, 0, 0));
  }
  let daysAdd = 0;
  let cleanTime = timeStr;
  if (cleanTime.length === 8) {
    daysAdd = parseInt(cleanTime.slice(0, 2), 10);
    cleanTime = cleanTime.slice(2);
  }
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const hh = parseInt(cleanTime.slice(0, 2), 10);
  const mm = parseInt(cleanTime.slice(2, 4), 10);
  const ss = parseInt(cleanTime.slice(4, 6), 10);

  const dt = new Date(Date.UTC(y, m, d, hh, mm, ss));
  if (daysAdd > 0) {
    dt.setUTCDate(dt.getUTCDate() + daysAdd);
  }
  return dt;
}

function getTransitColor(lineName: string, legType: LegType): string {
  const line = (lineName || '').toUpperCase().trim();
  if (line.startsWith('U1')) return '#e2001a';
  if (line.startsWith('U2')) return '#812f86';
  if (line.startsWith('U3')) return '#ee7d00';
  if (line.startsWith('U4')) return '#009640';
  if (line.startsWith('U6')) return '#9d6930';
  if (line.startsWith('S')) return '#0284c7';
  if (['RJ', 'RJX', 'IC', 'ICE', 'EC'].some((p) => line.startsWith(p))) return '#b91c1c';
  if (line.includes('WEST') || line.startsWith('WB')) return '#2563eb';
  if (line.startsWith('REX') || line.startsWith('CJX') || line.startsWith('R')) return '#059669';
  if (legType === 'TRAM') return '#dc2626';
  if (legType === 'BUS') return '#475569';
  return '#3b82f6';
}

export class ScottyHafasClient {
  static async searchStation(query: string): Promise<{ name: string; id: string } | null> {
    if (!query || query.trim().length < 2) return null;
    try {
      const url = `${SCOTTY_BASE}/bin/ajax-getstop.exe/dn?REQ0JourneyStopsS0A=1&REQ0JourneyStopsB=12&S=${encodeURIComponent(
        query.trim()
      )}&js=true`;
      const res = await fetch(url, { headers: { 'Accept': '*/*' } });
      if (!res.ok) return null;
      const text = await res.text();
      const match = text.match(/SLs\.sls\s*=\s*({.*})/);
      if (match) {
        const data = JSON.parse(match[1]);
        const suggestions = data.suggestions || [];
        if (suggestions.length > 0 && suggestions[0].id) {
          return {
            name: suggestions[0].value || query,
            id: suggestions[0].id,
          };
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }

  static async planTrips(request: JourneySearchRequest): Promise<Journey[] | null> {
    try {
      // 1. Resolve Origin & Destination Location
      const resolvePoint = async (pt: LocationPoint) => {
        if (pt.stopId && pt.stopId.includes('A=1@')) {
          return { type: 'S', name: pt.label, lid: pt.stopId };
        }
        const resolved = await this.searchStation(pt.label);
        if (resolved) {
          return { type: 'S', name: resolved.name, lid: resolved.id };
        }
        return {
          type: 'A',
          name: pt.label,
          crd: {
            x: Math.round(pt.lon * 1_000_000),
            y: Math.round(pt.lat * 1_000_000),
          },
        };
      };

      const [depObj, arrObj] = await Promise.all([
        resolvePoint(request.from),
        resolvePoint(request.to),
      ]);

      const reqDate = request.dateTime ? new Date(request.dateTime) : new Date();
      const yyyy = reqDate.getFullYear().toString();
      const mm = String(reqDate.getMonth() + 1).padStart(2, '0');
      const dd = String(reqDate.getDate()).padStart(2, '0');
      const hh = String(reqDate.getHours()).padStart(2, '0');
      const min = String(reqDate.getMinutes()).padStart(2, '0');
      const ss = '00';

      const outDate = `${yyyy}${mm}${dd}`;
      const outTime = `${hh}${min}${ss}`;

      let minChgTime = 3;
      if (request.preferences?.transferSpeed === 'SLOW') minChgTime = 6;
      else if (request.preferences?.transferSpeed === 'FAST') minChgTime = 1;

      const maxChg = request.preferences?.maxTransfers ?? 5;

      const payload = {
        id: 'oebb_plan',
        ver: '1.57',
        lang: 'deu',
        auth: { type: 'AID', aid: 'OWDL4fE4ixNiPBBm' },
        client: { type: 'IPH', id: 'OEBB', v: '6030600', name: 'oebbPROD-ADHOC' },
        svcReqL: [
          {
            meth: 'TripSearch',
            req: {
              depLocL: [depObj],
              arrLocL: [arrObj],
              outDate,
              outTime,
              getPasslist: true,
              maxChg,
              minChgTime,
            },
          },
        ],
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${SCOTTY_BASE}/bin/mgate.exe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();
      const svcRes = data?.svcResL?.[0];
      if (svcRes?.err !== 'OK') return null;

      const resData = svcRes.res || {};
      const locL = resData.common?.locL || [];
      const prodL = resData.common?.prodL || [];
      const outConL = resData.outConL || [];
      if (!outConL.length) return null;

      const journeys: Journey[] = [];

      for (let idx = 0; idx < Math.min(outConL.length, 6); idx++) {
        const con = outConL[idx];
        const conDate = con.date || outDate;
        const durStr = con.dur || '000000';
        const durSec =
          parseInt(durStr.slice(0, 2), 10) * 3600 +
          parseInt(durStr.slice(2, 4), 10) * 60 +
          parseInt(durStr.slice(4, 6), 10);
        const transferCount = con.chg ?? 0;

        const legs: Leg[] = [];
        let walkSec = 0;
        let walkMeters = 0;
        let totalDelay = 0;
        let hasDisruptions = false;

        const secList = con.secL || [];
        for (let sIdx = 0; sIdx < secList.length; sIdx++) {
          const sec = secList[sIdx];
          const dep = sec.dep || {};
          const arr = sec.arr || {};
          const depLoc = locL[dep.locX] || {};
          const arrLoc = locL[arr.locX] || {};

          const depDtSched = parseHafasDateTime(conDate, dep.dTimeS || '');
          const depDtReal = dep.dTimeR ? parseHafasDateTime(conDate, dep.dTimeR) : null;
          const arrDtSched = parseHafasDateTime(conDate, arr.aTimeS || '');
          const arrDtReal = arr.aTimeR ? parseHafasDateTime(conDate, arr.aTimeR) : null;

          const legDelay = depDtReal
            ? Math.max(0, Math.round((depDtReal.getTime() - depDtSched.getTime()) / 60000))
            : 0;
          if (legDelay > totalDelay) totalDelay = legDelay;

          const depLat = (depLoc.crd?.y || 0) / 1_000_000;
          const depLon = (depLoc.crd?.x || 0) / 1_000_000;
          const arrLat = (arrLoc.crd?.y || 0) / 1_000_000;
          const arrLon = (arrLoc.crd?.x || 0) / 1_000_000;

          if (sec.type === 'WALK') {
            const gis = sec.gis || {};
            const durGisStr = gis.durS || '000000';
            const gisSec =
              durGisStr.length === 6
                ? parseInt(durGisStr.slice(0, 2), 10) * 3600 +
                  parseInt(durGisStr.slice(2, 4), 10) * 60 +
                  parseInt(durGisStr.slice(4, 6), 10)
                : Math.max(60, Math.round((arrDtSched.getTime() - depDtSched.getTime()) / 1000));
            const gisDist = gis.dist || 100;
            walkSec += gisSec;
            walkMeters += gisDist;

            legs.push({
              id: `leg-scotty-${idx}-${sIdx}`,
              type: 'WALK',
              fromStop: {
                name: depLoc.name || request.from.label,
                lat: depLat || request.from.lat,
                lon: depLon || request.from.lon,
                scheduledTime: depDtSched.toISOString(),
                estimatedTime: depDtReal ? depDtReal.toISOString() : undefined,
                delayMinutes: legDelay,
              },
              toStop: {
                name: arrLoc.name || request.to.label,
                lat: arrLat || request.to.lat,
                lon: arrLon || request.to.lon,
                scheduledTime: arrDtSched.toISOString(),
                estimatedTime: arrDtReal ? arrDtReal.toISOString() : undefined,
                delayMinutes: 0,
              },
              startTime: depDtSched.toISOString(),
              endTime: arrDtSched.toISOString(),
              durationSeconds: gisSec,
              distanceMeters: gisDist,
              realtimeStatus: 'ON_TIME',
              delayMinutes: 0,
              coordinates: [
                [depLon || request.from.lon, depLat || request.from.lat],
                [arrLon || request.to.lon, arrLat || request.to.lat],
              ],
            });
          } else if (sec.type === 'JNY') {
            const jny = sec.jny || {};
            const prod = prodL[jny.prodX] || {};
            const cat = prod.prodCtx?.catOutS?.trim() || '';
            const clsCode = prod.cls || 0;

            let legType: LegType = 'TRAIN';
            if (cat === 'U' || cat === 'U-Bahn' || clsCode === 256) legType = 'SUBWAY';
            else if (['Tram', 'Str', 'Bim', 'Straßenbahn'].includes(cat) || clsCode === 512) legType = 'TRAM';
            else if (cat === 'Bus' || clsCode === 64) legType = 'BUS';

            const lineName = prod.name || prod.number || 'Zug';
            const color = getTransitColor(lineName, legType);

            // Intermediate stops
            const intermediateStops: IntermediateStop[] = [];
            const stopL = jny.stopL || [];
            for (let stI = 1; stI < stopL.length - 1; stI++) {
              const stopEntry = stopL[stI];
              const sLoc = locL[stopEntry.locX] || {};
              const sTime = stopEntry.aTimeS || stopEntry.dTimeS || '';
              if (sTime) {
                const sDt = parseHafasDateTime(conDate, sTime);
                intermediateStops.push({
                  name: sLoc.name || '',
                  scheduledTime: sDt.toISOString(),
                  delayMinutes: 0,
                });
              }
            }

            let legDisruptionNotice: string | undefined = undefined;
            const legHimMsgs: string[] = [];
            if (Array.isArray(jny.msgL)) {
              for (const m of jny.msgL) {
                if (m.type === 'HIM' && typeof m.himX === 'number') {
                  const himObj = resData.common?.himL?.[m.himX];
                  if (himObj) {
                    const text = himObj.head
                      ? himObj.text
                        ? `${himObj.head}: ${himObj.text}`
                        : himObj.head
                      : himObj.text;
                    if (text) {
                      legHimMsgs.push(text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
                    }
                  }
                }
              }
            }
            if (legHimMsgs.length > 0) {
              legDisruptionNotice = legHimMsgs[0];
            }

            const hasDisr = Boolean(jny.himIdL || legHimMsgs.length > 0);
            if (hasDisr) hasDisruptions = true;

            const legDur = Math.max(60, Math.round((arrDtSched.getTime() - depDtSched.getTime()) / 1000));

            // Transfer Info
            let transferInfo: TransferInfo | undefined = undefined;
            const priorTransit = legs.filter((l) => l.type !== 'WALK').pop();
            if (priorTransit) {
              const prevEnd = new Date(priorTransit.endTime).getTime();
              const totalWindowSec = Math.max(0, Math.round((depDtSched.getTime() - prevEnd) / 1000));
              const bufMin = Math.max(0, Math.round(totalWindowSec / 60));
              const diffLvl = bufMin < 2 ? 'RISKY' : bufMin < 4 ? 'TIGHT' : 'RELAXED';
              const diffLbl =
                diffLvl === 'RISKY'
                  ? 'Knapper Anschluss'
                  : diffLvl === 'TIGHT'
                  ? 'Sportlicher Umstieg'
                  : 'Sicherer Umstieg';

              transferInfo = {
                stationName: depLoc.name || 'Umsteigebahnhof',
                durationSeconds: totalWindowSec,
                walkingMeters: 100,
                difficulty: diffLvl,
                difficultyLabel: diffLbl,
                bufferMinutes: bufMin,
              };
            }

            const realtimeStatus: RealtimeStatus = hasDisr
              ? 'DISRUPTED'
              : legDelay > 0
              ? 'DELAYED'
              : 'ON_TIME';

            legs.push({
              id: `leg-scotty-${idx}-${sIdx}`,
              type: legType,
              line: lineName,
              headsign: jny.dirTxt,
              color,
              fromStop: {
                name: depLoc.name || request.from.label,
                lat: depLat || request.from.lat,
                lon: depLon || request.from.lon,
                platform: dep.dPlatfS,
                scheduledTime: depDtSched.toISOString(),
                estimatedTime: depDtReal ? depDtReal.toISOString() : undefined,
                delayMinutes: legDelay,
              },
              toStop: {
                name: arrLoc.name || request.to.label,
                lat: arrLat || request.to.lat,
                lon: arrLon || request.to.lon,
                platform: arr.aPlatfS,
                scheduledTime: arrDtSched.toISOString(),
                estimatedTime: arrDtReal ? arrDtReal.toISOString() : undefined,
                delayMinutes: 0,
              },
              startTime: depDtSched.toISOString(),
              endTime: arrDtSched.toISOString(),
              durationSeconds: legDur,
              stopsCount: stopL.length,
              intermediateStops,
              realtimeStatus,
              delayMinutes: legDelay,
              disruptionNotice: legDisruptionNotice,
              transferInfo,
              coordinates: [
                [depLon || request.from.lon, depLat || request.from.lat],
                [arrLon || request.to.lon, arrLat || request.to.lat],
              ],
            });
          }
        }

        if (!legs.length) continue;

        const firstLeg = legs[0];
        const lastLeg = legs[legs.length - 1];

        // Cost Calculation
        const etaMinutes = Math.round(durSec / 60);
        const transferPenalty = transferCount * 3.0; // 3 min per transfer
        const missedRisk = transferCount > 0 ? (transferCount > 2 ? 6.5 : 2.0) : 0.0;
        const disruptionRisk = hasDisruptions ? 8.0 : totalDelay > 0 ? 3.0 : 0.5;
        const costScore = Math.round((etaMinutes + transferPenalty + missedRisk + disruptionRisk) * 10) / 10;
        const reliabilityPercent = Math.max(70, Math.min(99, Math.round(100 - (transferCount * 4) - (totalDelay * 1.5))));

        const isRecommended = idx === 0;
        const tagLabel = isRecommended
          ? 'EMPFOHLEN'
          : transferCount === 0
          ? 'DIREKTER'
          : walkMeters < 300
          ? 'WENIGER ZU FUSS'
          : 'ALTERNATIVE';

        const categoryTag = isRecommended
          ? 'EMPFOHLEN'
          : transferCount === 0
          ? 'DIREKTER'
          : walkMeters < 300
          ? 'WENIGER_FUSSWEG'
          : 'ALTERNATIVE';

        const linesSummary = legs
          .filter((l) => l.line)
          .map((l) => l.line)
          .join(', ');

        const headline = isRecommended
          ? `Schnellste Verbindung mit ${transferCount === 0 ? 'Direktfahrt' : `${transferCount} Umstieg${transferCount > 1 ? 'en' : ''}`}`
          : transferCount === 0
          ? 'Direktverbindung ohne Umsteigestress'
          : `${Math.round(durSec / 60)} min Gesamtreisezeit`;

        const details = [
          `Verbindung mit ${linesSummary || 'ÖBB Schienenverkehr'} (${Math.floor(durSec / 3600)}h ${Math.round((durSec % 3600) / 60)} min).`,
          totalDelay > 0 ? `Aktuell ca. +${totalDelay} min Verzögerung im Streckennetz erfasst.` : 'Verbindung laut ÖBB Scotty pünktlich.',
        ];

        const allLegDisruptions = legs
          .filter((l) => l.disruptionNotice)
          .map((l) => `${l.line || 'Zug'}: ${l.disruptionNotice}`);
        if (allLegDisruptions.length > 0) {
          details.push(`Echtzeithinweis: ${allLegDisruptions[0]}`);
        }

        journeys.push({
          id: `journey-scotty-${idx}`,
          recommended: isRecommended,
          categoryTag,
          tagLabel,
          departureTime: firstLeg.startTime,
          arrivalTime: lastLeg.endTime,
          durationSeconds: durSec,
          walkingSeconds: walkSec,
          walkingMeters: walkMeters,
          transferCount,
          realtime: true,
          totalDelayMinutes: totalDelay,
          hasDisruptions,
          costScore,
          costBreakdown: {
            costScore,
            etaSeconds: durSec,
            etaMinutes,
            transferPenalty,
            missedConnectionRisk: missedRisk,
            disruptionRisk,
            alpha: 1.0,
            beta: 1.0,
            gamma: 1.0,
            reliabilityPercent,
            summary: `ETA (${etaMinutes}m) + Umstiege (+${transferPenalty.toFixed(1)}m) + Risiko (+${missedRisk.toFixed(1)}m)`,
          },
          reliabilityPercent,
          explanation: { headline, details },
          legs,
        });
      }

      // Comparison for alternatives
      if (journeys.length > 1) {
        const rec = journeys[0];
        for (let i = 1; i < journeys.length; i++) {
          const alt = journeys[i];
          const timeDiff = Math.round((alt.durationSeconds - rec.durationSeconds) / 60);
          const transDiff = alt.transferCount - rec.transferCount;
          const walkDiff = Math.round((alt.walkingSeconds - rec.walkingSeconds) / 60);

          const reasons: string[] = [];
          if (timeDiff > 0) reasons.push(`${timeDiff} min längere Fahrtzeit`);
          else if (timeDiff < 0) reasons.push(`${Math.abs(timeDiff)} min kürzere Fahrtzeit`);

          if (transDiff > 0) reasons.push(`${transDiff} Umstieg${transDiff > 1 ? 'e' : ''} mehr`);
          else if (transDiff < 0) reasons.push(`${Math.abs(transDiff)} Umstieg${Math.abs(transDiff) > 1 ? 'e' : ''} weniger`);

          alt.comparisonWithRecommended = {
            timeDiffMinutes: timeDiff,
            transferDiff: transDiff,
            walkDiffMinutes: walkDiff,
            summaryText: reasons.join(' • ') || 'Alternative Fahrplanoption',
            reasons,
          };
        }
      }

      return journeys.length > 0 ? journeys : null;
    } catch (err) {
      console.warn('ScottyHafasClient.planTrips failed:', err);
      return null;
    }
  }
}
