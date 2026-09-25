import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_locations_search():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/locations/search?q=Stephansplatz")
        assert response.status_code == 200
        results = response.json()
        assert len(results) > 0
        assert any("Stephansplatz" in loc["label"] for loc in results)

@pytest.mark.asyncio
async def test_locations_search_traisengasse():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/locations/search?q=Wien Traisengasse")
        assert response.status_code == 200
        results = response.json()
        assert len(results) > 0
        assert any("Traisengasse" in loc["label"] for loc in results)

@pytest.mark.asyncio
async def test_journeys_search():
    transport = ASGITransport(app=app)
    payload = {
        "from": {
            "lat": 48.20849,
            "lon": 16.37208,
            "label": "Stephansplatz, Wien"
        },
        "to": {
            "lat": 48.11030,
            "lon": 16.56970,
            "label": "Flughafen Wien (Schwechat)"
        },
        "dateTime": "2026-09-24T15:45:00+02:00",
        "timeMode": "DEPARTURE",
        "preferences": {
            "maxWalkingDistance": 1500,
            "maxTransfers": 6,
            "optimization": "FASTEST"
        }
    }
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/journeys/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "journeys" in data
        assert len(data["journeys"]) >= 3
        # Check that recommended journey exists
        rec = next((j for j in data["journeys"] if j["recommended"]), None)
        assert rec is not None
        assert rec["explanation"]["headline"] == "Aktuell schnellste Verbindung"
        assert len(rec["explanation"]["details"]) > 0

@pytest.mark.asyncio
async def test_journeys_search_with_transfer_speed_profiles():
    transport = ASGITransport(app=app)
    payload_slow = {
        "from": {"lat": 48.20849, "lon": 16.37208, "label": "Stephansplatz, Wien"},
        "to": {"lat": 48.1108, "lon": 16.569, "label": "Flughafen Wien (Schwechat)"},
        "dateTime": "2026-09-24T14:30:00",
        "timeMode": "DEPARTURE",
        "preferences": {
            "maxWalkingDistance": 1500,
            "transferSpeed": "SLOW"
        }
    }
    payload_fast = {
        "from": {"lat": 48.20849, "lon": 16.37208, "label": "Stephansplatz, Wien"},
        "to": {"lat": 48.1108, "lon": 16.569, "label": "Flughafen Wien (Schwechat)"},
        "dateTime": "2026-09-24T14:30:00",
        "timeMode": "DEPARTURE",
        "preferences": {
            "maxWalkingDistance": 1500,
            "transferSpeed": "FAST"
        }
    }
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_slow = await client.post("/api/v1/journeys/search", json=payload_slow)
        assert res_slow.status_code == 200
        data_slow = res_slow.json()
        assert len(data_slow["journeys"]) > 0

        res_fast = await client.post("/api/v1/journeys/search", json=payload_fast)
        assert res_fast.status_code == 200
        data_fast = res_fast.json()
        assert len(data_fast["journeys"]) > 0

@pytest.mark.asyncio
async def test_incidents_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/incidents")
        assert response.status_code == 200
        incidents = response.json()
        assert len(incidents) > 0

@pytest.mark.asyncio
async def test_journeys_search_egon_friedell_to_salzburg():
    transport = ASGITransport(app=app)
    payload = {
        "from": {
            "lat": 48.274006,
            "lon": 16.436416,
            "label": "Wien Egon-Friedell-Gasse"
        },
        "to": {
            "lat": 47.813057,
            "lon": 13.045856,
            "label": "Salzburg Hbf"
        },
        "dateTime": "2026-09-25T08:06:00",
        "timeMode": "DEPARTURE",
        "preferences": {
            "maxWalkingDistance": 1500,
            "transferSpeed": "SLOW"
        }
    }
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/journeys/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "journeys" in data
        assert len(data["journeys"]) > 0

        # Check that top journey has a realistic duration for Vienna -> Salzburg (> 2.5 hours)
        rec = data["journeys"][0]
        assert rec["durationSeconds"] >= 150 * 60  # At least 2.5 hours

        # Verify that S7 is NOT routed from Vienna directly to Salzburg in 38 minutes
        for j in data["journeys"]:
            for leg in j["legs"]:
                if leg.get("line") == "S7":
                    assert "Salzburg" not in leg["toStop"]["name"]

@pytest.mark.asyncio
async def test_journeys_search_eisenstadt_to_bregenz():
    transport = ASGITransport(app=app)
    payload = {
        "from": {
            "lat": 47.8447,
            "lon": 16.5335,
            "label": "Eisenstadt Bahnhof"
        },
        "to": {
            "lat": 47.5034,
            "lon": 9.7428,
            "label": "Bregenz Bahnhof"
        },
        "dateTime": "2026-09-25T11:21:00",
        "timeMode": "DEPARTURE"
    }
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/journeys/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "journeys" in data
        assert len(data["journeys"]) > 0

        # Nationwide trip Eisenstadt -> Bregenz must be at least 6.5 hours (> 23400s)
        rec = data["journeys"][0]
        assert rec["durationSeconds"] >= 23400
        assert "Eisenstadt" in rec["legs"][0]["fromStop"]["name"]
        assert "Bregenz" in rec["legs"][-1]["toStop"]["name"]

        # Ensure no Vienna subway U1 or S7 claims to reach Bregenz directly
        for j in data["journeys"]:
            for leg in j["legs"]:
                if leg.get("line") in ["U1", "U2", "U3", "U4", "U6", "S7"]:
                    assert "Bregenz" not in leg["toStop"]["name"]
