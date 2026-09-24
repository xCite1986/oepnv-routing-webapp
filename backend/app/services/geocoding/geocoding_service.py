from typing import List
import httpx
from ...schemas.location import LocationPoint
from .vienna_stops import VIENNA_STOPS

class GeocodingService:
    """
    Austauschbarer Geocoding-Service (§3).
    Sucht Haltestellen, Bahnhöfe, POIs und Adressen im Großraum Wien.
    """

    @classmethod
    async def search(cls, query: str, limit: int = 8) -> List[LocationPoint]:
        if not query or not query.strip():
            return [LocationPoint(**stop) for stop in VIENNA_STOPS[:limit]]

        q_clean = query.lower().strip()

        # 1. Lokale Haltestellensuche (Sofortige Treffer)
        local_matches: List[LocationPoint] = []
        for stop in VIENNA_STOPS:
            label = stop["label"].lower()
            muni = stop.get("municipality", "").lower()
            if q_clean in label or q_clean in muni:
                local_matches.append(LocationPoint(**stop))

        if len(local_matches) >= 3:
            return local_matches[:limit]

        # 2. Ergänzende Suche via Photon (OpenStreetMap, kostenlos, keine API-Key Pflicht)
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(
                    "https://photon.komoot.io/api/",
                    params={
                        "q": query,
                        "lat": 48.2082,
                        "lon": 16.3738,
                        "limit": limit
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    photon_results = []
                    for feature in data.get("features", []):
                        props = feature.get("properties", {})
                        coords = feature.get("geometry", {}).get("coordinates", [0, 0])
                        name = props.get("name", "")
                        street = props.get("street", "")
                        city = props.get("city", "Wien")
                        full_label = f"{name or street}, {city}".strip(", ")
                        
                        photon_results.append(
                            LocationPoint(
                                lat=coords[1],
                                lon=coords[0],
                                label=full_label or "Standort in Wien",
                                type="ADDRESS",
                                municipality=city
                            )
                        )
                    combined = local_matches + [r for r in photon_results if r.label not in [m.label for m in local_matches]]
                    return combined[:limit]
        except Exception:
            pass

        return local_matches[:limit]
