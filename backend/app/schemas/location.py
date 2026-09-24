from pydantic import BaseModel
from typing import Optional

class LocationPoint(BaseModel):
    lat: float
    lon: float
    label: str
    type: Optional[str] = "STOP" # STOP, STATION, ADDRESS, POI, CURRENT_LOCATION
    stopId: Optional[str] = None
    municipality: Optional[str] = None
