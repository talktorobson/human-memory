# Memory Gateway — RAG-only (Starter, Minimal)

Local-first **Memory Gateway** to serve personal memories to agents/LLMs via RAG.

## What’s here
- `docs/CODEX_BRIEF.md` — context for Codex.
- `api/openapi.yaml` — API contract (search + retrieve_for_task).
- `gateway/` — FastAPI app (mock store).
- `infra/docker-compose.yml` — run locally.
- `frontend/` — Vite + React + Tailwind dashboard powered by the gateway APIs.

## Running the gateway and front-end

1. Start the FastAPI gateway (from the repo root):
   ```bash
   uvicorn gateway.main:app --reload --port 8080
   ```
2. Install front-end dependencies and launch the Vite dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open http://localhost:5173. The UI expects the gateway at http://localhost:8080 by default. Override via `VITE_API_URL`:
   ```bash
   VITE_API_URL=http://localhost:8080 npm run dev
   ```

The React app uses React Query to call `/memories/search` and `/memories/retrieve_for_task`, rendering live data in the Inbox, Search, and Task Curator panels. Approve/Reject buttons emit placeholder mutations ready to integrate with future moderation endpoints.
