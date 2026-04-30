# Agent Instructions

## Project Overview

- FastAPI backend with SQLAlchemy ORM and JWT auth.
- Layered structure: routes -> services -> models/schemas.

## How To Run

- Dev server: `uvicorn app.main:app --reload`
- Python deps: `pip install -r requirements.txt`

## Architecture Map

- App entrypoint and router registration: app/main.py
- API routes: app/api/routes/
- Service layer: app/services/
- ORM models: app/models/
- Pydantic schemas: app/schemas/
- DB session and engine: app/db/database.py
- Config and security utilities: app/core/

## Conventions

- Keep endpoint logic thin; push business logic into services.
- Route files should use `APIRouter`, `Depends(get_db)`, and `response_model`.
- Models use SQLAlchemy; schemas use Pydantic; avoid mixing concerns.

## Gotchas

- When adding a new router module, import and include it in app/main.py.
- Auth and user context are handled via dependencies in app/api/deps.py.
