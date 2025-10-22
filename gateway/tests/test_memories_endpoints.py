from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from gateway.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as api_client:
        yield api_client


def test_search_memories_returns_ranked_hits(client: TestClient) -> None:
    payload = {"query": "schema", "limit": 2}
    response = client.post("/memories/search", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert "results" in data
    results = data["results"]
    assert len(results) == 1
    top_hit = results[0]
    assert top_hit["memory"]["memory_id"] == "mem_001"
    assert top_hit["memory"]["memory_type"] == "semantic"
    assert top_hit["score"] >= 0.5


def test_retrieve_for_task_honors_branch_filter(client: TestClient) -> None:
    payload = {"task": "Review evaluation process", "branch": "quality", "limit": 5}
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


def test_search_applies_limit(client: TestClient) -> None:
    payload = {"query": "requirements ranking", "limit": 2}
    response = client.post("/memories/search", json=payload)

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 2
