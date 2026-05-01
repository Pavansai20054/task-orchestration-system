from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owned_workspaces = relationship("Workspace", back_populates="owner")

    memberships = relationship("WorkspaceMember", back_populates="user")

    assigned_tasks = relationship("Task", secondary="task_assignees", back_populates="assignees")