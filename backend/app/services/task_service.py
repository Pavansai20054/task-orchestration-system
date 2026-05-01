from datetime import datetime
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

    # Validate fields
    validate_due_date(data.due_date)
    validate_status(data.status)
    validate_priority(data.priority)

    # Validate assignees (if provided)
    assignees = []
    if data.assignees:
        for assignee_id in data.assignees:
            assigned_member = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == data.workspace_id,
                WorkspaceMember.user_id == assignee_id
            ).first()

            if not assigned_member:
                raise HTTPException(
                    status_code=400,
                    detail=f"User {assignee_id} must be part of the workspace"
                )
            user = db.query(User).filter(User.id == assignee_id).first()
            if user:
                assignees.append(user)

    task = Task(
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        workspace_id=data.workspace_id,
        created_by=current_user.id,
        due_date=data.due_date,
        assignees=assignees
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


def _get_task_or_404(db: Session, task_id: int):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def _get_workspace_membership(db: Session, workspace_id: int, user_id: int):
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not part of this workspace")
    return membership


def _validate_assigned_member(db: Session, workspace_id: int, user_id: int | None):
    if user_id is None:
        return
    assigned_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not assigned_member:
        raise HTTPException(
            status_code=400,
            detail="User must be part of the workspace"
        )


def update_task(db: Session, current_user: User, task_id: int, data):
    task = _get_task_or_404(db, task_id)
    membership = _get_workspace_membership(db, task.workspace_id, current_user.id)
    update_data = data.model_dump(exclude_unset=True)

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
            # Check if user is assigned to this task
            is_assigned = any(a.id == current_user.id for a in task.assignees)
            if not is_assigned:
                raise HTTPException(
                    status_code=403,
                    detail="Members can only update their assigned tasks"
                )
            task.status = update_data["status"]
            db.commit()
            db.refresh(task)
            return task
        else:
            raise HTTPException(
                status_code=403,
                detail="Members can only update status"
            )

    # Admin: handle assignees update
    if "assignees" in update_data:
        new_assignees = update_data.pop("assignees")
        task.assignees = []
        for assignee_id in new_assignees:
            _validate_assigned_member(db, task.workspace_id, assignee_id)
            user = db.query(User).filter(User.id == assignee_id).first()
            if user:
                task.assignees.append(user)

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


def get_task_by_id(db: Session, current_user: User, task_id: int):
    task = _get_task_or_404(db, task_id)
    _get_workspace_membership(db, task.workspace_id, current_user.id)
    return task


def patch_task_status(db: Session, current_user: User, task_id: int, status_value: str):
    validate_status(status_value)
    task = _get_task_or_404(db, task_id)
    membership = _get_workspace_membership(db, task.workspace_id, current_user.id)

    # Check if user is assigned to task or is admin
    is_assigned = any(a.id == current_user.id for a in task.assignees)
    if membership.role != "admin" and not is_assigned:
        raise HTTPException(
            status_code=403,
            detail="Members can only update their assigned tasks"
        )

    task.status = status_value
    db.commit()
    db.refresh(task)
    return task


def add_task_assignee(db: Session, current_user: User, task_id: int, user_id: int):
    """Add a user as an assignee to a task"""
    task = _get_task_or_404(db, task_id)
    membership = _get_workspace_membership(db, task.workspace_id, current_user.id)
    
    if membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign tasks")

    _validate_assigned_member(db, task.workspace_id, user_id)
    
    # Check if user already assigned
    if any(a.id == user_id for a in task.assignees):
        raise HTTPException(status_code=400, detail="User already assigned to this task")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        task.assignees.append(user)
        db.commit()
        db.refresh(task)
    
    return task


def remove_task_assignee(db: Session, current_user: User, task_id: int, user_id: int):
    """Remove a user as an assignee from a task"""
    task = _get_task_or_404(db, task_id)
    membership = _get_workspace_membership(db, task.workspace_id, current_user.id)
    
    if membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can unassign tasks")

    # Find and remove assignee
    task.assignees = [a for a in task.assignees if a.id != user_id]
    db.commit()
    db.refresh(task)
    
    return task


def patch_task_assignment(db: Session, current_user: User, task_id: int, assignees: list[int] | None):
    """Replace all assignees for a task"""
    task = _get_task_or_404(db, task_id)
    membership = _get_workspace_membership(db, task.workspace_id, current_user.id)
    if membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign tasks")

    task.assignees = []
    if assignees:
        for assignee_id in assignees:
            _validate_assigned_member(db, task.workspace_id, assignee_id)
            user = db.query(User).filter(User.id == assignee_id).first()
            if user:
                task.assignees.append(user)
    
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, current_user: User, task_id: int):
    task = _get_task_or_404(db, task_id)
    membership = _get_workspace_membership(db, task.workspace_id, current_user.id)
    if membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete tasks")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}


def get_assigned_tasks(db: Session, current_user: User):
    """Get all tasks assigned to the current user"""
    tasks = db.query(Task).filter(
        Task.assignees.any(id=current_user.id)
    ).all()
    return tasks


def get_dashboard(db: Session, current_user: User):
    tasks = get_tasks(db, current_user)
    overdue_tasks = get_overdue_tasks(db, current_user)

    total = len(tasks)
    done = len([task for task in tasks if task.status == "done"])
    todo = len([task for task in tasks if task.status == "todo"])
    in_progress = len([task for task in tasks if task.status == "in_progress"])
    completion_percentage = round((done / total) * 100, 2) if total else 0.0

    return {
        "stats": {
            "total_tasks": total,
            "todo": todo,
            "in_progress": in_progress,
            "done": done,
            "overdue": len(overdue_tasks),
            "completion_percentage": completion_percentage
        },
        "overdue_tasks": overdue_tasks
    }


def get_overdue_tasks(db: Session, current_user: User):
    tasks = get_tasks(db, current_user)
    now = datetime.utcnow()
    return [
        task for task in tasks
        if task.due_date is not None and task.status != "done" and task.due_date < now
    ]
