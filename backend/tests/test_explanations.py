from datetime import datetime, timedelta
from app.schemas.journey import Journey, Leg, StopPoint, JourneyExplanation
from app.services.explanations.explanation_engine import ExplanationEngine

def test_explanation_rules_for_transfer_tradeoff_and_delay():
    now = datetime(2026, 9, 24, 15, 0, 0)
    
    # Empfohlene Route: 2 Umstiege, Ankunft 15:39 (39 min)
    rec_journey = Journey(
        id="rec",
        recommended=True,
        departureTime=now.isoformat(),
        arrivalTime=(now + timedelta(minutes=39)).isoformat(),
        durationSeconds=39 * 60,
        walkingSeconds=360,
        walkingMeters=400,
        transferCount=2,
        realtime=True,
        totalDelayMinutes=0,
        explanation=JourneyExplanation(headline="", details=[]),
        legs=[]
    )

    # Alternative Route: Direkt (0 Umstiege), aber Ankunft 15:47 wegen 11 Min. Verspätung
    alt_journey = Journey(
        id="alt-direct",
        recommended=False,
        departureTime=now.isoformat(),
        arrivalTime=(now + timedelta(minutes=47)).isoformat(),
        durationSeconds=47 * 60,
        walkingSeconds=540,
        walkingMeters=620,
        transferCount=0,
        realtime=True,
        totalDelayMinutes=11,
        hasDisruptions=True,
        explanation=JourneyExplanation(headline="", details=[]),
        legs=[]
    )

    explanation, updated = ExplanationEngine.generate_explanations([rec_journey, alt_journey])

    # 1. Headline
    assert explanation.headline == "Aktuell schnellste Verbindung"

    # 2. Details müssen den Trade-Off erwähnen (§19)
    details_str = " ".join(explanation.details)
    assert "Trotz" in details_str
    assert "schneller am Ziel" in details_str
    assert "verspätet" in details_str

    # 3. Alternative comparison must be populated
    assert updated[1].comparisonWithRecommended is not None
    assert updated[1].comparisonWithRecommended.timeDiffMinutes == 8
    assert "langsamer" in updated[1].comparisonWithRecommended.summaryText
