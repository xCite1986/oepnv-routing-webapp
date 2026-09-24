from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class GtfsFeedMetadata(BaseModel):
    id: str                        # z.B. "WIENER_LINIEN", "OEBB", "VOR"
    name: str                      # z.B. "Wiener Linien GTFS", "ÖBB Personenverkehr GTFS"
    operator: str                  # z.B. "Wiener Linien GmbH & Co KG", "ÖBB-Personenverkehr AG"
    sourceUrl: str                 # Download- oder Portal-URL
    version: str                   # z.B. "2026.1"
    validFrom: str                 # ISO Date
    validTo: str                   # ISO Date
    status: str                    # "ACTIVE", "UPDATING", "ERROR", "OUTDATED"
    lastUpdated: str               # ISO DateTime
    fileSizeBytes: Optional[int] = 0
    stopsCount: int
    routesCount: int
    tripsCount: int
    license: str                   # z.B. "CC-BY-4.0"
    isRealtimeSupported: bool = True
    realtimeProvider: str          # "WIENER_LINIEN_OGD" oder "OEBB_SCOTTY"

class GtfsImportResult(BaseModel):
    feedId: str
    success: bool
    importedStops: int
    importedRoutes: int
    importedTrips: int
    durationSeconds: float
    message: str
    timestamp: str = datetime.now().isoformat()
