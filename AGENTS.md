# Repository Guidelines

## Project Structure & Module Organization
- `gateway/` contains the FastAPI app; expand business logic into dedicated modules (e.g., `routers/`, `services/`, `schemas.py`) to keep `main.py` light.
- `api/openapi.yaml` is the source of truth for `/memories/search` and `/memories/retrieve_for_task`; update it alongside implementation changes.
- `infra/docker-compose.yml` launches the local stack; adjust services and volumes here when introducing external dependencies.
- `docs/` stores briefs and architectural notes; revise these whenever endpoints or data contracts evolve.

## Build, Test, and Development Commands
- `python -m venv .venv && source .venv/bin/activate` creates and activates a local Python environment.
- `pip install -r gateway/requirements.txt` installs the API dependencies for development and CI.
- `uvicorn gateway.main:app --reload` runs the gateway with live reload for quick iteration.
- `docker compose -f infra/docker-compose.yml up --build` spins up the containerised stack; use for integration checks or demoing changes.
- `pytest gateway/tests` executes the service test suite; keep the run clean before opening a PR.

## Coding Style & Naming Conventions
- Follow PEP 8 defaults: 4-space indentation, `snake_case` for modules/functions, `PascalCase` for Pydantic models, and descriptive route names.
- Group FastAPI routers by feature under `gateway/routers/` and centralise shared schemas in `gateway/schemas.py`.
- Keep imports ordered (stdlib, third-party, local) and annotate new functions with type hints to support future tooling.

## Testing Guidelines
- Prefer `pytest` for unit and integration coverage; place files under `gateway/tests/` using the `test_<feature>.py` pattern.
- Cover new endpoints with both success and failure cases, mocking external stores where necessary.
- Aim for meaningful assertions on payload shapes rather than just status codes, and document fixtures in the test module docstring.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes (`feat:`, `fix:`, `chore:`); example: `feat: add semantic search router`.
- Reference related issues or briefs in the PR description and call out schema or contract updates explicitly.
- Include test output or reproduction steps in the PR body, link to updated docs, and request review once CI (if configured) is green.
