from pydantic import BaseModel, EmailStr
from typing import Optional


class UserInfoResponse(BaseModel):
    id: int
    email: EmailStr


class WorkspaceMemberBase(BaseModel):
    user_id: int
    workspace_id: int
    role: str = "member"


class WorkspaceMemberCreate(WorkspaceMemberBase):
    pass


class WorkspaceMemberResponse(WorkspaceMemberBase):
    id: int
    user_email: Optional[EmailStr] = None

    class Config:
        from_attributes = True


class WorkspaceMemberWithUserResponse(WorkspaceMemberBase):
    id: int
    role: str
    user: UserInfoResponse

    class Config:
        from_attributes = True


class MemberTaskCompletionResponse(BaseModel):
    user_id: int
    user_email: Optional[EmailStr] = None
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
