from __future__ import annotations

from typing import Dict, List, Tuple

from fastapi import APIRouter, Depends, Request

from ..schemas import (
    MemoryPayload,
    MemorySearchHit,
    MemorySearchRequest,
    MemorySearchResponse,
    MemoryTypeGroup,
    Provenance,
    RetrieveForTaskRequest,
    RetrieveForTaskResponse,
)
from ..store import InMemoryMemoryStore, MemoryRecord, MemoryType, ProvenanceEntry

router = APIRouter(prefix="/memories", tags=["memories"])


def get_store(request: Request) -> InMemoryMemoryStore:
    # TODO: Switch to dependency-injected Postgres/pgvector store with caching/JWT scopes.
    return request.app.state.store


@router.post("/search", response_model=MemorySearchResponse)
def search_memories(
    payload: MemorySearchRequest, store: InMemoryMemoryStore = Depends(get_store)
) -> MemorySearchResponse:
    ranked = store.search(payload.query, limit=payload.limit)
    return MemorySearchResponse(results=_format_hits(ranked))


@router.post("/retrieve_for_task", response_model=RetrieveForTaskResponse)
def retrieve_for_task(
    payload: RetrieveForTaskRequest, store: InMemoryMemoryStore = Depends(get_store)
) -> RetrieveForTaskResponse:
    grouped_ranked, provenance_payload = store.retrieve_for_task(
        payload.task, branch=payload.branch, limit=payload.limit
    )
    return RetrieveForTaskResponse(
        task=payload.task,
        context=_format_grouped_hits(grouped_ranked),
        provenance=_format_provenance(provenance_payload),
    )


def _format_hits(hits: List[Tuple[MemoryRecord, float]]) -> List[MemorySearchHit]:
    formatted: List[MemorySearchHit] = []
    for record, score in hits:
        formatted.append(
            MemorySearchHit(
                memory=MemoryPayload(
                    memory_id=record.memory_id,
                    title=record.title,
                    branch=record.branch,
                    content=record.content,
                    salience=record.salience,
                    memory_type=record.memory_type,
                ),
                score=score,
            )
        )
    return formatted


def _format_grouped_hits(
    grouped: Dict[MemoryType, List[Tuple[MemoryRecord, float]]]
) -> Dict[MemoryType, MemoryTypeGroup]:
    formatted: Dict[MemoryType, MemoryTypeGroup] = {}
    for memory_type, hits in grouped.items():
        formatted[memory_type] = MemoryTypeGroup(
            hits=_format_hits(hits),
            provenance=[
                Provenance(
                    memory_id=record.memory_id,
                    memory_type=record.memory_type,
                    detail=record.provenance,
                )
                for record, _ in hits
            ],
        )
    return formatted


def _format_provenance(entries: List[ProvenanceEntry]) -> List[Provenance]:
    formatted: List[Provenance] = []
    for entry in entries:
        formatted.append(
            Provenance(
                memory_id=entry["memory_id"],
                memory_type=entry["memory_type"],
                detail=entry["detail"],
            )
        )
    return formatted
