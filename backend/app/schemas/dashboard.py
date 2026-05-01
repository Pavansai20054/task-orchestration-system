from pydantic import BaseModel

from app.schemas.task import TaskResponse


class DashboardStats(BaseModel):
    total_tasks: int
    todo: int
    in_progress: int
    done: int
    overdue: int
    completion_percentage: float


class DashboardResponse(BaseModel):
    stats: DashboardStats
    overdue_tasks: list[TaskResponse]
