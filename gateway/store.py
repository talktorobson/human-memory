from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Sequence, Tuple


KEYWORD_WEIGHT = 0.35
SALIENCE_WEIGHT = 0.65


@dataclass(frozen=True)
class MemoryRecord:
    memory_id: str
    title: str
    branch: str
    content: str
    salience: float
    memory_type: str
    keywords: Sequence[str]


MOCK_MEMORIES: Tuple[MemoryRecord, ...] = (
    MemoryRecord(
        memory_id="mem_001",
        title="Vehicle registration profile",
        branch="identity/vehicle",
        content=(
            "Catalogued the 2022 Tesla Model 3 assigned to the agent, including VIN, "
            "registration renewal dates, and charging access credentials."
        ),
        salience=0.85,
        memory_type="identity",
        keywords=("vehicle", "registration", "tesla"),
    ),
    MemoryRecord(
        memory_id="mem_002",
        title="Normandy travel log",
        branch="travel/normandy",
        content=(
            "Recorded the reconnaissance trip through Normandy, noting Omaha Beach terrain, "
            "local contacts, and evening shelter arrangements after the coastal survey."
        ),
        salience=0.95,
        memory_type="episodic",
        keywords=("normandy", "travel", "recon"),
    ),
    MemoryRecord(
        memory_id="mem_003",
        title="AHS intake workflow",
        branch="work/ahs",
        content=(
            "Documented the Ariadne Health Services patient intake procedure: verify ID, "
            "collect triage vitals, prioritise emergencies, and brief the on-call physician."
        ),
        salience=0.8,
        memory_type="procedural",
        keywords=("ahs", "workflow", "triage"),
    ),
)


class InMemoryMemoryStore:
    """Simple in-memory store for mock memories. Replace with Postgres + pgvector in production."""

    def __init__(self, records: Iterable[MemoryRecord] | None = None) -> None:
        self._records: Tuple[MemoryRecord, ...] = tuple(records or MOCK_MEMORIES)

    def search(self, query: str, limit: int) -> List[Tuple[MemoryRecord, float]]:
        normalized = query.lower().strip()
        return self._rank_records(normalized, limit)

    def retrieve_for_task(
        self, task: str, branch: str | None, limit: int
    ) -> List[Tuple[MemoryRecord, float]]:
        normalized = task.lower().strip()
        filtered = self._filter_by_branch(branch)
        return self._rank_records(normalized, limit, candidate_records=filtered, branch=branch)

    def _filter_by_branch(self, branch: str | None) -> Sequence[MemoryRecord]:
        if not branch:
            return self._records
        branch_lower = branch.lower()
        return tuple(record for record in self._records if branch_lower in record.branch.lower())

    def _rank_records(
        self,
        normalized_query: str,
        limit: int,
        *,
        candidate_records: Sequence[MemoryRecord] | None = None,
        branch: str | None = None,
    ) -> List[Tuple[MemoryRecord, float]]:
        candidates = candidate_records or self._records
        results: List[Tuple[MemoryRecord, float]] = []
        for record in candidates:
            keyword_score = self._keyword_match(normalized_query, record, branch=branch)
            if keyword_score <= 0:
                continue
            composite = KEYWORD_WEIGHT * keyword_score + SALIENCE_WEIGHT * record.salience
            results.append((record, round(composite, 4)))
        results.sort(key=lambda item: item[1], reverse=True)
        return results[:limit]

    def _keyword_match(
        self, normalized_query: str, record: MemoryRecord, *, branch: str | None = None
    ) -> float:
        if not normalized_query and not branch:
            return 0.0
        tokens = set(normalized_query.split())
        hits = 0
        if normalized_query in record.title.lower() or normalized_query in record.content.lower():
            hits += 1
        hits += sum(1 for keyword in record.keywords if keyword in tokens)
        if branch and branch.lower() in record.branch.lower():
            hits += 1
        return min(1.0, hits / 2)


# TODO: Replace with Postgres + pgvector-backed store once persistent retrieval is needed.
