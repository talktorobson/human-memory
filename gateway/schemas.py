from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, conint


class MemoryPayload(BaseModel):
    memory_id: str = Field(..., description="Stable identifier for the memory record.")
    title: str = Field(..., description="Short label summarising the memory.")
    branch: str = Field(..., description="Logical branch or folder the memory belongs to.")
    content: str = Field(..., description="Full text content associated with the memory.")
    salience: float = Field(..., ge=0.0, le=1.0, description="Relative salience score (0-1).")
    memory_type: str = Field(..., description="Classification of the memory (identity, episodic, procedural, etc.).")


class MemorySearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Free-text query to match memories.")
    limit: conint(gt=0, le=20) = Field(
        5, description="Maximum number of memories to return (default 5, max 20)."
    )


class MemorySearchHit(BaseModel):
    memory: MemoryPayload
    score: float = Field(..., ge=0.0, description="Hybrid keyword + salience score.")


class MemorySearchResponse(BaseModel):
    results: List[MemorySearchHit]


class RetrieveForTaskRequest(BaseModel):
    task: str = Field(
        ..., min_length=1, description="Task description requiring contextual memories."
    )
    branch: Optional[str] = Field(
        None, description="Branch hint to narrow retrieval to specific workstreams."
    )
    limit: conint(gt=0, le=20) = Field(
        3, description="Maximum number of supporting memories to return (default 3, max 20)."
    )


class RetrieveForTaskResponse(BaseModel):
    task: str
    context: List[MemorySearchHit]
