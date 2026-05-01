from fastapi import FastAPI
from sqlalchemy import inspect, text

from app.db.database import engine, Base
import app.db.base  # noqa: F401
from app.core.cors import configure_cors


from app.api.routes import auth
from app.api.routes import projects, tasks, users, dashboard

app = FastAPI(title="Task Orchestration System")
configure_cors(app)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
    _run_compatibility_migrations()


def _run_compatibility_migrations():
    inspector = inspect(engine)
    task_columns = {col["name"] for col in inspector.get_columns("tasks")}

    with engine.begin() as conn:
        if "created_by" not in task_columns:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN created_by INTEGER"))

        # Backfill created_by from workspace owner where possible.
        conn.execute(
            text(
                """
                UPDATE tasks t
                SET created_by = w.owner_id
                FROM workspaces w
                WHERE t.workspace_id = w.id AND t.created_by IS NULL
                """
            )
        )

        # Backfill task_assignees from legacy tasks.assigned_to if needed.
        dialect = engine.dialect.name
        if dialect == "postgresql":
            conn.execute(
                text(
                    """
                    INSERT INTO task_assignees (task_id, user_id, assigned_at)
                    SELECT id, assigned_to, NOW()
                    FROM tasks
                    WHERE assigned_to IS NOT NULL
                    ON CONFLICT (task_id, user_id) DO NOTHING
                    """
                )
            )
        else:
            # SQLite-compatible fallback.
            conn.execute(
                text(
                    """
                    INSERT OR IGNORE INTO task_assignees (task_id, user_id, assigned_at)
                    SELECT id, assigned_to, CURRENT_TIMESTAMP
                    FROM tasks
                    WHERE assigned_to IS NOT NULL
                    """
                )
            )



# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "Task Orchestration API is running"}
