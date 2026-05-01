from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AssigneeInfo(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None


class TaskCreate(TaskBase):
    assignees: Optional[List[int]] = None
    workspace_id: int


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignees: Optional[List[int]] = None
    due_date: Optional[datetime] = None


class TaskStatusUpdate(BaseModel):
    status: str


class TaskAssignUpdate(BaseModel):
    assignees: Optional[List[int]] = None


class TaskAssigneeAdd(BaseModel):
    user_id: int


class TaskAssigneeRemove(BaseModel):
    user_id: int


class TaskResponse(TaskBase):
    id: int
    workspace_id: int
    created_by: int
    assignees: List[AssigneeInfo]
    created_at: datetime

    class Config:
        from_attributes = True

