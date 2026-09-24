from datetime import datetime, timedelta
from app.schemas.journey import Journey, Leg, StopPoint, JourneyExplanation, TransferInfo
from app.services.ranking.ranking_engine import RankingEngine
from app.services.analytics.punctuality_service import PunctualityPerformanceService

def make_dummy_journey(id_: str, departure: datetime, arrival: datetime, transfers: int) -> Journey:
    return Journey(
        id=id_,
        recommended=False,
        departureTime=departure.isoformat(),
        arrivalTime=arrival.isoformat(),
        durationSeconds=int((arrival - departure).total_seconds()),
        walkingSeconds=300,
        walkingMeters=350,
        transferCount=transfers,
        realtime=True,
        totalDelayMinutes=0,
        explanation=JourneyExplanation(headline="", details=[]),
        legs=[
            Leg(
                id=f"{id_}-leg1",
                type="SUBWAY",
                line="U1",
                fromStop=StopPoint(name="A", lat=48.2, lon=16.3, scheduledTime=departure.isoformat()),
                toStop=StopPoint(name="B", lat=48.21, lon=16.35, scheduledTime=arrival.isoformat()),
                startTime=departure.isoformat(),
                endTime=arrival.isoformat(),
                durationSeconds=int((arrival - departure).total_seconds()),
                realtimeStatus="ON_TIME",
                delayMinutes=0
            )
        ]
    )

def test_earlier_arrival_wins_despite_more_transfers():
    now = datetime(2026, 9, 24, 15, 0, 0)
    
    # Journey A: 2 Umstiege, aber Ankunft um 15:35
    journey_a = make_dummy_journey("journey-a", now, now + timedelta(minutes=35), transfers=2)
    
    # Journey B: 0 Umstiege (direkt), aber Ankunft um 15:45 (z.B. wegen Verspätung)
    journey_b = make_dummy_journey("journey-b", now, now + timedelta(minutes=45), transfers=0)

    ranked = RankingEngine.rank_journeys([journey_b, journey_a])

    # Gemäß §6 & §18 MUSS journey_a auf Platz 1 und als EMPFOHLEN eingestuft werden
    assert ranked[0].id == "journey-a"
    assert ranked[0].recommended is True
    assert ranked[0].categoryTag == "EMPFOHLEN"

    # journey_b ist die langsamere Direktalternative
    assert ranked[1].id == "journey-b"
    assert ranked[1].recommended is False
    assert ranked[1].categoryTag == "DIREKTER"

def test_cost_function_formula_exactness():
    now = datetime(2026, 9, 24, 15, 0, 0)
    dep = now
    arr = now + timedelta(minutes=30)
    
    journey = make_dummy_journey("journey-cost-test", dep, arr, transfers=1)
    
    alpha = 1.5
    beta = 2.0
    gamma = 0.5
    
    cost, breakdown, rel_pct = RankingEngine.calculate_cost(journey, alpha, beta, gamma)
    
    # Formel: cost = ETA + alpha * transfer + beta * missed + gamma * disruption
    expected_cost = round(
        breakdown.etaSeconds
        + (alpha * breakdown.transferPenalty)
        + (beta * breakdown.missedConnectionRisk)
        + (gamma * breakdown.disruptionRisk),
        2
    )
    
    assert cost == expected_cost
    assert breakdown.alpha == 1.5
    assert breakdown.beta == 2.0
    assert breakdown.gamma == 0.5
    assert rel_pct >= 90

def test_transfer_averse_rider_flips_ranking_with_high_alpha():
    now = datetime(2026, 9, 24, 15, 0, 0)
    
    # Journey Fast: 2 Umstiege, 30 Min Dauer
    j_fast = make_dummy_journey("j-fast", now, now + timedelta(minutes=30), transfers=2)
    # Journey Direct: 0 Umstiege, 36 Min Dauer (nur 6 Min langsamer)
    j_direct = make_dummy_journey("j-direct", now, now + timedelta(minutes=36), transfers=0)
    
    # Bei Standard alpha=1.0 gewinnt j_fast (30m + 2x3m = 36m vs 36m + tie breaker)
    ranked_default = RankingEngine.rank_journeys([j_direct, j_fast], alpha=1.0)
    assert ranked_default[0].id == "j-fast"
    
    # Bei starker Transferaversion (alpha=3.0) gewinnt die Direktverbindung:
    # j_fast = 1800s + (3 * 360s) = 2880s
    # j_direct = 2160s + 0 = 2160s -> j_direct gewinnt deutlich!
    ranked_transfer_averse = RankingEngine.rank_journeys([j_direct, j_fast], alpha=3.0)
    assert ranked_transfer_averse[0].id == "j-direct"
    assert ranked_transfer_averse[0].categoryTag == "EMPFOHLEN"

def test_missed_connection_probability_calculation():
    # S7: Mean 0.8m, Std 1.3m
    # Bei 10 Minuten Puffer sollte das Risiko verpasster Anschlüsse sehr gering sein (< 1%)
    p_safe = PunctualityPerformanceService.calculate_missed_connection_probability("S7", "TRAIN", buffer_seconds=600)
    assert p_safe <= 0.01
    
    # Bei 1 Minute (60s) Puffer sollte das Risiko signifikant steigen (> 30%)
    p_tight = PunctualityPerformanceService.calculate_missed_connection_probability("S7", "TRAIN", buffer_seconds=60)
    assert p_tight > 0.30
    
    # Risiko-Strafe steigt entsprechend
    risk_safe = PunctualityPerformanceService.calculate_missed_connection_risk("S7", "TRAIN", buffer_seconds=600)
    risk_tight = PunctualityPerformanceService.calculate_missed_connection_risk("S7", "TRAIN", buffer_seconds=60)
    assert risk_tight > risk_safe * 10
