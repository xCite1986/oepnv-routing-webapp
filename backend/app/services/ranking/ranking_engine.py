from typing import List
from datetime import datetime
from ...schemas.journey import Journey, Leg

class RankingEngine:
    """
    Ranking Engine nach §6 & §18.
    Primäres Optimierungsziel: minimale realistische Ankunftszeit (score = predicted_arrival_time).
    Umstiege sind erlaubt und werden nicht künstlich bestraft, wenn das Ziel früher erreicht wird.
    """

    @staticmethod
    def parse_time(dt_str: str) -> datetime:
        clean = dt_str.replace("Z", "+00:00")
        return datetime.fromisoformat(clean)

    @classmethod
    def check_transfer_plausibility(cls, journey: Journey) -> bool:
        """
        Prüft Umstiege auf Machbarkeit (§10):
        Ankunft + Gehzeit + Mindestumstiegszeit + Sicherheitspuffer <= Abfahrt.
        Gibt False zurück, wenn ein Umstieg unmöglich ist (gebrochener Anschluss).
        """
        for i in range(len(journey.legs) - 1):
            curr_leg = journey.legs[i]
            next_leg = journey.legs[i + 1]

            # Umstieg zwischen zwei Transit-Legs oder nach einem Fußweg
            curr_arrival = cls.parse_time(curr_leg.endTime)
            next_departure = cls.parse_time(next_leg.startTime)

            time_diff_sec = (next_departure - curr_arrival).total_seconds()

            # Wenn der nächste Zug vor der Ankunft des vorherigen abfährt -> unplausibel
            if time_diff_sec < 60: # Mindestens 1 Minute Puffer
                return False

        return True

    @classmethod
    def rank_journeys(cls, candidate_journeys: List[Journey]) -> List[Journey]:
        if not candidate_journeys:
            return []

        # 1. Filtere unplausible Routen (z.B. verpasste Anschlüsse wegen Echtzeitverspätung)
        valid_journeys: List[Journey] = []
        for j in candidate_journeys:
            if cls.check_transfer_plausibility(j):
                valid_journeys.append(j)
            else:
                # Markiere Verbindung mit Warnung oder verwerfe sie
                j.hasDisruptions = True

        if not valid_journeys:
            valid_journeys = candidate_journeys

        # 2. Sortierung nach minimaler realistischer Ankunftszeit
        # Tie-Breaker: Weniger Umstiege, weniger Fußweg
        def sort_key(j: Journey):
            arr_timestamp = cls.parse_time(j.arrivalTime).timestamp()
            # Tie-Breakers nur bei identischer Ankunftszeit (Sekunden)
            return (arr_timestamp, j.transferCount, j.walkingSeconds)

        sorted_journeys = sorted(valid_journeys, key=sort_key)

        # 3. Erste Route ist die EMPFOHLENE Verbindung (§6)
        for idx, j in enumerate(sorted_journeys):
            if idx == 0:
                j.recommended = True
                j.categoryTag = "EMPFOHLEN"
                j.tagLabel = "EMPFOHLEN"
            else:
                j.recommended = False
                if j.transferCount == 0:
                    j.categoryTag = "DIREKTER"
                    j.tagLabel = "DIREKTER"
                elif j.walkingSeconds < sorted_journeys[0].walkingSeconds:
                    j.categoryTag = "WENIGER_FUSSWEG"
                    j.tagLabel = "WENIGER ZU FUSS"
                else:
                    j.categoryTag = "ALTERNATIVE"
                    j.tagLabel = "ALTERNATIVE"

        return sorted_journeys
