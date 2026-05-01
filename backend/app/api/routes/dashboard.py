from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.schemas.task import TaskResponse
from app.services.task_service import get_dashboard, get_overdue_tasks

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dashboard(db, current_user)


@router.get("/overdue-tasks", response_model=list[TaskResponse])
def get_dashboard_overdue_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_overdue_tasks(db, current_user)
