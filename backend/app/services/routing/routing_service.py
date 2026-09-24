from datetime import datetime, timedelta
from typing import List
from ...schemas.journey import (
    JourneySearchRequest,
    JourneySearchResponse,
    Journey,
    Leg,
    StopPoint,
    TransferInfo,
    IntermediateStop,
    JourneyExplanation,
)
from ..ranking.ranking_engine import RankingEngine
from ..explanations.explanation_engine import ExplanationEngine
from ..realtime.realtime_adapter import RealtimeAdapter
from ..realtime.oebb_api import OebbApiClient
from ..otp.otp_client import OtpClient
from ..analytics.punctuality_service import PunctualityPerformanceService

class RoutingService:
    """
    Hauptdienst für ÖPNV-Routing (§18).
    Orchestrierung: ÖBB HAFAS / OTP -> Zug-Performance / Pünktlichkeit -> Ranking nach Kostenfunktion -> Explanation Engine.
    """

    @classmethod
    async def find_journeys(cls, request: JourneySearchRequest) -> JourneySearchResponse:
        # 1. Erkennung des didaktischen Demo-Szenarios (Stephansplatz -> Flughafen Wien mit Verspätung)
        from_lbl = (request.from_.label or "").lower()
        to_lbl = (request.to.label or "").lower()
        is_stephansplatz_to_airport = (
            ("stephansplatz" in from_lbl or "stephansdom" in from_lbl) and
            ("flughafen" in to_lbl or "schwechat" in to_lbl)
        )

        candidates = None

        # 2. Wenn es NICHT das statische Demo-Szenario ist:
        # Echte Verbindungssuche über das ÖBB HAFAS/Scotty Gateway (für ganz Österreich & Wien)
        if not is_stephansplatz_to_airport:
            try:
                candidates = await OebbApiClient.plan_trips(request)
            except Exception:
                candidates = None

        # 3. Falls OTP Kandidaten liefert
        if not candidates or len(candidates) == 0:
            otp_candidates = await OtpClient.plan_trip(request)
            if otp_candidates:
                candidates = otp_candidates

        # 4. Fallback-Engine (nur falls externe Gateways offline sind)
        if not candidates or len(candidates) == 0:
            if is_stephansplatz_to_airport:
                candidates = cls._generate_vienna_candidates(request)
            else:
                candidates = cls._generate_plausible_fallback_candidates(request)

        # 3. Zug-Performance & Pünktlichkeit anwenden (piebro/deutsche-bahn-data & ÖBB)
        for journey in candidates:
            for leg in journey.legs:
                if leg.type != "WALK":
                    metric = PunctualityPerformanceService.get_metric(leg.line, leg.type)
                    leg.punctualityPercent = metric.punctualityRatePct
                    leg.expectedDelayMinutes = metric.meanDelayMinutes
                    if not leg.delayMinutes and metric.meanDelayMinutes > 0:
                        try:
                            sched_start = datetime.fromisoformat(leg.startTime.replace("Z", "+00:00"))
                            sched_end = datetime.fromisoformat(leg.endTime.replace("Z", "+00:00"))
                            delay_delta = timedelta(minutes=metric.meanDelayMinutes)
                            leg.fromStop.estimatedTime = (sched_start + delay_delta).isoformat()
                            leg.toStop.estimatedTime = (sched_end + delay_delta).isoformat()
                        except Exception:
                            pass

        # 4. Ranking nach Kostenfunktion (§18):
        # cost = ETA + (alpha * transfer_penalty) + (beta * missed_connection_risk) + (gamma * disruption_risk)
        pref = request.preferences
        alpha = pref.alpha if pref and pref.alpha is not None else None
        beta = pref.beta if pref and pref.beta is not None else None
        gamma = pref.gamma if pref and pref.gamma is not None else None

        # Berücksichtigung des Geschwindigkeitsprofils (Langsam / Normal / Schnell)
        if pref and pref.transferSpeed == "SLOW":
            alpha = (alpha if alpha is not None else 1.0) * 1.5
            beta = (beta if beta is not None else 1.0) * 1.6
        elif pref and pref.transferSpeed == "FAST":
            alpha = (alpha if alpha is not None else 1.0) * 0.7
            beta = (beta if beta is not None else 1.0) * 0.6

        ranked = RankingEngine.rank_journeys(candidates, alpha=alpha, beta=beta, gamma=gamma)

        # 4. Regelbasierte Erklärungen für Top-Route & Alternativen generieren (§19)
        _, final_journeys = ExplanationEngine.generate_explanations(ranked)

        # 5. Response zusammenstellen
        rec_id = final_journeys[0].id if final_journeys else "none"
        incidents = RealtimeAdapter.get_active_incidents()
        disruption_summary = (
            f"Echtzeitmeldung: {incidents[0].title} – {incidents[0].description}"
            if incidents
            else None
        )

        return JourneySearchResponse(
            generatedAt=datetime.now().isoformat(),
            recommendedJourneyId=rec_id,
            journeys=final_journeys,
            realtimeActive=True,
            disruptionSummary=disruption_summary,
        )

    @classmethod
    def _generate_vienna_candidates(cls, req: JourneySearchRequest) -> List[Journey]:
        """
        Erzeugt plausible Kandidaten für Wien (z.B. Stephansplatz -> Flughafen Wien
        oder beliebige andere Relationen), inklusive der geforderten Verspätungskonstellation.
        """
        try:
            dep_time = datetime.fromisoformat(req.dateTime.replace("Z", "+00:00"))
        except Exception:
            dep_time = datetime.now()

        def add_min(dt: datetime, m: int) -> datetime:
            return dt + timedelta(minutes=m)

        def iso(dt: datetime) -> str:
            return dt.isoformat()

        origin_name = req.from_.label
        dest_name = req.to.label

        # Kandidat 1: EMPFOHLEN (U1 + S7 via Praterstern)
        # Dauer: 39 Min.
        # Vorteil: Pünktlich, 8 Min schneller als Direktalternative trotz 2 Umstiegen!
        arr1 = add_min(dep_time, 39)
        journey1 = Journey(
            id="journey-rec-u1-s7",
            recommended=True,
            categoryTag="EMPFOHLEN",
            tagLabel="EMPFOHLEN",
            departureTime=iso(dep_time),
            arrivalTime=iso(arr1),
            durationSeconds=39 * 60,
            walkingSeconds=6 * 60,
            walkingMeters=400,
            transferCount=2,
            realtime=True,
            totalDelayMinutes=0,
            explanation=JourneyExplanation(
                headline="Aktuell schnellste Verbindung",
                details=[]
            ),
            legs=[
                Leg(
                    id="leg-1-1",
                    type="WALK",
                    fromStop=StopPoint(name=origin_name, lat=req.from_.lat, lon=req.from_.lon, scheduledTime=iso(dep_time)),
                    toStop=StopPoint(name="Stephansplatz U", lat=48.20849, lon=16.37208, scheduledTime=iso(add_min(dep_time, 4))),
                    startTime=iso(dep_time),
                    endTime=iso(add_min(dep_time, 4)),
                    durationSeconds=4 * 60,
                    distanceMeters=280,
                    realtimeStatus="ON_TIME",
                    delayMinutes=0,
                    coordinates=[[req.from_.lon, req.from_.lat], [16.37208, 48.20849]]
                ),
                Leg(
                    id="leg-1-2",
                    type="SUBWAY",
                    line="U1",
                    headsign="Leopoldau",
                    color="#e2001a",
                    fromStop=StopPoint(name="Stephansplatz U", lat=48.20849, lon=16.37208, platform="Gleis 1", scheduledTime=iso(add_min(dep_time, 4))),
                    toStop=StopPoint(name="Praterstern U", lat=48.21780, lon=16.39170, platform="Gleis 1", scheduledTime=iso(add_min(dep_time, 10))),
                    startTime=iso(add_min(dep_time, 4)),
                    endTime=iso(add_min(dep_time, 10)),
                    durationSeconds=6 * 60,
                    stopsCount=3,
                    intermediateStops=[
                        IntermediateStop(name="Schwedenplatz", scheduledTime=iso(add_min(dep_time, 6)), delayMinutes=0),
                        IntermediateStop(name="Nestroyplatz", scheduledTime=iso(add_min(dep_time, 8)), delayMinutes=0),
                    ],
                    realtimeStatus="ON_TIME",
                    delayMinutes=0,
                    coordinates=[[16.37208, 48.20849], [16.37750, 48.21140], [16.39170, 48.21780]]
                ),
                Leg(
                    id="leg-1-3",
                    type="WALK",
                    fromStop=StopPoint(name="Praterstern U", lat=48.21780, lon=16.39170, scheduledTime=iso(add_min(dep_time, 10))),
                    toStop=StopPoint(name="Praterstern S-Bahn", lat=48.21810, lon=16.39220, platform="Bahnsteig 1/2", scheduledTime=iso(add_min(dep_time, 13))),
                    startTime=iso(add_min(dep_time, 10)),
                    endTime=iso(add_min(dep_time, 13)),
                    durationSeconds=3 * 60,
                    distanceMeters=180,
                    realtimeStatus="ON_TIME",
                    delayMinutes=0,
                    transferInfo=TransferInfo(
                        stationName="Praterstern",
                        durationSeconds=180,
                        walkingMeters=180,
                        difficulty="RELAXED",
                        difficultyLabel="Entspannter Umstieg",
                        bufferMinutes=3
                    ),
                    coordinates=[[16.39170, 48.21780], [16.39220, 48.21810]]
                ),
                Leg(
                    id="leg-1-4",
                    type="TRAIN",
                    line="S7",
                    headsign="Flughafen Wien / Wolfsthal",
                    color="#0284c7",
                    fromStop=StopPoint(name="Praterstern S-Bahn", lat=48.21810, lon=16.39220, platform="Bahnsteig 2", scheduledTime=iso(add_min(dep_time, 13))),
                    toStop=StopPoint(name=dest_name, lat=req.to.lat, lon=req.to.lon, platform="Bahnsteig 1", scheduledTime=iso(add_min(dep_time, 37))),
                    startTime=iso(add_min(dep_time, 13)),
                    endTime=iso(add_min(dep_time, 37)),
                    durationSeconds=24 * 60,
                    stopsCount=7,
                    intermediateStops=[
                        IntermediateStop(name="Wien Rennweg", scheduledTime=iso(add_min(dep_time, 18))),
                        IntermediateStop(name="Wien St. Marx", scheduledTime=iso(add_min(dep_time, 21))),
                        IntermediateStop(name="Wien Geiselbergstraße", scheduledTime=iso(add_min(dep_time, 23))),
                        IntermediateStop(name="Wien Zentralfriedhof", scheduledTime=iso(add_min(dep_time, 26))),
                        IntermediateStop(name="Kaiserebersdorf", scheduledTime=iso(add_min(dep_time, 29))),
                        IntermediateStop(name="Schwechat", scheduledTime=iso(add_min(dep_time, 32))),
                        IntermediateStop(name="Mannswörth", scheduledTime=iso(add_min(dep_time, 35))),
                    ],
                    realtimeStatus="ON_TIME",
                    delayMinutes=0,
                    coordinates=[[16.39220, 48.21810], [16.38550, 48.20630], [req.to.lon, req.to.lat]]
                ),
                Leg(
                    id="leg-1-5",
                    type="WALK",
                    fromStop=StopPoint(name="Flughafen Wien Bahnhof", lat=req.to.lat, lon=req.to.lon, scheduledTime=iso(add_min(dep_time, 37))),
                    toStop=StopPoint(name=dest_name, lat=req.to.lat, lon=req.to.lon, scheduledTime=iso(arr1)),
                    startTime=iso(add_min(dep_time, 37)),
                    endTime=iso(arr1),
                    durationSeconds=2 * 60,
                    distanceMeters=120,
                    realtimeStatus="ON_TIME",
                    delayMinutes=0,
                    coordinates=[[req.to.lon, req.to.lat], [req.to.lon, req.to.lat]]
                )
            ]
        )

        # Kandidat 2: DIREKTER (Wien Mitte Direktverbindung)
        # Fahrplanmäßig 36 Min, aber aktuell +11 Min Verspätung -> Ankunft in 47 Min!
        arr2 = add_min(dep_time, 47)
        journey2 = Journey(
            id="journey-alt-direkt-wienmitte",
            recommended=False,
            categoryTag="DIREKTER",
            tagLabel="DIREKTER",
            departureTime=iso(dep_time),
            arrivalTime=iso(arr2),
            durationSeconds=47 * 60,
            walkingSeconds=9 * 60,
            walkingMeters=620,
            transferCount=0,
            realtime=True,
            totalDelayMinutes=11,
            hasDisruptions=True,
            explanation=JourneyExplanation(headline="Direkte Alternative", details=[]),
            legs=[
                Leg(
                    id="leg-2-1",
                    type="WALK",
                    fromStop=StopPoint(name=origin_name, lat=req.from_.lat, lon=req.from_.lon, scheduledTime=iso(dep_time)),
                    toStop=StopPoint(name="Wien Mitte Landstraße", lat=48.20630, lon=16.38550, scheduledTime=iso(add_min(dep_time, 9))),
                    startTime=iso(dep_time),
                    endTime=iso(add_min(dep_time, 9)),
                    durationSeconds=9 * 60,
                    distanceMeters=620,
                    realtimeStatus="ON_TIME",
                    delayMinutes=0,
                    coordinates=[[req.from_.lon, req.from_.lat], [16.38550, 48.20630]]
                ),
                Leg(
                    id="leg-2-2",
                    type="TRAIN",
                    line="S7",
                    headsign="Flughafen Wien",
                    color="#0284c7",
                    fromStop=StopPoint(name="Wien Mitte Landstraße", lat=48.20630, lon=16.38550, platform="Gleis 1", scheduledTime=iso(add_min(dep_time, 9)), delayMinutes=11),
                    toStop=StopPoint(name=dest_name, lat=req.to.lat, lon=req.to.lon, platform="Gleis 2", scheduledTime=iso(add_min(dep_time, 36)), estimatedTime=iso(arr2), delayMinutes=11),
                    startTime=iso(add_min(dep_time, 9)),
                    endTime=iso(arr2),
                    durationSeconds=38 * 60,
                    stopsCount=6,
                    realtimeStatus="DELAYED",
                    delayMinutes=11,
                    disruptionNotice="Weichenstörung Rennweg: Verzögerung von ca. 11 Min.",
                    coordinates=[[16.38550, 48.20630], [req.to.lon, req.to.lat]]
                )
            ]
        )

        # Kandidat 3: WENIGER ZU FUSS (U3 + REX 7)
        # 51 Min
        dep3 = add_min(dep_time, 2)
        arr3 = add_min(dep3, 49)
        journey3 = Journey(
            id="journey-alt-less-walk",
            recommended=False,
            categoryTag="WENIGER_FUSSWEG",
            tagLabel="WENIGER ZU FUSS",
            departureTime=iso(dep3),
            arrivalTime=iso(arr3),
            durationSeconds=49 * 60,
            walkingSeconds=4 * 60,
            walkingMeters=230,
            transferCount=1,
            realtime=True,
            totalDelayMinutes=0,
            explanation=JourneyExplanation(headline="Alternative mit minimalem Fußweg", details=[]),
            legs=[
                Leg(
                    id="leg-3-1",
                    type="WALK",
                    fromStop=StopPoint(name=origin_name, lat=req.from_.lat, lon=req.from_.lon, scheduledTime=iso(dep3)),
                    toStop=StopPoint(name="Stephansplatz U", lat=48.20849, lon=16.37208, scheduledTime=iso(add_min(dep3, 1))),
                    startTime=iso(dep3),
                    endTime=iso(add_min(dep3, 1)),
                    durationSeconds=1 * 60,
                    distanceMeters=80,
                    realtimeStatus="ON_TIME",
                    delayMinutes=0,
                ),
                Leg(
                    id="leg-3-2",
                    type="SUBWAY",
                    line="U3",
                    headsign="Simmering",
                    color="#ea580c",
                    fromStop=StopPoint(name="Stephansplatz U", lat=48.20849, lon=16.37208, scheduledTime=iso(add_min(dep3, 1))),
                    toStop=StopPoint(name="Landstraße / Wien Mitte", lat=48.20630, lon=16.38550, scheduledTime=iso(add_min(dep3, 4))),
                    startTime=iso(add_min(dep3, 1)),
                    endTime=iso(add_min(dep3, 4)),
                    durationSeconds=3 * 60,
                    stopsCount=2,
                    realtimeStatus="ON_TIME",
                    delayMinutes=0,
                ),
                Leg(
                    id="leg-3-3",
                    type="WALK",
                    fromStop=StopPoint(name="Landstraße U3", lat=48.20630, lon=16.38550, scheduledTime=iso(add_min(dep3, 4))),
                    toStop=StopPoint(name="Wien Mitte S-Bahn", lat=48.20630, lon=16.38550, platform="Bahnsteig 1", scheduledTime=iso(add_min(dep3, 16))),
                    startTime=iso(add_min(dep3, 4)),
                    endTime=iso(add_min(dep3, 16)),
                    durationSeconds=12 * 60,
                    distanceMeters=100,
                    realtimeStatus="ON_TIME",
                    delayMinutes=0,
                    transferInfo=TransferInfo(
                        stationName="Wien Mitte",
                        durationSeconds=12 * 60,
                        walkingMeters=100,
                        difficulty="RELAXED",
                        difficultyLabel="Entspannter Umstieg (12 min Wartezeit)",
                        bufferMinutes=10
                    )
                ),
                Leg(
                    id="leg-3-4",
                    type="REGIONAL_TRAIN",
                    line="REX 7",
                    headsign="Wolfsthal",
                    color="#004b9b",
                    fromStop=StopPoint(name="Wien Mitte", lat=48.20630, lon=16.38550, platform="Bahnsteig 1", scheduledTime=iso(add_min(dep3, 16))),
                    toStop=StopPoint(name=dest_name, lat=req.to.lat, lon=req.to.lon, scheduledTime=iso(add_min(dep3, 47))),
                    startTime=iso(add_min(dep3, 16)),
                    endTime=iso(add_min(dep3, 47)),
                    durationSeconds=31 * 60,
                    stopsCount=4,
                    realtimeStatus="ON_TIME",
                    delayMinutes=0,
                ),
                Leg(
                    id="leg-3-5",
                    type="WALK",
                    fromStop=StopPoint(name="Flughafen Wien", lat=req.to.lat, lon=req.to.lon, scheduledTime=iso(add_min(dep3, 47))),
                    toStop=StopPoint(name=dest_name, lat=req.to.lat, lon=req.to.lon, scheduledTime=iso(arr3)),
                    startTime=iso(add_min(dep3, 47)),
                    endTime=iso(arr3),
                    durationSeconds=2 * 60,
                    distanceMeters=50,
                    realtimeStatus="ON_TIME",
                    delayMinutes=0,
                )
            ]
        )

        return [journey1, journey2, journey3]

    @classmethod
    def _generate_plausible_fallback_candidates(cls, req: JourneySearchRequest) -> List[Journey]:
        """
        Plausibler Fallback für beliebige Relationen abseits der Stephansplatz-Demo,
        falls externe Gateways nicht erreichbar sind. Berechnet reale Distanzen und
        realistische Reisezeiten.
        """
        import math
        lat1, lon1 = req.from_.lat, req.from_.lon
        lat2, lon2 = req.to.lat, req.to.lon
        r = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        dist_km = max(1.0, r * c)

        try:
            dep_time = datetime.fromisoformat(req.dateTime.replace("Z", "+00:00"))
        except Exception:
            dep_time = datetime.now()

        def add_min(dt: datetime, m: int) -> datetime:
            return dt + timedelta(minutes=m)

        def iso(dt: datetime) -> str:
            return dt.isoformat()

        origin_name = req.from_.label
        dest_name = req.to.label

        if dist_km > 50:
            # Fernverkehr (z.B. Wien -> Salzburg ca. 2h 25m auf Weststrecke)
            rj_min = max(60, int(dist_km / 115.0 * 60))
            total_dur_min = rj_min + 35
            arr1 = add_min(dep_time, total_dur_min)

            journey1 = Journey(
                id="journey-fallback-rjx",
                recommended=True,
                categoryTag="EMPFOHLEN",
                tagLabel="EMPFOHLEN",
                departureTime=iso(dep_time),
                arrivalTime=iso(arr1),
                durationSeconds=total_dur_min * 60,
                walkingSeconds=8 * 60,
                walkingMeters=500,
                transferCount=2,
                realtime=True,
                totalDelayMinutes=0,
                explanation=JourneyExplanation(
                    headline="Beste Fernverkehrsverbindung",
                    details=[
                        f"Direkter Fernverkehr nach {dest_name}.",
                        "Umstieg am Hauptbahnhof mit gesichertem Taktanschluss."
                    ]
                ),
                legs=[
                    Leg(
                        id="fb-leg-1",
                        type="WALK",
                        fromStop=StopPoint(name=origin_name, lat=lat1, lon=lon1, scheduledTime=iso(dep_time)),
                        toStop=StopPoint(name="Nächste Nahverkehrsstation", lat=lat1, lon=lon1, scheduledTime=iso(add_min(dep_time, 5))),
                        startTime=iso(dep_time),
                        endTime=iso(add_min(dep_time, 5)),
                        durationSeconds=5 * 60,
                        distanceMeters=350,
                        coordinates=[[lon1, lat1], [lon1, lat1]]
                    ),
                    Leg(
                        id="fb-leg-2",
                        type="SUBWAY",
                        line="U-Bahn",
                        fromStop=StopPoint(name="Nächste Nahverkehrsstation", lat=lat1, lon=lon1, scheduledTime=iso(add_min(dep_time, 5))),
                        toStop=StopPoint(name="Wien Hauptbahnhof", lat=48.1852, lon=16.3764, scheduledTime=iso(add_min(dep_time, 25))),
                        startTime=iso(add_min(dep_time, 5)),
                        endTime=iso(add_min(dep_time, 25)),
                        durationSeconds=20 * 60,
                        stopsCount=5,
                        coordinates=[[lon1, lat1], [16.3764, 48.1852]]
                    ),
                    Leg(
                        id="fb-leg-3",
                        type="TRAIN",
                        line="RJX",
                        headsign=dest_name,
                        color="#b91c1c",
                        fromStop=StopPoint(name="Wien Hauptbahnhof", lat=48.1852, lon=16.3764, platform="Bahnsteig 7", scheduledTime=iso(add_min(dep_time, 35))),
                        toStop=StopPoint(name=dest_name, lat=lat2, lon=lon2, platform="Bahnsteig 2", scheduledTime=iso(arr1)),
                        startTime=iso(add_min(dep_time, 35)),
                        endTime=iso(arr1),
                        durationSeconds=rj_min * 60,
                        stopsCount=6,
                        transferInfo=TransferInfo(
                            stationName="Wien Hauptbahnhof",
                            durationSeconds=10 * 60,
                            walkingMeters=150,
                            difficulty="RELAXED",
                            difficultyLabel="Sicherer Umstieg",
                            bufferMinutes=10
                        ),
                        coordinates=[[16.3764, 48.1852], [lon2, lat2]]
                    )
                ]
            )
            return [journey1]
        else:
            # Nahbereich
            dur_min = max(10, int(dist_km * 3.5) + 10)
            arr1 = add_min(dep_time, dur_min)
            journey1 = Journey(
                id="journey-fallback-local",
                recommended=True,
                categoryTag="EMPFOHLEN",
                tagLabel="EMPFOHLEN",
                departureTime=iso(dep_time),
                arrivalTime=iso(arr1),
                durationSeconds=dur_min * 60,
                walkingSeconds=6 * 60,
                walkingMeters=400,
                transferCount=1,
                realtime=True,
                totalDelayMinutes=0,
                explanation=JourneyExplanation(
                    headline="Städtische Nahverkehrsverbindung",
                    details=[f"Verbindung von {origin_name} nach {dest_name}."]
                ),
                legs=[
                    Leg(
                        id="fb-loc-1",
                        type="WALK",
                        fromStop=StopPoint(name=origin_name, lat=lat1, lon=lon1, scheduledTime=iso(dep_time)),
                        toStop=StopPoint(name="Haltestelle", lat=lat1, lon=lon1, scheduledTime=iso(add_min(dep_time, 4))),
                        startTime=iso(dep_time),
                        endTime=iso(add_min(dep_time, 4)),
                        durationSeconds=4 * 60,
                        distanceMeters=250,
                        coordinates=[[lon1, lat1], [lon1, lat1]]
                    ),
                    Leg(
                        id="fb-loc-2",
                        type="BUS",
                        line="Bus / Bim",
                        headsign=dest_name,
                        color="#475569",
                        fromStop=StopPoint(name="Haltestelle", lat=lat1, lon=lon1, scheduledTime=iso(add_min(dep_time, 4))),
                        toStop=StopPoint(name=dest_name, lat=lat2, lon=lon2, scheduledTime=iso(arr1)),
                        startTime=iso(add_min(dep_time, 4)),
                        endTime=iso(arr1),
                        durationSeconds=(dur_min - 4) * 60,
                        coordinates=[[lon1, lat1], [lon2, lat2]]
                    )
                ]
            )
            return [journey1]
