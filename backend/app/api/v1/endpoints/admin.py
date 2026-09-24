from fastapi import APIRouter, Query, HTTPException, Body, Depends, Header, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from ....services.gtfs.gtfs_registry import GtfsRegistry
from ....services.gtfs.gtfs_models import GtfsFeedMetadata, GtfsImportResult
from ....services.realtime.api_diagnostics import ApiDiagnostics
from ....services.realtime.wiener_linien_api import WienerLinienApiClient, KNOWN_VIENNA_RBLS
from ....services.realtime.oebb_api import OebbApiClient, KNOWN_OEBB_STATIONS
from ....services.analytics.punctuality_service import PunctualityPerformanceService, TrainPerformanceMetric
from ....core.config import settings

router = APIRouter()
security = HTTPBearer(auto_error=False)

class AdminLoginRequest(BaseModel):
    password: str

class AdminLoginResponse(BaseModel):
    success: bool
    token: str
    message: str

def verify_admin_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    x_admin_password: Optional[str] = Header(None, alias="X-Admin-Password"),
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
) -> bool:
    """Überprüft Admin-Kennwort oder Session-Token."""
    # 1. Bearer Token
    if credentials and credentials.credentials == settings.ADMIN_SESSION_TOKEN:
        return True
    # 2. X-Admin-Token Header
    if x_admin_token and x_admin_token == settings.ADMIN_SESSION_TOKEN:
        return True
    # 3. Direktes Kennwort im X-Admin-Password Header
    if x_admin_password and x_admin_password == settings.ADMIN_PASSWORD:
        return True

    raise HTTPException(
        status_code=401,
        detail="Admin-Authentifizierung erforderlich. Bitte gültiges Kennwort angeben.",
        headers={"WWW-Authenticate": "Bearer"},
    )

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest):
    """Prüft das Admin-Kennwort und stellt bei Erfolg ein Session-Token aus."""
    if payload.password == settings.ADMIN_PASSWORD:
        return AdminLoginResponse(
            success=True,
            token=settings.ADMIN_SESSION_TOKEN,
            message="Erfolgreich als Administrator autorisiert."
        )
    raise HTTPException(
        status_code=401,
        detail="Ungültiges Admin-Kennwort."
    )

# Geschützter Router für sämtliche Datenpflege-, GTFS- & Administrations-Endpunkte
protected_router = APIRouter(dependencies=[Depends(verify_admin_auth)])

@protected_router.get("/verify")
async def verify_admin_session():
    """Validiert die aktuelle Admin-Sitzung."""
    return {"authenticated": True, "message": "Admin-Sitzung ist aktiv."}

@protected_router.get("/feeds", response_model=List[GtfsFeedMetadata])
async def list_gtfs_feeds():
    """Gibt alle registrierten GTFS-Fahrplandatenstände (Wiener Linien, ÖBB, VOR) zurück."""
    return GtfsRegistry.get_all_feeds()

@protected_router.post("/feeds/{feed_id}/sync", response_model=GtfsImportResult)
async def sync_gtfs_feed(feed_id: str):
    """Synchronisiert und aktualisiert einen bestimmten GTFS-Fahrplanfeed."""
    result = GtfsRegistry.sync_feed(feed_id)
    if not result.success:
        raise HTTPException(status_code=404, detail=result.message)
    return result

@protected_router.get("/api-checks")
async def run_api_checks():
    """Führt Live-Diagnosen und Latenzprüfungen für alle externen APIs (Wiener Linien, ÖBB, OTP) durch."""
    return await ApiDiagnostics.run_all_checks()

@protected_router.get("/known-stations")
async def get_known_stations():
    """Liefert Liste bekannter Wiener Haltestellen mit RBLs und ÖBB EVA IDs für Tests."""
    return {
        "wienerLinienRbls": KNOWN_VIENNA_RBLS,
        "oebbStations": KNOWN_OEBB_STATIONS
    }

@protected_router.get("/live-monitor/wiener-linien")
async def get_wiener_linien_live(rbl: int = Query(4114, description="RBL-Haltestellennummer")):
    """Fragt die offizielle Wiener Linien Monitor API live ab."""
    return await WienerLinienApiClient.fetch_live_monitor(rbl)

@protected_router.get("/live-monitor/oebb")
async def get_oebb_live(
    evaId: str = Query("1190100", description="ÖBB Bahnhofs-ID"),
    stationName: str = Query("Wien Hauptbahnhof")
):
    """Fragt das offizielle ÖBB Scotty Gateway live ab."""
    return await OebbApiClient.fetch_station_departures(evaId, stationName)

@protected_router.get("/live-monitor/oebb-stations")
async def search_oebb_stations(q: str = Query("Wien", description="Suchbegriff für ÖBB Bahnhof")):
    """Sucht ÖBB Bahnhöfe über das HAFAS Gateway (analog zu public-transport/oebb)."""
    return await OebbApiClient.search_stations(q)

@protected_router.get("/train-performance")
async def get_train_performance_metrics():
    """
    Liefert statistische Pünktlichkeits- und Performancedaten der Züge und Linien
    basierend auf 'piebro/deutsche-bahn-data' & ÖBB Scotty Gateway.
    """
    return {
        "dataset": "piebro/deutsche-bahn-data & ÖBB Scotty Live",
        "description": "Historische Pünktlichkeits-, Verspätungs- und Ausfallmetriken zur realistischen Kostenoptimierung.",
        "metrics": PunctualityPerformanceService.get_all_metrics()
    }

@protected_router.post("/train-performance/simulate")
async def simulate_transfer_risk(payload: Dict[str, Any] = Body(...)):
    """Simuliert das Anschlussrisiko bei gegebener Pufferzeit für eine Zuggattung oder Linie."""
    line = payload.get("line", "S7")
    leg_type = payload.get("legType", "TRAIN")
    buffer_sec = int(payload.get("bufferMinutes", 3) * 60)
    
    metric = PunctualityPerformanceService.get_metric(line, leg_type)
    prob_missed = PunctualityPerformanceService.calculate_missed_connection_probability(line, leg_type, buffer_sec)
    risk_sec = PunctualityPerformanceService.calculate_missed_connection_risk(line, leg_type, buffer_sec)
    
    return {
        "line": metric.line,
        "category": metric.category,
        "meanDelayMinutes": metric.meanDelayMinutes,
        "stdDevMinutes": metric.stdDevMinutes,
        "bufferMinutes": buffer_sec / 60,
        "missedConnectionProbability": prob_missed,
        "connectionReliabilityPercent": round((1.0 - prob_missed) * 100, 1),
        "riskPenaltySeconds": risk_sec
    }

@protected_router.get("/cost-config")
async def get_cost_configuration():
    """Liefert die aktuellen Gewichtungs-Parameter der Kostenfunktion (§18)."""
    return {
        "alpha": settings.COST_ALPHA,
        "beta": settings.COST_BETA,
        "gamma": settings.COST_GAMMA,
        "baseTransferPenaltySec": settings.BASE_TRANSFER_PENALTY_SEC,
        "defaultHeadwayPenaltySec": settings.DEFAULT_HEADWAY_PENALTY_SEC,
        "formula": "cost = ETA + (alpha * transfer_penalty) + (beta * missed_connection_risk) + (gamma * disruption_risk)"
    }

@protected_router.post("/cost-config")
async def update_cost_configuration(payload: Dict[str, Any] = Body(...)):
    """Aktualisiert die Gewichtungsfaktoren alpha, beta, gamma der Kostenfunktion."""
    if "alpha" in payload:
        settings.COST_ALPHA = float(payload["alpha"])
    if "beta" in payload:
        settings.COST_BETA = float(payload["beta"])
    if "gamma" in payload:
        settings.COST_GAMMA = float(payload["gamma"])
    if "baseTransferPenaltySec" in payload:
        settings.BASE_TRANSFER_PENALTY_SEC = float(payload["baseTransferPenaltySec"])
    if "defaultHeadwayPenaltySec" in payload:
        settings.DEFAULT_HEADWAY_PENALTY_SEC = float(payload["defaultHeadwayPenaltySec"])
    
    return {
        "success": True,
        "message": "Kostenfunktions-Gewichtungen erfolgreich aktualisiert.",
        "config": {
            "alpha": settings.COST_ALPHA,
            "beta": settings.COST_BETA,
            "gamma": settings.COST_GAMMA,
            "baseTransferPenaltySec": settings.BASE_TRANSFER_PENALTY_SEC,
            "defaultHeadwayPenaltySec": settings.DEFAULT_HEADWAY_PENALTY_SEC
        }
    }

@protected_router.get("/config")
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
        "cacheTtlSec": 60,
        "costAlpha": settings.COST_ALPHA,
        "costBeta": settings.COST_BETA,
        "costGamma": settings.COST_GAMMA
    }

@protected_router.post("/config")
async def update_admin_config(payload: Dict[str, Any] = Body(...)):
    """Aktualisiert Konfigurationsparameter."""
    if "realtimeEnabled" in payload:
        settings.REALTIME_ENABLED = bool(payload["realtimeEnabled"])
    if "wienerLinienApiKey" in payload:
        settings.WIENER_LINIEN_API_KEY = str(payload["wienerLinienApiKey"])
    if "alpha" in payload:
        settings.COST_ALPHA = float(payload["alpha"])
    if "beta" in payload:
        settings.COST_BETA = float(payload["beta"])
    if "gamma" in payload:
        settings.COST_GAMMA = float(payload["gamma"])
    return {"success": True, "message": "Konfiguration erfolgreich aktualisiert."}

# Alle geschützten Admin-Endpunkte in den Hauptrouter einbinden
router.include_router(protected_router)

