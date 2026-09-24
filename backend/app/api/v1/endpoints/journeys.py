from fastapi import APIRouter, HTTPException
from ....schemas.journey import JourneySearchRequest, JourneySearchResponse
from ....services.routing.routing_service import RoutingService

router = APIRouter()

@router.post("/search", response_model=JourneySearchResponse)
async def search_journeys(request: JourneySearchRequest):
    """
    Sucht die aktuell schnellste bzw. sinnvollste Verbindung unter Einbeziehung
    von Echtzeitdaten, Verspätungen und Störungen (§13, §14).
    """
    try:
        response = await RoutingService.find_journeys(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler bei der Verbindungssuche: {str(e)}")
