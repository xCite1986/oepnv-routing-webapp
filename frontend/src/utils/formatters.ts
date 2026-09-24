export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return isoString;
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

  // S-Bahn / ÖBB
  if (upper.startsWith('S') || upper.startsWith('REX') || upper.startsWith('R') || upper === 'CAT') {
    if (upper === 'CAT') return { bg: '#84cc16', text: '#1e293b' };
    return { bg: '#0284c7', text: '#ffffff' };
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
