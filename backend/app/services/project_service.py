from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.project import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.user import User
from app.models.task import Task


def _validate_role(role: str) -> str:
    if role not in {"admin", "member"}:
        raise HTTPException(status_code=400, detail="Role must be admin or member")
    return role


def _get_workspace_or_404(db: Session, workspace_id: int):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


def _get_membership(db: Session, workspace_id: int, user_id: int):
    return db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()


def _require_workspace_member(db: Session, workspace_id: int, user_id: int):
    membership = _get_membership(db, workspace_id, user_id)
    if not membership:
        raise HTTPException(status_code=403, detail="Not part of this workspace")
    return membership


def _require_workspace_admin(db: Session, workspace_id: int, user_id: int):
    membership = _require_workspace_member(db, workspace_id, user_id)
    if membership.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can perform this action"
        )
    return membership


def _workspace_to_response(db: Session, workspace: Workspace, user_id: int):
    membership = _get_membership(db, workspace.id, user_id)
    current_user_role = membership.role if membership else None
    return {
        "id": workspace.id,
        "name": workspace.name,
        "owner_id": workspace.owner_id,
        "created_at": workspace.created_at,
        "current_user_role": current_user_role
    }


def create_workspace(db: Session, user: User, name: str):
    workspace = Workspace(
        name=name,
        owner_id=user.id
    )

    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    # Add creator as admin
    membership = WorkspaceMember(
        user_id=user.id,
        workspace_id=workspace.id,
        role="admin"
    )

    db.add(membership)
    db.commit()

    return _workspace_to_response(db, workspace, user.id)


def add_member(
    db: Session,
    current_user: User,
    workspace_id: int,
    user_id: int | None,
    role: str = "member",
    user_email: str | None = None
):
    _get_workspace_or_404(db, workspace_id)
    _require_workspace_admin(db, workspace_id, current_user.id)
    role = _validate_role(role)

    if user_id is None and not user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID or email is required"
        )

    user = None

    if user_id is not None:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

    if user_email:
        user_by_email = db.query(User).filter(User.email == user_email).first()
        if not user_by_email:
            raise HTTPException(status_code=404, detail="User not found")
        if user and user.id != user_by_email.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID and email do not match"
            )
        user = user_by_email

    # Prevent duplicate
    existing = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already a member")

    new_member = WorkspaceMember(
        user_id=user.id,
        workspace_id=workspace_id,
        role=role
    )

    db.add(new_member)
    db.commit()

    return {"message": "Member added successfully"}


def get_user_workspaces(db: Session, user: User):
    memberships = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == user.id
    ).all()

    workspace_ids = [m.workspace_id for m in memberships]

    workspaces = db.query(Workspace).filter(
        Workspace.id.in_(workspace_ids)
    ).all()

    return [_workspace_to_response(db, workspace, user.id) for workspace in workspaces]


def get_workspace_by_id(db: Session, current_user: User, workspace_id: int):
    workspace = _get_workspace_or_404(db, workspace_id)
    _require_workspace_member(db, workspace_id, current_user.id)
    return _workspace_to_response(db, workspace, current_user.id)


def update_workspace(db: Session, current_user: User, workspace_id: int, name: str):
    workspace = _get_workspace_or_404(db, workspace_id)
    _require_workspace_admin(db, workspace_id, current_user.id)
    workspace.name = name
    db.commit()
    db.refresh(workspace)
    return _workspace_to_response(db, workspace, current_user.id)


def delete_workspace(db: Session, current_user: User, workspace_id: int):
    workspace = _get_workspace_or_404(db, workspace_id)
    _require_workspace_admin(db, workspace_id, current_user.id)

    db.query(Task).filter(Task.workspace_id == workspace_id).delete()
    db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).delete()
    db.delete(workspace)
    db.commit()
    return {"message": "Workspace deleted successfully"}


def remove_member(db: Session, current_user: User, workspace_id: int, user_id: int):
    _get_workspace_or_404(db, workspace_id)
    _require_workspace_admin(db, workspace_id, current_user.id)

    membership = _get_membership(db, workspace_id, user_id)
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")

    if membership.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot remove themselves")

    db.delete(membership)
    db.commit()
    return {"message": "Member removed successfully"}


def list_members(db: Session, current_user: User, workspace_id: int):
    _get_workspace_or_404(db, workspace_id)
    _require_workspace_member(db, workspace_id, current_user.id)
    members = db.query(WorkspaceMember).options(joinedload(WorkspaceMember.user)).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).all()
    return [
        {
            "id": member.id,
            "user_id": member.user_id,
            "workspace_id": member.workspace_id,
            "role": member.role,
            "user_email": member.user.email if member.user else None,
        }
        for member in members
    ]


def get_workspace_tasks(db: Session, current_user: User, workspace_id: int):
    _get_workspace_or_404(db, workspace_id)
    _require_workspace_member(db, workspace_id, current_user.id)
    return db.query(Task).filter(Task.workspace_id == workspace_id).all()


def get_workspace_member_completion(db: Session, current_user: User, workspace_id: int):
    _get_workspace_or_404(db, workspace_id)
    _require_workspace_member(db, workspace_id, current_user.id)

    memberships = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).all()

    completion_rows = []
    for membership in memberships:
        total_tasks = db.query(Task).filter(
            Task.workspace_id == workspace_id,
            Task.assigned_to == membership.user_id
        ).count()
        completed_tasks = db.query(Task).filter(
            Task.workspace_id == workspace_id,
            Task.assigned_to == membership.user_id,
            Task.status == "done"
        ).count()
        completion_percentage = round((completed_tasks / total_tasks) * 100, 2) if total_tasks else 0.0

        completion_rows.append({
            "user_id": membership.user_id,
            "user_email": membership.user.email if membership.user else None,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_percentage": completion_percentage
        })

    return completion_rows
