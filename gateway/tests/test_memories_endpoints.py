from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from gateway.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as api_client:
        yield api_client


def test_search_memories_returns_ranked_hits(client: TestClient) -> None:
    payload = {"query": "registration", "limit": 2}
    response = client.post("/memories/search", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert "results" in data
    results = data["results"]
    assert len(results) == 1
    top_hit = results[0]
    assert top_hit["memory"]["memory_id"] == "mem_001"
    assert top_hit["score"] == pytest.approx(0.935, rel=1e-3)
    assert top_hit["memory"]["branch"] == "identity/vehicle"
    assert top_hit["memory"]["memory_type"] == "identity"
    assert top_hit["score"] >= 0.5


def test_retrieve_for_task_honors_branch_filter(client: TestClient) -> None:
    payload = {"task": "Plan reconnaissance debrief", "branch": "travel", "limit": 5}
    response = client.post("/memories/retrieve_for_task", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert data["task"] == payload["task"]
    context = data["context"]
    assert "procedural" in context
    procedural_group = context["procedural"]
    hits = procedural_group["hits"]
    assert len(hits) == 1
    memory = hits[0]["memory"]
    assert memory["branch"] == "quality/checklists"
    assert memory["memory_type"] == "procedural"
    assert hits[0]["score"] >= 0.3

    provenance_entries = data["provenance"]
    assert provenance_entries
    assert any(entry["memory_id"] == memory["memory_id"] for entry in provenance_entries)
    assert contexts[0]["score"] == pytest.approx(0.74, rel=1e-3)
    assert memory["branch"] == "travel/normandy"
    assert memory["title"] == "Normandy travel log"
    assert contexts[0]["score"] >= 0.3


def test_search_applies_limit(client: TestClient) -> None:
    payload = {"query": "travel workflow", "limit": 2}
    response = client.post("/memories/search", json=payload)

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 2
