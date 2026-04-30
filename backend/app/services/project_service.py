from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.project import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.user import User


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

    return workspace


def add_member(
    db: Session,
    current_user: User,
    workspace_id: int,
    user_id: int,
    role: str = "member"
):
    # Check workspace
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check admin
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if not membership or membership.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can add members"
        )

    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent duplicate
    existing = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already a member")

    new_member = WorkspaceMember(
        user_id=user_id,
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

    return workspaces