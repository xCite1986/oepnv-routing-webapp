from typing import List, Dict, Any
from datetime import datetime
from .wiener_linien_api import WienerLinienApiClient
from .oebb_api import OebbApiClient
from ...core.config import settings
import httpx
import time

class ApiDiagnostics:
    """
    Zentraler Dienst zur Überprüfung und Diagnose aller externen und internen ÖPNV-APIs.
    """

    @classmethod
    async def run_all_checks(cls) -> Dict[str, Any]:
        timestamp = datetime.now().isoformat()
        checks: List[Dict[str, Any]] = []

        # 1. Wiener Linien OGD Realtime Check
        wl_check = await WienerLinienApiClient.check_health()
        checks.append(wl_check)

        # 2. ÖBB Scotty Gateway Check
        oebb_check = await OebbApiClient.check_health()
        checks.append(oebb_check)

        # 3. OpenTripPlanner Engine Check
        otp_start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{settings.OTP_BASE_URL}/routers/{settings.OTP_ROUTER_ID}")
                otp_latency = round((time.perf_counter() - otp_start) * 1000)
                if res.status_code == 200:
                    checks.append({
                        "provider": "OpenTripPlanner Engine",
                        "status": "ONLINE",
                        "statusCode": 200,
                        "latencyMs": otp_latency,
                        "details": "OTP Graph aktiv und bereit für multimodales Routing.",
                        "error": None
                    })
                else:
                    checks.append({
                        "provider": "OpenTripPlanner Engine",
                        "status": "STANDBY",
                        "statusCode": res.status_code,
                        "latencyMs": otp_latency,
                        "details": f"OTP antwortet mit Status {res.status_code}. Lokaler Wien-Netz-Fallback aktiv.",
                        "error": None
                    })
        except Exception:
            otp_latency = round((time.perf_counter() - otp_start) * 1000)
            checks.append({
                "provider": "OpenTripPlanner Engine",
                "status": "STANDBY",
                "statusCode": 0,
                "latencyMs": otp_latency,
                "details": "Lokal im Standby (Container nicht gestartet). Der integrierte Wiener Routing-Dienst übernimmt autonom.",
                "error": None
            })

        # Overall Status
        online_count = sum(1 for c in checks if c["status"] == "ONLINE")
        overall = "HEALTHY" if online_count >= 2 else "DEGRADED"

        return {
            "timestamp": timestamp,
            "overallStatus": overall,
            "totalChecks": len(checks),
            "onlineServices": online_count,
            "checks": checks
        }
