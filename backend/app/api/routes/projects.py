from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.project import WorkspaceCreate, WorkspaceResponse
from app.services.project_service import (
    create_workspace,
    add_member,
    get_user_workspaces
)

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("/", response_model=WorkspaceResponse)
def create_new_workspace(
    workspace: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_workspace(db, current_user, workspace.name)


@router.post("/{workspace_id}/members")
def add_workspace_member(
    workspace_id: int,
    user_id: int,
    role: str = "member",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return add_member(db, current_user, workspace_id, user_id, role)


@router.get("/", response_model=list[WorkspaceResponse])
def get_my_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_workspaces(db, current_user)