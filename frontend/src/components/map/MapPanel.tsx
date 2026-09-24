import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Journey, Leg } from '../../types/routing';
import { getLineColors, formatDistance } from '../../utils/formatters';
import { Maximize2, Minimize2, MapPin } from 'lucide-react';

interface MapPanelProps {
  journey: Journey | null;
  selectedLeg?: Leg | null;
  className?: string;
  isCollapsible?: boolean;
  onClose?: () => void;
}

export const MapPanel: React.FC<MapPanelProps> = ({
  journey,
  selectedLeg,
  className = '',
  isCollapsible = false,
  onClose,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // OpenStreetMap Tile Style (Carto Positron or Standard OSM)
  const mapStyle =
    import.meta.env.VITE_MAP_STYLE_URL ||
    'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [16.3738, 48.2082], // Wien Zentrum
        zoom: 12,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(
        new maplibregl.AttributionControl({ compact: true, customAttribution: '© OpenStreetMap-Mitwirkende' }),
        'bottom-right'
      );

      map.on('load', () => {
        setMapLoaded(true);
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.warn('MapLibre GL initialization fallback:', err);
      setWebGlSupported(false);
    }
  }, [mapStyle]);

  // Update Route Layers and Markers when Journey changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !journey) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Collect all coordinates to fit bounds
    const allCoords: [number, number][] = [];

    journey.legs.forEach((leg, index) => {
      const sourceId = `source-leg-${index}`;
      const layerId = `layer-leg-${index}`;

      // Clean up previous layers
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      const coords: [number, number][] =
        leg.coordinates && leg.coordinates.length > 0
          ? leg.coordinates
          : [
              [leg.fromStop.lon, leg.fromStop.lat],
              [leg.toStop.lon, leg.toStop.lat],
            ];

      coords.forEach((c) => allCoords.push(c));

      const isWalk = leg.type === 'WALK';
      const colors = getLineColors(leg.line, leg.type);

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            line: leg.line || leg.type,
            isWalk,
          },
          geometry: {
            type: 'LineString',
            coordinates: coords,
          },
        },
      });

      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': isWalk ? '#64748b' : colors.bg,
          'line-width': isWalk ? 3.5 : 5.5,
          'line-dasharray': isWalk ? [2, 2] : [1, 0],
          'line-opacity': 0.9,
        },
      });
    });

    // Add Start Marker
    const startLeg = journey.legs[0];
    if (startLeg) {
      const el = document.createElement('div');
      el.className =
        'w-6 h-6 rounded-full bg-slate-900 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold';
      el.innerHTML = 'A';
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([startLeg.fromStop.lon, startLeg.fromStop.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText(`Start: ${startLeg.fromStop.name}`))
        .addTo(map);
      markersRef.current.push(marker);
    }

    // Add Destination Marker
    const endLeg = journey.legs[journey.legs.length - 1];
    if (endLeg) {
      const el = document.createElement('div');
      el.className =
        'w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold';
      el.innerHTML = 'B';
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([endLeg.toStop.lon, endLeg.toStop.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText(`Ziel: ${endLeg.toStop.name}`))
        .addTo(map);
      markersRef.current.push(marker);
    }

    // Add Transfer Markers
    journey.legs.forEach((leg) => {
      if (leg.transferInfo) {
        const el = document.createElement('div');
        el.className =
          'w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-sm flex items-center justify-center text-white text-[9px] font-bold';
        el.innerHTML = '⇄';
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([leg.fromStop.lon, leg.fromStop.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 10 }).setText(
              `Umstieg: ${leg.transferInfo.stationName} (${leg.transferInfo.difficultyLabel})`
            )
          )
          .addTo(map);
        markersRef.current.push(marker);
      }
    });

    // Fit bounds to route
    if (allCoords.length > 0) {
      const bounds = allCoords.reduce(
        (b, coord) => b.extend(coord),
        new maplibregl.LngLatBounds(allCoords[0], allCoords[0])
      );
      map.fitBounds(bounds, { padding: 40, maxZoom: 14.5 });
    }
  }, [journey, mapLoaded]);

  // If WebGL is not available, render clean graphic representation
  if (!webGlSupported) {
    return (
      <div className={`p-4 bg-slate-100 rounded-2xl border border-slate-200 text-center ${className}`}>
        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 mx-auto flex items-center justify-center mb-2">
          <MapPin className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-slate-800 mb-1">Routenverlauf</h4>
        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
          {journey
            ? `${journey.legs.length} Abschnitte &middot; ${journey.transferCount} Umstiege &middot; ${formatDistance(
                journey.walkingMeters
              )} Fußweg`
            : 'Wähle eine Verbindung, um den Verlauf zu sehen.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs ${className}`}>
      <div ref={mapContainer} className="w-full h-full min-h-[300px]" />

      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-600" />
        <span>ÖPNV Netz Wien</span>
        {journey && <span className="text-slate-400 font-normal">&middot; {journey.legs.length} Abschnitte</span>}
      </div>

      {isCollapsible && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-12 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs"
          title="Karte schließen"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
