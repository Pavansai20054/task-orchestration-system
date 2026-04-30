from pydantic import BaseModel


class WorkspaceMemberBase(BaseModel):
    user_id: int
    workspace_id: int
    role: str = "member"


class WorkspaceMemberCreate(WorkspaceMemberBase):
    pass


class WorkspaceMemberResponse(WorkspaceMemberBase):
    id: int

    class Config:
        from_attributes = True