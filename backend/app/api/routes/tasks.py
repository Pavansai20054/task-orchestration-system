from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskStatusUpdate,
    TaskAssignUpdate,
    TaskAssigneeAdd,
    TaskAssigneeRemove
)
from app.services.task_service import (
    create_task,
    update_task,
    get_tasks,
    get_task_by_id,
    patch_task_status,
    patch_task_assignment,
    delete_task,
    add_task_assignee,
    remove_task_assignee,
    get_assigned_tasks
)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("", response_model=TaskResponse)
@router.post("/", response_model=TaskResponse)
def create_new_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_task(db, current_user, task)


@router.put("/{task_id}", response_model=TaskResponse)
def update_existing_task(
    task_id: int,
    task: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return update_task(db, current_user, task_id, task)


@router.get("", response_model=list[TaskResponse])
@router.get("/", response_model=list[TaskResponse])
def get_all_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_tasks(db, current_user)


@router.get("/assigned", response_model=list[TaskResponse])
def get_my_assigned_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_assigned_tasks(db, current_user)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_task_by_id(db, current_user, task_id)


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return patch_task_status(db, current_user, task_id, payload.status)


@router.patch("/{task_id}/assign", response_model=TaskResponse)
def assign_task(
    task_id: int,
    payload: TaskAssignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return patch_task_assignment(db, current_user, task_id, payload.assignees)


@router.post("/{task_id}/assignees", response_model=TaskResponse)
def add_assignee(
    task_id: int,
    payload: TaskAssigneeAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return add_task_assignee(db, current_user, task_id, payload.user_id)


@router.delete("/{task_id}/assignees/{user_id}", response_model=TaskResponse)
def remove_assignee(
    task_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return remove_task_assignee(db, current_user, task_id, user_id)


@router.delete("/{task_id}")
def delete_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return delete_task(db, current_user, task_id)
