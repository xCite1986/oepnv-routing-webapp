from fastapi import APIRouter, Query, HTTPException, Body
from typing import Dict, Any, List
from ....services.gtfs.gtfs_registry import GtfsRegistry
from ....services.gtfs.gtfs_models import GtfsFeedMetadata, GtfsImportResult
from ....services.realtime.api_diagnostics import ApiDiagnostics
from ....services.realtime.wiener_linien_api import WienerLinienApiClient, KNOWN_VIENNA_RBLS
from ....services.realtime.oebb_api import OebbApiClient, KNOWN_OEBB_STATIONS
from ....core.config import settings

router = APIRouter()

@router.get("/feeds", response_model=List[GtfsFeedMetadata])
async def list_gtfs_feeds():
    """Gibt alle registrierten GTFS-Fahrplandatenstände (Wiener Linien, ÖBB, VOR) zurück."""
    return GtfsRegistry.get_all_feeds()

@router.post("/feeds/{feed_id}/sync", response_model=GtfsImportResult)
async def sync_gtfs_feed(feed_id: str):
    """Synchronisiert und aktualisiert einen bestimmten GTFS-Fahrplanfeed."""
    result = GtfsRegistry.sync_feed(feed_id)
    if not result.success:
        raise HTTPException(status_code=404, detail=result.message)
    return result

@router.get("/api-checks")
async def run_api_checks():
    """Führt Live-Diagnosen und Latenzprüfungen für alle externen APIs (Wiener Linien, ÖBB, OTP) durch."""
    return await ApiDiagnostics.run_all_checks()

@router.get("/known-stations")
async def get_known_stations():
    """Liefert Liste bekannter Wiener Haltestellen mit RBLs und ÖBB EVA IDs für Tests."""
    return {
        "wienerLinienRbls": KNOWN_VIENNA_RBLS,
        "oebbStations": KNOWN_OEBB_STATIONS
    }

@router.get("/live-monitor/wiener-linien")
async def get_wiener_linien_live(rbl: int = Query(4114, description="RBL-Haltestellennummer")):
    """Fragt die offizielle Wiener Linien Monitor API live ab."""
    return await WienerLinienApiClient.fetch_live_monitor(rbl)

@router.get("/live-monitor/oebb")
async def get_oebb_live(
    evaId: str = Query("1190100", description="ÖBB Bahnhofs-ID"),
    stationName: str = Query("Wien Hauptbahnhof")
):
    """Fragt das offizielle ÖBB Scotty Gateway live ab."""
    return await OebbApiClient.fetch_station_departures(evaId, stationName)

@router.get("/live-monitor/oebb-stations")
async def search_oebb_stations(q: str = Query("Wien", description="Suchbegriff für ÖBB Bahnhof")):
    """Sucht ÖBB Bahnhöfe über das HAFAS Gateway (analog zu public-transport/oebb)."""
    return await OebbApiClient.search_stations(q)

@router.get("/config")
async def get_admin_config():
    """Liefert die aktuellen Systemkonfigurationen und Endpunkte."""
    return {
        "projectName": settings.PROJECT_NAME,
        "otpBaseUrl": settings.OTP_BASE_URL,
        "otpRouterId": settings.OTP_ROUTER_ID,
        "realtimeEnabled": settings.REALTIME_ENABLED,
        "redisEnabled": settings.REDIS_ENABLED,
        "dbEnabled": settings.DB_ENABLED,
        "wienerLinienApiKey": settings.WIENER_LINIEN_API_KEY or "Öffentliche OGD (Kein Key erforderlich)",
        "pollingIntervalSec": 30,
        "cacheTtlSec": 60
    }

@router.post("/config")
async def update_admin_config(payload: Dict[str, Any] = Body(...)):
    """Aktualisiert Konfigurationsparameter."""
    if "realtimeEnabled" in payload:
        settings.REALTIME_ENABLED = bool(payload["realtimeEnabled"])
    if "wienerLinienApiKey" in payload:
        settings.WIENER_LINIEN_API_KEY = str(payload["wienerLinienApiKey"])
    return {"success": True, "message": "Konfiguration erfolgreich aktualisiert."}
