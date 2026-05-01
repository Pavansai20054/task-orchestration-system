from fastapi import APIRouter, Depends
from pydantic import EmailStr
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.project import WorkspaceCreate, WorkspaceResponse
from app.schemas.workspace_member import WorkspaceMemberResponse, MemberTaskCompletionResponse
from app.schemas.task import TaskResponse
from app.schemas.project import WorkspaceUpdate
from app.services.project_service import (
    create_workspace,
    add_member,
    get_user_workspaces,
    get_workspace_by_id,
    update_workspace,
    delete_workspace,
    remove_member,
    list_members,
    get_workspace_tasks,
    get_workspace_member_completion
)

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("", response_model=WorkspaceResponse)
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
    user_id: int | None = None,
    user_email: EmailStr | None = None,
    role: str = "member",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return add_member(db, current_user, workspace_id, user_id, role, user_email)


@router.get("", response_model=list[WorkspaceResponse])
@router.get("/", response_model=list[WorkspaceResponse])
def get_my_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_workspaces(db, current_user)


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_workspace_by_id(db, current_user, workspace_id)


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace_by_id(
    workspace_id: int,
    payload: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return update_workspace(db, current_user, workspace_id, payload.name)


@router.delete("/{workspace_id}")
def delete_workspace_by_id(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return delete_workspace(db, current_user, workspace_id)


@router.delete("/{workspace_id}/members/{user_id}")
def remove_workspace_member(
    workspace_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return remove_member(db, current_user, workspace_id, user_id)


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberResponse])
def list_workspace_members(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return list_members(db, current_user, workspace_id)


@router.get("/{workspace_id}/tasks", response_model=list[TaskResponse])
def list_workspace_tasks(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_workspace_tasks(db, current_user, workspace_id)


@router.get("/{workspace_id}/member-progress", response_model=list[MemberTaskCompletionResponse])
def list_workspace_member_progress(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_workspace_member_completion(db, current_user, workspace_id)
