import { Journey } from '../types/routing';
import { getLineColors, formatTime } from './formatters';

/**
 * Exportiert die übergebene Route als hochauflösende PNG-Grafik.
 * Zeichnet den Zeit-Weg-Verlauf mit allen Linien, Haltestellen, Umstiegen und Zeiten.
 */
export function exportJourneyAsGraphic(
  journey: Journey,
  routeTitle = 'WienMobil ÖPNV-Route'
): void {
  if (typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  const width = 1000;
  const legs = journey.legs;

  // Dynamische Höhe basierend auf Anzahl der Abschnitte
  const baseHeight = 360;
  const legHeight = 90;
  const height = Math.max(720, baseHeight + legs.length * legHeight);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Hintergrund
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // 2. Kopfzeile mit WienMobil-Rot
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#e2001a');
  gradient.addColorStop(1, '#b91c1c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 110);

  // Brand Header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('WienMobil Routing', 40, 48);

  ctx.font = 'normal 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(`${routeTitle} • Zeit-Weg-Verlaufsdiagramm`, 40, 78);

  // Tag Badge (z.B. EMPFOHLEN / DIREKTER)
  if (journey.tagLabel) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(width - 200, 36, 160, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#e2001a';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(journey.tagLabel, width - 120, 59);
    ctx.textAlign = 'left';
  }

  // 3. Metriken-Karte (Abfahrt, Ankunft, Dauer, Umstiege, Zuverlässigkeit)
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(40, 130, width - 80, 85, 16);
  ctx.fill();
  ctx.stroke();

  const metrics = [
    { label: 'Abfahrt', value: `${formatTime(journey.departureTime)} Uhr` },
    { label: 'Ankunft', value: `${formatTime(journey.arrivalTime)} Uhr` },
    { label: 'Gesamtfahrzeit', value: `${Math.round(journey.durationSeconds / 60)} Min.` },
    { label: 'Umstiege', value: `${journey.transferCount} ${journey.transferCount === 1 ? 'Umstieg' : 'Umstiege'}` },
    { label: 'Zuverlässigkeit', value: `${journey.reliabilityPercent || 95}%` },
  ];

  const colWidth = (width - 120) / metrics.length;
  metrics.forEach((m, i) => {
    const x = 60 + i * colWidth;
    ctx.fillStyle = '#64748b';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(m.label, x, 160);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(m.value, x, 190);
  });

  // 4. Vertikaler Zeit-Weg-Verlauf (Balken)
  let currentY = 245;
  const startX = 60;
  const contentWidth = width - 120;

  // Startpunkt
  const firstLeg = legs[0];
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(startX + 20, currentY, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(firstLeg.fromStop.name, startX + 45, currentY + 5);
  ctx.fillStyle = '#64748b';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${formatTime(firstLeg.startTime)} Uhr (Start)`, startX + 45, currentY + 23);

  currentY += 45;

  // Abschnitte
  legs.forEach((leg, index) => {
    const isWalk = leg.type === 'WALK';
    const durationMin = Math.round(leg.durationSeconds / 60);
    const boxHeight = Math.max(64, durationMin * 4.2);

    // Vertikale Verbindungslinie
    ctx.strokeStyle = isWalk ? '#94a3b8' : '#0284c7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX + 20, currentY - 12);
    ctx.lineTo(startX + 20, currentY + boxHeight + 12);
    ctx.stroke();

    // Abschnitts-Box
    ctx.beginPath();
    ctx.roundRect(startX + 45, currentY, contentWidth - 45, boxHeight, 12);

    if (isWalk) {
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Fußweg: ${durationMin} Min. (${leg.distanceMeters || 300} m)`, startX + 65, currentY + 27);
      ctx.font = 'normal 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Von ${leg.fromStop.name} nach ${leg.toStop.name}`, startX + 65, currentY + 47);
    } else {
      const colors = getLineColors(leg.line, leg.type);
      ctx.fillStyle = colors.bg;
      ctx.fill();

      // Linien-Badge & Titel
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${leg.line || leg.type} (${durationMin} Min.)`, startX + 65, currentY + 27);

      ctx.font = 'normal 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = colors.text;
      const headsign = leg.headsign ? `• Richtung ${leg.headsign}` : '';
      ctx.fillText(`${leg.fromStop.name} → ${leg.toStop.name} ${headsign}`, startX + 65, currentY + 47);

      if (leg.delayMinutes && leg.delayMinutes > 0) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`+${leg.delayMinutes} Min. Verspätung`, startX + contentWidth - 190, currentY + 27);
      }
    }

    currentY += boxHeight + 16;

    // Umstieg
    if (leg.transferInfo && index < legs.length - 1) {
      const tInfo = leg.transferInfo;
      const transferMin = Math.round(tInfo.durationSeconds / 60);

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(startX + 45, currentY, contentWidth - 45, 34, 8);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`⇄ Umstieg am ${tInfo.stationName}: ${transferMin} Min. Wartezeit (${tInfo.difficultyLabel})`, startX + 60, currentY + 21);

      currentY += 44;
    }
  });

  // Zielpunkt
  const lastLeg = legs[legs.length - 1];
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.arc(startX + 20, currentY, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(lastLeg.toStop.name, startX + 45, currentY + 5);
  ctx.fillStyle = '#64748b';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${formatTime(lastLeg.endTime)} Uhr (Ziel)`, startX + 45, currentY + 23);

  // 5. Fußzeile mit Copyright & Timestamp
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WienMobil ÖPNV Routing • Wiener Linien & ÖBB Scotty Live • Stand: ' + new Date().toLocaleString('de-AT'), width / 2, height - 16);
  ctx.textAlign = 'left';

  // 6. Download anstoßen
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `wienmobil-route-${journey.id || 'export'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Export der Grafik fehlgeschlagen:', err);
  }
}
