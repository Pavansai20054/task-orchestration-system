from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None


class TaskCreate(TaskBase):
    assigned_to: Optional[int] = None
    workspace_id: int


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None


class TaskResponse(TaskBase):
    id: int
    workspace_id: int
    assigned_to: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True