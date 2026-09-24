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
async def test_incidents_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/incidents")
        assert response.status_code == 200
        incidents = response.json()
        assert len(incidents) > 0
