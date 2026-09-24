from typing import List
import httpx
from ...schemas.location import LocationPoint
from .vienna_stops import VIENNA_STOPS
from ..realtime.oebb_api import OebbApiClient

class GeocodingService:
    """
    Austauschbarer Geocoding-Service (§3).
    Sucht Haltestellen, Bahnhöfe, POIs und Adressen im Großraum Wien.
    Kombiniert lokalen Wiener Haltestellenkatalog, ÖBB Scotty HAFAS Gateway und Photon/OSM.
    """

    @classmethod
    async def search(cls, query: str, limit: int = 8) -> List[LocationPoint]:
        if not query or not query.strip():
            return [LocationPoint(**stop) for stop in VIENNA_STOPS[:limit]]

        q_clean = query.lower().strip()
        matches: List[LocationPoint] = []
        seen_labels = set()

        # 1. Lokale Haltestellensuche (Sofortige Treffer ohne Latenz)
        for stop in VIENNA_STOPS:
            label = stop["label"].lower()
            muni = stop.get("municipality", "").lower()
            if q_clean in label or q_clean in muni:
                loc = LocationPoint(**stop)
                matches.append(loc)
                seen_labels.add(loc.label.lower())

        # 2. ÖBB Scotty / HAFAS Haltestellen- und Bahnhofssuche (Österreich-weit, inkl. Wien Traisengasse etc.)
        if len(query.strip()) >= 2:
            try:
                oebb_results = await OebbApiClient.search_stations(query)
                for s in oebb_results:
                    label = s.get("name", "")
                    if label and label.lower() not in seen_labels:
                        loc = LocationPoint(
                            lat=s["lat"],
                            lon=s["lon"],
                            label=label,
                            type="STATION",
                            stopId=s.get("evaId"),
                            municipality="Wien" if "wien" in label.lower() else "Österreich"
                        )
                        matches.append(loc)
                        seen_labels.add(label.lower())
            except Exception:
                pass

        if len(matches) >= limit:
            return matches[:limit]

        # 3. Ergänzende Suche via Photon (OpenStreetMap für Adressen & POIs)
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
                    for feature in data.get("features", []):
                        props = feature.get("properties", {})
                        coords = feature.get("geometry", {}).get("coordinates", [0, 0])
                        name = props.get("name", "")
                        street = props.get("street", "")
                        city = props.get("city", "Wien")
                        full_label = f"{name or street}, {city}".strip(", ")
                        if full_label and full_label.lower() not in seen_labels:
                            loc = LocationPoint(
                                lat=coords[1],
                                lon=coords[0],
                                label=full_label,
                                type="ADDRESS",
                                municipality=city
                            )
                            matches.append(loc)
                            seen_labels.add(full_label.lower())
        except Exception:
            pass

        return matches[:limit]
