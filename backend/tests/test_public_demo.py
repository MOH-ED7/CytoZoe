import importlib.util
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app import config


def test_public_demo_is_read_only_with_existing_science(loaded_client, monkeypatch):
    monkeypatch.setenv("CYTOZOE_PUBLIC_READ_ONLY", "1")
    monkeypatch.setenv("CYTOZOE_ALLOWED_HOSTS", "demo.example.org,healthcheck.railway.app")
    from app.public_demo import create_public_app
    with TestClient(create_public_app(), base_url="https://demo.example.org") as client:
        assert client.get("/api/readyz").status_code == 200
        assert client.get("/api/participants").json() == loaded_client.get("/api/participants").json()
        for verb, path in [("POST", "/api/reviews"), ("PATCH", "/api/reviews/anything"),
                           ("DELETE", "/api/reviews/anything"), ("POST", "/api/import")]:
            result = client.request(verb, path, json={})
            assert result.status_code == 403
            assert result.json()["code"] == "PUBLIC_DEMO_READ_ONLY"
        ev = "osd575-cmp:C001_serum_L-3:creatinine"
        assert client.post("/api/explain", json={"evidence_id": ev, "question_id": "HOW_CALCULATED"}).status_code == 200
        assert client.get("/api/export?format=json").status_code == 200
        assert client.get("/api/healthz", headers={"host": "untrusted.example"}).status_code == 400
        assert client.get("/api/healthz", headers={"host": "healthcheck.railway.app"}).status_code == 200


def test_public_mode_requires_explicit_opt_in(monkeypatch):
    monkeypatch.delenv("CYTOZOE_PUBLIC_READ_ONLY", raising=False)
    from app.public_demo import create_public_app
    with pytest.raises(RuntimeError):
        create_public_app()


def test_startup_refuses_ephemeral_storage(monkeypatch):
    spec = importlib.util.spec_from_file_location("railway_start", config.ROOT / "scripts/railway_start.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    monkeypatch.delenv("RAILWAY_VOLUME_MOUNT_PATH", raising=False)
    with pytest.raises(RuntimeError, match="persistent volume"):
        mod.prepare_environment()
