from fastapi import FastAPI

from .routers import memories_router
from .store import InMemoryMemoryStore

app = FastAPI(
    title="Memory Gateway API (RAG-only)",
    description="Local-first gateway exposing memory retrieval endpoints for agents.",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)


@app.on_event("startup")
def bootstrap_store() -> None:
    # TODO: Configure JWT-protected dependencies when auth scopes are defined.
    app.state.store = InMemoryMemoryStore()


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


app.include_router(memories_router)
