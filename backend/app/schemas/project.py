from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class WorkspaceBase(BaseModel):
    name: str


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: str


class WorkspaceResponse(WorkspaceBase):
    id: int
    owner_id: int
    created_at: datetime
    current_user_role: Optional[str] = None

    class Config:
        from_attributes = True
