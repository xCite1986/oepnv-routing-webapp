import time
from typing import Dict, List, Optional, Any
import httpx
from ...schemas.incident import IncidentAlert

# Bekannte RBL-Nummern wichtiger Wiener U-Bahn & Tram-Stationen
KNOWN_VIENNA_RBLS: Dict[str, Dict[str, Any]] = {
    "Stephansplatz (U1)": {"rbl": 4114, "line": "U1", "station": "Stephansplatz"},
    "Stephansplatz (U3)": {"rbl": 4914, "line": "U3", "station": "Stephansplatz"},
    "Praterstern (U1)": {"rbl": 4117, "line": "U1", "station": "Praterstern"},
    "Praterstern (U2)": {"rbl": 4217, "line": "U2", "station": "Praterstern"},
    "Karlsplatz (U1)": {"rbl": 4113, "line": "U1", "station": "Karlsplatz"},
    "Karlsplatz (U4)": {"rbl": 4413, "line": "U4", "station": "Karlsplatz"},
    "Schwedenplatz (U1)": {"rbl": 4115, "line": "U1", "station": "Schwedenplatz"},
    "Schwedenplatz (U4)": {"rbl": 4415, "line": "U4", "station": "Schwedenplatz"},
    "Wien Mitte (U3)": {"rbl": 4916, "line": "U3", "station": "Wien Mitte"},
    "Wien Mitte (U4)": {"rbl": 4416, "line": "U4", "station": "Wien Mitte"},
    "Westbahnhof (U3)": {"rbl": 4910, "line": "U3", "station": "Westbahnhof"},
    "Westbahnhof (U6)": {"rbl": 4610, "line": "U6", "station": "Westbahnhof"},
}

class WienerLinienApiClient:
    """
    Client für die offizielle Echtzeit-API der Wiener Linien (OGD Realtime).
    Verbindet sich mit /monitor und /trafficInfoList.
    """
    MONITOR_URL = "https://www.wienerlinien.at/ogd_realtime/monitor"
    TRAFFIC_INFO_URL = "https://www.wienerlinien.at/ogd_realtime/trafficInfoList"

    @classmethod
    async def check_health(cls) -> Dict[str, Any]:
        """Prüft die Erreichbarkeit und Latenz der Wiener Linien API."""
        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(cls.TRAFFIC_INFO_URL)
                latency_ms = round((time.perf_counter() - start) * 1000)
                if res.status_code == 200:
                    data = res.json()
                    status_code = data.get("message", {}).get("messageCode", 1)
                    traffic_count = len(data.get("data", {}).get("trafficInfos", []))
                    return {
                        "provider": "Wiener Linien OGD Realtime",
                        "status": "ONLINE",
                        "statusCode": res.status_code,
                        "latencyMs": latency_ms,
                        "details": f"API antwortet einwandfrei. {traffic_count} aktive Betriebsmeldungen im Netz.",
                        "error": None
                    }
                else:
                    return {
                        "provider": "Wiener Linien OGD Realtime",
                        "status": "DEGRADED",
                        "statusCode": res.status_code,
                        "latencyMs": latency_ms,
                        "details": f"Unerwarteter HTTP Status {res.status_code}",
                        "error": None
                    }
        except Exception as e:
            latency_ms = round((time.perf_counter() - start) * 1000)
            return {
                "provider": "Wiener Linien OGD Realtime",
                "status": "OFFLINE",
                "statusCode": 0,
                "latencyMs": latency_ms,
                "details": "Verbindung zum Wiener Linien Server konnte nicht hergestellt werden.",
                "error": str(e)
            }

    @classmethod
    async def fetch_live_monitor(cls, rbl: int = 4114) -> Dict[str, Any]:
        """
        Ruft Live-Abfahrtszeiten für eine RBL-Haltestelle der Wiener Linien ab.
        """
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(f"{cls.MONITOR_URL}?rbl={rbl}&activateTrafficInfo=stoerungkurz&activateTrafficInfo=stoerunglang")
                if res.status_code == 200:
                    raw = res.json()
                    monitors = raw.get("data", {}).get("monitors", [])
                    departures: List[Dict[str, Any]] = []

                    for m in monitors:
                        location_stop = m.get("locationStop", {})
                        station_title = location_stop.get("properties", {}).get("title", "Haltestelle")

                        for line in m.get("lines", []):
                            line_name = line.get("name", "")
                            line_towards = line.get("towards", "")
                            line_type = line.get("type", "")

                            for dep in line.get("departures", {}).get("departure", []):
                                time_obj = dep.get("departureTime", {})
                                vehicle_obj = dep.get("vehicle", {})

                                departures.append({
                                    "line": vehicle_obj.get("name") or line_name,
                                    "towards": vehicle_obj.get("towards") or line_towards,
                                    "platform": vehicle_obj.get("platform", ""),
                                    "countdown": time_obj.get("countdown", 0),
                                    "timePlanned": time_obj.get("timePlanned"),
                                    "timeReal": time_obj.get("timeReal"),
                                    "barrierFree": vehicle_obj.get("barrierFree", True),
                                    "type": line_type,
                                    "station": station_title
                                })

                    return {
                        "success": True,
                        "rbl": rbl,
                        "station": station_title if monitors else "Unbekannt",
                        "departuresCount": len(departures),
                        "departures": departures[:12],
                        "rawTrafficInfo": raw.get("data", {}).get("trafficInfos", [])
                    }
        except Exception as e:
            return {
                "success": False,
                "rbl": rbl,
                "error": str(e),
                "departures": []
            }

        return {"success": False, "rbl": rbl, "departures": []}

    @classmethod
    async def fetch_traffic_incidents(cls) -> List[IncidentAlert]:
        """
        Holt alle aktuellen Störungen und Baustellen der Wiener Linien.
        """
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(cls.TRAFFIC_INFO_URL)
                if res.status_code == 200:
                    data = res.json()
                    infos = data.get("data", {}).get("trafficInfos", [])
                    incidents: List[IncidentAlert] = []

                    for idx, info in enumerate(infos[:15]):
                        attrs = info.get("attributes", {})
                        title = info.get("title") or attrs.get("station") or "Störungsmeldung"
                        desc = attrs.get("reason") or info.get("description") or "Betriebliche Einschränkung gemeldet."
                        lines = info.get("relatedLines") or []
                        status = attrs.get("status", "")

                        severity = "WARNING"
                        if "AUFZUG" in title.upper() or "AUFZUG" in desc.upper():
                            severity = "INFO"

                        start_time = (
                            info.get("time", {}).get("start")
                            or attrs.get("start")
                            or attrs.get("ausserBetriebSeit")
                            or time.strftime("%Y-%m-%dT%H:%M:%S+02:00")
                        )
                        end_time = info.get("time", {}).get("end") or attrs.get("end")

                        incidents.append(IncidentAlert(
                            id=f"wl-ogd-{idx}",
                            title=f"{title}: {status}" if status else title,
                            description=desc,
                            lines=[str(l) for l in lines] if lines else ["Netz Wien"],
                            severity=severity,
                            validFrom=start_time,
                            validTo=end_time
                        ))
                    return incidents
        except Exception:
            pass

        return []
