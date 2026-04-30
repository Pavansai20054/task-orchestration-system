from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.task import Task
from app.models.workspace_member import WorkspaceMember
from app.models.user import User
from app.utils.validators import (
    validate_due_date,
    validate_status,
    validate_priority
)


def create_task(db: Session, current_user: User, data):
    # Check if user is member of workspace
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == data.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(status_code=403, detail="Not part of this workspace")

    # Only admin can create task
    if membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create tasks")

    # Validate fields
    validate_due_date(data.due_date)
    validate_status(data.status)
    validate_priority(data.priority)

    # Validate assigned user (if provided)
    if data.assigned_to:
        assigned_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == data.workspace_id,
            WorkspaceMember.user_id == data.assigned_to
        ).first()

        if not assigned_member:
            raise HTTPException(
                status_code=400,
                detail="Assigned user must be part of the workspace"
            )

    task = Task(
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        workspace_id=data.workspace_id,
        assigned_to=data.assigned_to,
        due_date=data.due_date
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


def update_task(db: Session, current_user: User, task_id: int, data):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check membership
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == task.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(status_code=403, detail="Not part of this workspace")

    update_data = data.dict(exclude_unset=True)

    # Validate fields if present
    if "due_date" in update_data:
        validate_due_date(update_data["due_date"])

    if "status" in update_data:
        validate_status(update_data["status"])

    if "priority" in update_data:
        validate_priority(update_data["priority"])

    # Member can only update status
    if membership.role != "admin":
        if "status" in update_data and len(update_data) == 1:
            task.status = update_data["status"]
            db.commit()
            db.refresh(task)
            return task
        else:
            raise HTTPException(
                status_code=403,
                detail="Members can only update status"
            )

    # Admin: validate assigned user if changed
    if "assigned_to" in update_data and update_data["assigned_to"]:
        assigned_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == task.workspace_id,
            WorkspaceMember.user_id == update_data["assigned_to"]
        ).first()

        if not assigned_member:
            raise HTTPException(
                status_code=400,
                detail="Assigned user must be part of the workspace"
            )

    # Admin can update all fields safely
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


def get_tasks(db: Session, current_user: User):
    memberships = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id
    ).all()

    workspace_ids = [m.workspace_id for m in memberships]

    tasks = db.query(Task).filter(
        Task.workspace_id.in_(workspace_ids)
    ).all()

    return tasks