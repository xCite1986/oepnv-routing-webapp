from typing import List, Optional
import httpx
from datetime import datetime
from ...schemas.journey import Journey, JourneySearchRequest
from ...core.config import settings

class OtpClient:
    """
    Client für OpenTripPlanner (§17).
    Ruft OTP-Kandidaten ab. Falls OTP lokal nicht läuft, greift die integrierte
    Vienna Network Engine als Fallback ein.
    """

    @classmethod
    async def plan_trip(cls, request: JourneySearchRequest) -> Optional[List[Journey]]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(
                    f"{settings.OTP_BASE_URL}/routers/{settings.OTP_ROUTER_ID}/plan",
                    params={
                        "fromPlace": f"{request.from_.lat},{request.from_.lon}",
                        "toPlace": f"{request.to.lat},{request.to.lon}",
                        "date": request.dateTime[:10],
                        "time": request.dateTime[11:16],
                        "mode": "TRANSIT,WALK",
                        "maxWalkDistance": request.preferences.maxWalkingDistance if request.preferences else 1500,
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    # Wenn OTP Kandidaten liefert, normalisieren
                    itineraries = data.get("plan", {}).get("itineraries", [])
                    if itineraries:
                        # Parsing logic would go here
                        return []
        except Exception:
            # OTP nicht erreichbar -> Fallback
            pass

        return None
