export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return isoString;
  }
}

/**
 * Formatiert den Störungszeitpunkt (z.B. Beginn oder voraussichtliches Ende).
 * Gibt z.B. "heute, 14:30 Uhr" oder "24.09., 14:30 Uhr" zurück.
 */
export function formatDisruptionTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (isToday) {
      return `heute, ${timeStr} Uhr`;
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}., ${timeStr} Uhr`;
  } catch {
    return '';
  }
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${remainingMinutes} min`;
}

export function formatDistance(meters?: number): string {
  if (!meters) return '';
  if (meters < 1000) {
    return `${meters} m`;
  }
  const km = (meters / 1000).toFixed(1).replace('.', ',');
  return `${km} km`;
}

export function getLineColors(line?: string, type?: string): { bg: string; text: string; border?: string } {
  if (!line) {
    return { bg: '#64748b', text: '#ffffff' };
  }
  const upper = line.toUpperCase().trim();

  // U-Bahn Wien
  if (upper === 'U1') return { bg: '#e2001a', text: '#ffffff' };
  if (upper === 'U2') return { bg: '#8b5cf6', text: '#ffffff' };
  if (upper === 'U3') return { bg: '#ea580c', text: '#ffffff' };
  if (upper === 'U4') return { bg: '#16a34a', text: '#ffffff' };
  if (upper === 'U5') return { bg: '#06b6d4', text: '#ffffff' };
  if (upper === 'U6') return { bg: '#92400e', text: '#ffffff' };

  // S-Bahn / Regionalzug / ÖBB
  if (upper.startsWith('S') || upper.startsWith('REX') || upper.startsWith('CJX') || upper.startsWith('R') || upper === 'CAT') {
    if (upper === 'CAT') return { bg: '#84cc16', text: '#1e293b' };
    return { bg: '#0284c7', text: '#ffffff' };
  }

  // Fernverkehr ÖBB (Railjet / ICE / IC / EC)
  if (upper.startsWith('RJ') || upper.startsWith('IC') || upper.startsWith('EC')) {
    return { bg: '#b91c1c', text: '#ffffff' };
  }

  // WESTbahn
  if (upper.startsWith('WB') || upper.includes('WEST')) {
    return { bg: '#2563eb', text: '#ffffff' };
  }

  // Straßenbahn
  if (type === 'TRAM' || upper.match(/^[0-9]{1,2}$/) || ['D', 'O', '1', '2', '5', '6', '9', '18', '25', '26', '31', '38', '43', '44', '49', '52', '60', '62', '71'].includes(upper)) {
    return { bg: '#dc2626', text: '#ffffff' };
  }

  // Autobus
  if (upper.endsWith('A') || upper.endsWith('B') || type === 'BUS') {
    return { bg: '#0d9488', text: '#ffffff' };
  }

  return { bg: '#334155', text: '#ffffff' };
}

export interface ParsedLineInfo {
  lineName: string;
  subNumber?: string;
  category?: string;
}

export function parseLegLineInfo(rawLine?: string, legType?: string): ParsedLineInfo {
  if (!rawLine) {
    return { lineName: legType || 'ÖPNV' };
  }
  const trimmed = rawLine.trim();

  // Pattern 1: "S 1 (Zug-Nr. 19307)" or "REX 2 (Zug-Nr. 23345)" or "CJX 5 (Zug-Nr. 1910)"
  const zugNrMatch = trimmed.match(/^(.*?)\s*\((?:Zug-Nr\.?|Zug)?\s*(\d+)\)$/i);
  if (zugNrMatch) {
    return {
      lineName: zugNrMatch[1].trim(),
      subNumber: zugNrMatch[2],
    };
  }

  // Pattern 2: "RJX19952" or "RJX 60" or "WB 79214" or "ICE 118" or "EC 1216"
  const trainCodeMatch = trimmed.match(/^(RJX|RJ|ICE|IC|EC|CJX|REX|WB|WESTbahn)\s*(\d+)$/i);
  if (trainCodeMatch) {
    return {
      lineName: trainCodeMatch[1].toUpperCase(),
      subNumber: trainCodeMatch[2],
    };
  }

  return { lineName: trimmed };
}
