# Task Orchestration System

![Python](https://img.shields.io/badge/python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal)
![License](https://img.shields.io/badge/license-MIT-green)

FastAPI backend for task and workspace management with JWT auth, SQLAlchemy ORM, and Pydantic schemas.

## Prerequisites

- Python 3.12+
- pip

## Install

```bash
pip install -r requirements.txt
```

## Usage

```bash
uvicorn app.main:app --reload
```

API base: `http://127.0.0.1:8000`

## API Overview

- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- Users: `GET /users/me`, `PUT /users/me`
- Workspaces: `POST /workspaces`, `GET /workspaces`, `GET /workspaces/{id}`, `PUT /workspaces/{id}`, `DELETE /workspaces/{id}`, `POST /workspaces/{id}/members`, `GET /workspaces/{id}/members`, `DELETE /workspaces/{id}/members/{user_id}`, `GET /workspaces/{id}/tasks`
- Tasks: `POST /tasks`, `GET /tasks`, `GET /tasks/{id}`, `PUT /tasks/{id}`, `PATCH /tasks/{id}/status`, `PATCH /tasks/{id}/assign`, `DELETE /tasks/{id}`
- Dashboard: `GET /dashboard`, `GET /dashboard/overdue-tasks`

Postman collection: [backend/docs/postman_collection.json](backend/docs/postman_collection.json)

## Run tests

```bash
python -m pytest
```

## Author

- Maintainer: Your Name

## Contributing

Contributions are welcome. Please open an issue or pull request with a clear description.

## License

MIT

## Project Structure (with use case)

```
app/
	main.py                 # FastAPI app setup and router registration
	api/
		deps.py               # Shared dependencies (auth, DB session, current user)
		routes/
			auth.py             # Auth endpoints (register/login)
			projects.py         # Workspace endpoints
			tasks.py            # Task endpoints
			users.py            # User endpoints
	core/
		config.py             # App settings and environment configuration
		security.py           # Password hashing and JWT helpers
	db/
		base.py               # SQLAlchemy base and model imports
		database.py           # Engine, session factory, and DB dependency
	models/
		project.py            # Workspace ORM model
		task.py               # Task ORM model
		user.py               # User ORM model
		workspace_member.py   # Workspace membership ORM model
	schemas/
		project.py            # Workspace request/response schemas
		task.py               # Task request/response schemas
		user.py               # User/auth request/response schemas
		workspace_member.py   # Workspace membership schemas
	services/
		auth_service.py       # User registration/login logic
		project_service.py    # Workspace business logic
		task_service.py       # Task business logic
	utils/
		validators.py         # Reusable validators and helpers
docs/
	AGENTS.md               # AI agent instructions for this codebase
	postman_collection.json # Postman collection for API requests
```
