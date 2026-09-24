from typing import List, Tuple
from datetime import datetime
from ...schemas.journey import Journey, JourneyExplanation, AlternativeComparison

class ExplanationEngine:
    """
    Regelbasierte Explanation Engine (§19).
    Vergleicht strukturierte Daten der empfohlenen Route mit Alternativen
    und generiert verständliche, faktenbasierte Begründungen ohne Erfindungen.
    """

    @classmethod
    def parse_iso(cls, dt_str: str) -> datetime:
        # Ersetze Z durch +00:00 für standard fromisoformat
        clean = dt_str.replace("Z", "+00:00")
        return datetime.fromisoformat(clean)

    @classmethod
    def generate_explanations(cls, journeys: List[Journey]) -> Tuple[JourneyExplanation, List[Journey]]:
        if not journeys:
            return JourneyExplanation(
                headline="Keine Verbindung verfügbar",
                details=["Es konnte keine passende Verbindung gefunden werden."]
            ), []

        rec = journeys[0]
        alternatives = journeys[1:] if len(journeys) > 1 else []

        rec_arr = cls.parse_iso(rec.arrivalTime)
        rec_transfers = rec.transferCount
        rec_walk_min = round(rec.walkingSeconds / 60)

        rec_details: List[str] = []

        # Vergleich gegen die erste Alternative (oder direkte Alternative)
        if alternatives:
            alt1 = alternatives[0]
            alt1_arr = cls.parse_iso(alt1.arrivalTime)
            time_diff_sec = (alt1_arr - rec_arr).total_seconds()
            time_diff_min = round(time_diff_sec / 60)

            # Regel: Schneller trotz mehr Umstiegen
            if time_diff_min > 0 and rec_transfers > alt1.transferCount:
                extra_transfers = rec_transfers - alt1.transferCount
                transfer_word = "eines zusätzlichen Umstiegs" if extra_transfers == 1 else f"{extra_transfers} zusätzlicher Umstiege"
                rec_details.append(
                    f"Trotz {transfer_word} bist du aktuell {time_diff_min} Minuten schneller am Ziel."
                )
            elif time_diff_min > 0:
                rec_details.append(
                    f"Diese Verbindung ist aktuell {time_diff_min} Minuten schneller als die direkte Alternative."
                )

            # Regel: Verspätung auf der Alternative
            if alt1.totalDelayMinutes >= 3:
                rec_details.append(
                    f"Die alternative Direktverbindung ist derzeit um etwa {alt1.totalDelayMinutes} Minuten verspätet."
                )

            # Regel: Störungen / Weichenprobleme
            if alt1.hasDisruptions:
                rec_details.append(
                    "Auf der Alternativroute wurde eine aktuelle Betriebsstörung gemeldet."
                )

            # Regel: Ausfälle
            if alt1.hasCancellations:
                rec_details.append(
                    "Die direkte Verbindung fällt auf Teilstrecken aktuell aus."
                )

        # Prüfe Umstiegssicherheit der empfohlenen Route
        tight_transfers = [
            leg for leg in rec.legs
            if leg.transferInfo and leg.transferInfo.difficulty == "TIGHT"
        ]
        relaxed_transfers = [
            leg for leg in rec.legs
            if leg.transferInfo and leg.transferInfo.difficulty == "RELAXED"
        ]

        if not tight_transfers and relaxed_transfers:
            rec_details.append(
                f"Die Umstiege sind mit ausreichend Zeitpuffer ({relaxed_transfers[0].transferInfo.bufferMinutes} Min.) gesichert."
            )

        if not rec_details:
            rec_details.append("Früheste verifizierte Ankunftszeit aller berechneten Optionen.")

        headline = "Aktuell schnellste Verbindung"
        rec.explanation = JourneyExplanation(headline=headline, details=rec_details)

        # Nun Erklärungen / Vergleiche für jede Alternative erzeugen (§8)
        updated_alternatives: List[Journey] = []
        for alt in alternatives:
            alt_arr = cls.parse_iso(alt.arrivalTime)
            diff_min = round((alt_arr - rec_arr).total_seconds() / 60)
            transfer_diff = alt.transferCount - rec_transfers
            walk_diff_min = round((alt.walkingSeconds - rec.walkingSeconds) / 60)

            alt_reasons: List[str] = []
            if diff_min > 0:
                alt_reasons.append(f"{diff_min} min später am Ziel")
            elif diff_min < 0:
                alt_reasons.append(f"{abs(diff_min)} min frühere Abfahrt nötig")

            if alt.totalDelayMinutes > 0:
                alt_reasons.append(f"Aktuell +{alt.totalDelayMinutes} min verspätet")

            if walk_diff_min > 2:
                alt_reasons.append(f"{walk_diff_min} min längerer Fußweg")
            elif walk_diff_min < -2:
                alt_reasons.append(f"{abs(walk_diff_min)} min weniger Fußweg")

            if alt.hasDisruptions:
                alt_reasons.append("Streckenabschnitt mit gemeldeter Betriebsstörung")

            summary_parts: List[str] = []
            if diff_min > 0:
                summary_parts.append(f"{diff_min} min langsamer")
            if alt.totalDelayMinutes > 0:
                summary_parts.append(f"aktuell +{alt.totalDelayMinutes} min verspätet")
            elif walk_diff_min < 0:
                summary_parts.append("kürzester Fußweg")

            summary_text = " • ".join(summary_parts) if summary_parts else "Alternative Option"

            alt.comparisonWithRecommended = AlternativeComparison(
                timeDiffMinutes=max(0, diff_min),
                transferDiff=transfer_diff,
                walkDiffMinutes=walk_diff_min,
                summaryText=summary_text,
                reasons=alt_reasons
            )
            updated_alternatives.append(alt)

        return rec.explanation, [rec] + updated_alternatives
