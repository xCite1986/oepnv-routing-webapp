import { LocationPoint } from '../types/routing';

export const VIENNA_LOCATIONS: LocationPoint[] = [
  {
    lat: 48.20849,
    lon: 16.37208,
    label: 'Stephansplatz, Wien',
    type: 'STATION',
    municipality: 'Wien 1. Bezirk'
  },
  {
    lat: 48.11030,
    lon: 16.56970,
    label: 'Flughafen Wien (Schwechat)',
    type: 'STATION',
    municipality: 'Schwechat'
  },
  {
    lat: 48.18530,
    lon: 16.37640,
    label: 'Wien Hauptbahnhof',
    type: 'STATION',
    municipality: 'Wien 10. Bezirk'
  },
  {
    lat: 48.19690,
    lon: 16.33780,
    label: 'Wien Westbahnhof',
    type: 'STATION',
    municipality: 'Wien 15. Bezirk'
  },
  {
    lat: 48.20630,
    lon: 16.38550,
    label: 'Wien Mitte / Landstraße',
    type: 'STATION',
    municipality: 'Wien 3. Bezirk'
  },
  {
    lat: 48.21780,
    lon: 16.39170,
    label: 'Wien Praterstern',
    type: 'STATION',
    municipality: 'Wien 2. Bezirk'
  },
  {
    lat: 48.20030,
    lon: 16.36980,
    label: 'Karlsplatz, Wien',
    type: 'STATION',
    municipality: 'Wien 1./4. Bezirk'
  },
  {
    lat: 48.21140,
    lon: 16.37750,
    label: 'Schwedenplatz, Wien',
    type: 'STATION',
    municipality: 'Wien 1. Bezirk'
  },
  {
    lat: 48.17470,
    lon: 16.33310,
    label: 'Wien Meidling',
    type: 'STATION',
    municipality: 'Wien 12. Bezirk'
  },
  {
    lat: 48.23550,
    lon: 16.35850,
    label: 'Spittelau, Wien',
    type: 'STATION',
    municipality: 'Wien 9. Bezirk'
  },
  {
    lat: 48.25640,
    lon: 16.40020,
    label: 'Wien Floridsdorf',
    type: 'STATION',
    municipality: 'Wien 21. Bezirk'
  },
  {
    lat: 48.18560,
    lon: 16.31280,
    label: 'Schloss Schönbrunn',
    type: 'POI',
    municipality: 'Wien 13. Bezirk'
  },
  {
    lat: 48.20790,
    lon: 16.35910,
    label: 'Volkstheater, Wien',
    type: 'STATION',
    municipality: 'Wien 7. Bezirk'
  },
  {
    lat: 48.21280,
    lon: 16.35770,
    label: 'Rathaus, Wien',
    type: 'STATION',
    municipality: 'Wien 1. / 8. Bezirk'
  },
  {
    lat: 48.21950,
    lon: 16.36180,
    label: 'Schottentor (Universität)',
    type: 'STATION',
    municipality: 'Wien 1. / 9. Bezirk'
  },
  {
    lat: 48.24350,
    lon: 16.43320,
    label: 'Kagran, Wien',
    type: 'STATION',
    municipality: 'Wien 22. Bezirk'
  },
  {
    lat: 48.17640,
    lon: 16.41370,
    label: 'Simmering, Wien',
    type: 'STATION',
    municipality: 'Wien 11. Bezirk'
  },
  {
    lat: 48.19230,
    lon: 16.38070,
    label: 'Schloss Belvedere',
    type: 'POI',
    municipality: 'Wien 3. Bezirk'
  }
];

export function searchViennaLocations(query: string): LocationPoint[] {
  if (!query || query.trim().length === 0) {
    return VIENNA_LOCATIONS.slice(0, 6);
  }
  const cleanQuery = query.toLowerCase().trim();
  return VIENNA_LOCATIONS.filter(loc => 
    loc.label.toLowerCase().includes(cleanQuery) ||
    (loc.municipality && loc.municipality.toLowerCase().includes(cleanQuery))
  );
}
