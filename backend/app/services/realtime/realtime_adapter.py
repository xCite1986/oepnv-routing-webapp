from typing import Dict, List, Optional
from datetime import datetime
from ...schemas.incident import IncidentAlert

class RealtimeAdapter:
    """
    Realtime Adapter (§15, §16).
    Normalisiert Livedaten von Wiener Linien / ÖBB und stellt Echtzeit-Trip-Updates
    sowie Störungsmeldungen für die Routing Engine bereit.
    """

    # In-Memory Cache für Verspätungen und Störungen (auch ohne externes Redis lauffähig)
    _trip_delays: Dict[str, int] = {
        "S7-WIENMITTE-DIRECT": 11,
        "U4-SCHWENDENPLATZ": 8,
    }

    _incidents: List[IncidentAlert] = [
        IncidentAlert(
            id="inc-1",
            title="S-Bahn Stammstrecke: Verzögerungen",
            description="Wegen einer Weichenreparatur im Bereich Wien Rennweg kommt es auf den Linien S1, S2, S3 und S7 zu Verzögerungen von bis zu 15 Minuten.",
            lines=["S1", "S2", "S3", "S7"],
            severity="WARNING",
            validFrom="2026-09-24T14:30:00+02:00"
        ),
        IncidentAlert(
            id="inc-2",
            title="U4: Weichenstörung behoben",
            description="Der Regelbetrieb wurde wieder aufgenommen, geringfügige Restverspätungen möglich.",
            lines=["U4"],
            severity="INFO",
            validFrom="2026-09-24T15:00:00+02:00"
        )
    ]

    @classmethod
    def get_trip_delay(cls, trip_id: str) -> int:
        return cls._trip_delays.get(trip_id, 0)

    @classmethod
    def set_trip_delay(cls, trip_id: str, delay_minutes: int):
        cls._trip_delays[trip_id] = delay_minutes

    @classmethod
    def get_active_incidents(cls) -> List[IncidentAlert]:
        return cls._incidents

    @classmethod
    def check_line_disrupted(cls, line: str) -> Optional[IncidentAlert]:
        for inc in cls._incidents:
            if line in inc.lines:
                return inc
        return None
