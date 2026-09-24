from typing import List, Optional, Tuple
from datetime import datetime
from ...schemas.journey import Journey, Leg, CostBreakdown
from ...core.config import settings
from ..analytics.punctuality_service import PunctualityPerformanceService

class RankingEngine:
    """
    Ranking Engine nach §6 & §18 erweitert um die Performance- & Kostenfunktion:
    cost = ETA + (alpha * transfer_penalty) + (beta * missed_connection_risk) + (gamma * disruption_risk)

    - ETA: Realistische vorausberechnete Ankunfts- bzw. Reisedauer in Sekunden unter Berücksichtigung
           von Zugverspätungen (piebro/deutsche-bahn-data & ÖBB).
    - transfer_penalty: Physischer & zeitlicher Reibungsverlust pro Umstieg (sekundengenau).
    - missed_connection_risk: Mathematisches Risiko eines verpassten Anschlusses bei knappen Puffern:
           P(Verspätung > Puffer) * Folgeverspätung/Taktzeit (Sekunden).
    - disruption_risk: Erwarteter Ausfall- und Störungs-Malus basierend auf historischen Ausfallquoten
           und aktiven Echtzeit-Störungsmeldungen.
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

            curr_arrival = cls.parse_time(curr_leg.endTime)
            next_departure = cls.parse_time(next_leg.startTime)

            time_diff_sec = (next_departure - curr_arrival).total_seconds()

            # Wenn der nächste Zug vor der Ankunft des vorherigen abfährt -> unplausibel
            if curr_leg.type == "WALK" or next_leg.type == "WALK":
                if time_diff_sec < -30:
                    return False
            else:
                if time_diff_sec < 0:
                    return False

        return True

    @classmethod
    def calculate_cost(
        cls,
        journey: Journey,
        alpha: float,
        beta: float,
        gamma: float
    ) -> Tuple[float, CostBreakdown, int]:
        """
        Berechnet die Gesamtkosten einer Route gemäß der geforderten Formel:
        cost = ETA + alpha * transfer_penalty + beta * missed_connection_risk + gamma * disruption_risk
        """
        dep_time = cls.parse_time(journey.departureTime)
        arr_time = cls.parse_time(journey.arrivalTime)

        # 1. ETA (in Sekunden Reisedauer + allfällige Ankunftsverspätung der letzten Fahrt)
        base_duration_sec = (arr_time - dep_time).total_seconds()
        last_leg = journey.legs[-1] if journey.legs else None
        last_leg_delay_sec = (last_leg.delayMinutes * 60) if last_leg else 0
        eta_seconds = max(0.0, base_duration_sec + last_leg_delay_sec)
        eta_minutes = round(eta_seconds / 60.0, 1)

        # 2. Transfer-Penalty (Physischer Komfortverlust pro Umstieg)
        # Standard: 180s (3 Min) Basisstrafe pro Umstieg + Distanzfriktion
        transfer_penalty_sec = 0.0
        if journey.transferCount > 0:
            transfer_penalty_sec += journey.transferCount * settings.BASE_TRANSFER_PENALTY_SEC
            for leg in journey.legs:
                if leg.transferInfo:
                    if leg.transferInfo.walkingMeters > 100:
                        transfer_penalty_sec += (leg.transferInfo.walkingMeters - 100) * 0.2
                    if leg.transferInfo.difficulty == "TIGHT":
                        transfer_penalty_sec += 60.0
                    elif leg.transferInfo.difficulty == "RISKY":
                        transfer_penalty_sec += 180.0

        # 3. Missed Connection Risk (Wahrscheinlichkeit verpasster Anschlüsse)
        # Verbindungsrisiko existiert nur zwischen aufeinanderfolgenden ÖPNV-Fahrten (nicht bei reinen Fußwegen)
        missed_connection_risk_sec = 0.0
        connection_reliabilities = []
        
        transit_indices = [idx for idx, leg in enumerate(journey.legs) if leg.type != "WALK"]
        
        for k in range(len(transit_indices) - 1):
            curr_leg = journey.legs[transit_indices[k]]
            next_leg = journey.legs[transit_indices[k + 1]]
            curr_arr = cls.parse_time(curr_leg.endTime)
            next_dep = cls.parse_time(next_leg.startTime)
            window_sec = max(0, int((next_dep - curr_arr).total_seconds()))

            # Zwischenfußwege ermitteln
            walk_legs = [
                l for l in journey.legs[transit_indices[k] + 1 : transit_indices[k + 1]]
                if l.type == "WALK"
            ]
            walk_dist_total = sum(l.distanceMeters or 100 for l in walk_legs)

            # Transfer-Buffer ermitteln
            t_info = next_leg.transferInfo or (walk_legs[0].transferInfo if walk_legs and walk_legs[0].transferInfo else None)
            if t_info and t_info.bufferMinutes > 0:
                buffer_sec = t_info.bufferMinutes * 60
            elif walk_legs:
                est_walk_sec = max(45, int(walk_dist_total / 1.1))
                buffer_sec = max(0, window_sec - est_walk_sec)
            else:
                # Bahnsteiggleicher Umstieg oder selbe Station ohne separaten Fußweg
                buffer_sec = max(0, window_sec - 60)

            risk = PunctualityPerformanceService.calculate_missed_connection_risk(
                curr_leg.line,
                curr_leg.type,
                buffer_sec,
                settings.DEFAULT_HEADWAY_PENALTY_SEC
            )
            prob_missed = PunctualityPerformanceService.calculate_missed_connection_probability(
                curr_leg.line,
                curr_leg.type,
                buffer_sec
            )
            connection_reliabilities.append(1.0 - prob_missed)
            missed_connection_risk_sec += risk

        # 4. Disruption Risk (Störungs- & Ausfallrisiko aus Datenhistorie + Live-Alerts)
        disruption_risk_sec = 0.0
        for leg in journey.legs:
            leg_disruption = bool(leg.disruptionNotice or journey.hasDisruptions)
            leg_risk = PunctualityPerformanceService.calculate_disruption_risk(
                leg.line,
                leg.type,
                has_disruption=leg_disruption,
                is_cancelled=bool(leg.isCancelled)
            )
            disruption_risk_sec += leg_risk

        # Gesamtkosten
        total_cost = (
            eta_seconds
            + (alpha * transfer_penalty_sec)
            + (beta * missed_connection_risk_sec)
            + (gamma * disruption_risk_sec)
        )

        # Gesamte Zuverlässigkeit (0 - 100 %)
        # 1. Anschluss-Wahrscheinlichkeit: Gelingt jeder Umstieg?
        rel_transfers = 1.0
        for rel in connection_reliabilities:
            rel_transfers *= rel

        # 2. Ausfallsicherheit und Pünktlichkeit der genutzten Linien
        transit_legs = [l for l in journey.legs if l.type != "WALK"]
        cancel_factor = 1.0
        punct_sum = 0.0
        for leg in transit_legs:
            metric = PunctualityPerformanceService.get_metric(leg.line, leg.type)
            cancel_factor *= (1.0 - (metric.cancellationRatePct / 100.0))
            punct_sum += metric.punctualityRatePct

        avg_punct_factor = (punct_sum / len(transit_legs) / 100.0) if transit_legs else 0.98

        # 3. Akute Störungen oder Ausfälle
        disruption_factor = 1.0
        if getattr(journey, 'hasCancellations', False) or any(l.isCancelled for l in journey.legs):
            disruption_factor = 0.05
        elif getattr(journey, 'hasDisruptions', False) or any(l.disruptionNotice for l in journey.legs):
            disruption_factor = 0.85
        elif any(l.delayMinutes >= 5 for l in journey.legs):
            disruption_factor = 0.90

        total_rel = rel_transfers * cancel_factor * avg_punct_factor * disruption_factor
        reliability_pct = max(1, min(99, int(round(total_rel * 100))))
        if len(transit_indices) <= 1 and not getattr(journey, 'hasDisruptions', False) and not getattr(journey, 'hasCancellations', False):
            reliability_pct = max(94, reliability_pct)

        summary_str = (
            f"ETA: {eta_minutes}m + α({alpha}×{round(transfer_penalty_sec/60, 1)}m) + "
            f"β({beta}×{round(missed_connection_risk_sec/60, 1)}m) + "
            f"γ({gamma}×{round(disruption_risk_sec/60, 1)}m) = Score {round(total_cost, 1)}"
        )

        breakdown = CostBreakdown(
            costScore=round(total_cost, 2),
            etaSeconds=round(eta_seconds, 1),
            etaMinutes=eta_minutes,
            transferPenalty=round(transfer_penalty_sec, 2),
            missedConnectionRisk=round(missed_connection_risk_sec, 2),
            disruptionRisk=round(disruption_risk_sec, 2),
            alpha=alpha,
            beta=beta,
            gamma=gamma,
            reliabilityPercent=reliability_pct,
            summary=summary_str
        )

        return round(total_cost, 2), breakdown, reliability_pct

    @classmethod
    def rank_journeys(
        cls,
        candidate_journeys: List[Journey],
        alpha: Optional[float] = None,
        beta: Optional[float] = None,
        gamma: Optional[float] = None
    ) -> List[Journey]:
        """
        Sortiert Kandidaten anhand der Kostenfunktion (§18):
        cost = ETA + (alpha * transfer_penalty) + (beta * missed_connection_risk) + (gamma * disruption_risk)
        """
        if not candidate_journeys:
            return []

        a = alpha if alpha is not None else settings.COST_ALPHA
        b = beta if beta is not None else settings.COST_BETA
        g = gamma if gamma is not None else settings.COST_GAMMA

        # 1. Filtere unplausible Routen (z.B. gebrochene Anschlüsse wegen Verspätung)
        valid_journeys: List[Journey] = []
        for j in candidate_journeys:
            if cls.check_transfer_plausibility(j):
                valid_journeys.append(j)
            else:
                j.hasDisruptions = True

        if not valid_journeys:
            valid_journeys = candidate_journeys

        # 2. Berechne Kostenfunktion und Zuverlässigkeit für jede Verbindung
        for j in valid_journeys:
            cost, breakdown, rel_pct = cls.calculate_cost(j, a, b, g)
            j.costScore = cost
            j.costBreakdown = breakdown
            j.reliabilityPercent = rel_pct

        # 3. Sortierung nach minimaler Kostenfunktion (score = cost)
        # Tie-Breaker: Frühere Ankunft, weniger Umstiege, weniger Fußweg
        def sort_key(j: Journey):
            cost_val = j.costScore if j.costScore is not None else 999999.0
            arr_timestamp = cls.parse_time(j.arrivalTime).timestamp()
            return (cost_val, arr_timestamp, j.transferCount, j.walkingSeconds)

        sorted_journeys = sorted(valid_journeys, key=sort_key)

        # 4. Erste Route ist die EMPFOHLENE Verbindung (§6 & §18)
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
