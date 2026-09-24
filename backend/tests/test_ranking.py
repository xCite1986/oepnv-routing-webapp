from datetime import datetime, timedelta
from app.schemas.journey import Journey, Leg, StopPoint, JourneyExplanation
from app.services.ranking.ranking_engine import RankingEngine

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
