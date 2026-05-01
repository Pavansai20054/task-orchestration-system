from fastapi import FastAPI

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



# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "Task Orchestration API is running"}
