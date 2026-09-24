import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_admin_feeds_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/admin/feeds")
        assert res.status_code == 200
        feeds = res.json()
        assert len(feeds) >= 2
        # Verify Wiener Linien and ÖBB feeds are present
        feed_ids = [f["id"] for f in feeds]
        assert "WIENER_LINIEN" in feed_ids
        assert "OEBB" in feed_ids

@pytest.mark.asyncio
async def test_admin_sync_feed():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/admin/feeds/WIENER_LINIEN/sync")
        assert res.status_code == 200
        result = res.json()
        assert result["success"] is True
        assert result["feedId"] == "WIENER_LINIEN"
        assert result["importedStops"] > 0

@pytest.mark.asyncio
async def test_admin_api_checks():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/admin/api-checks")
        assert res.status_code == 200
        checks_data = res.json()
        assert "overallStatus" in checks_data
        assert "checks" in checks_data
        assert len(checks_data["checks"]) >= 3

@pytest.mark.asyncio
async def test_admin_known_stations():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/admin/known-stations")
        assert res.status_code == 200
        data = res.json()
        assert "wienerLinienRbls" in data
        assert "oebbStations" in data

@pytest.mark.asyncio
async def test_admin_config_get_and_post():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/admin/config")
        assert res.status_code == 200
        cfg = res.json()
        assert "projectName" in cfg

        # Test POST
        res_post = await client.post("/api/v1/admin/config", json={"realtimeEnabled": True})
        assert res_post.status_code == 200
        assert res_post.json()["success"] is True

@pytest.mark.asyncio
async def test_admin_train_performance():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/admin/train-performance")
        assert res.status_code == 200
        data = res.json()
        assert "dataset" in data
        assert "metrics" in data
        assert len(data["metrics"]) > 5
        # Check that S7 and REX are present
        lines = [m["line"] for m in data["metrics"]]
        assert "S7" in lines
        assert "REX 1" in lines

@pytest.mark.asyncio
async def test_admin_cost_config():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/admin/cost-config")
        assert res.status_code == 200
        cfg = res.json()
        assert "alpha" in cfg
        assert "beta" in cfg
        assert "gamma" in cfg
        assert "formula" in cfg

        # Test updating cost config
        res_update = await client.post("/api/v1/admin/cost-config", json={"alpha": 1.25, "beta": 1.5})
        assert res_update.status_code == 200
        updated = res_update.json()
        assert updated["success"] is True
        assert updated["config"]["alpha"] == 1.25
        assert updated["config"]["beta"] == 1.5

@pytest.mark.asyncio
async def test_admin_simulate_transfer_risk():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/admin/train-performance/simulate", json={
            "line": "S7",
            "legType": "TRAIN",
            "bufferMinutes": 4.0
        })
        assert res.status_code == 200
        sim = res.json()
        assert sim["line"] == "S7"
        assert "missedConnectionProbability" in sim
        assert "connectionReliabilityPercent" in sim
        assert "riskPenaltySeconds" in sim

