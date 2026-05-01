from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base
from app.models.task_assignee import TaskAssignee


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)

    status = Column(String, default="todo")  # todo / in_progress / done
    priority = Column(String, default="medium")  # low / medium / high

    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    # Legacy single-assignee column kept for backward compatibility and smooth migration.
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="tasks")
    assignees = relationship("User", secondary=TaskAssignee, back_populates="assigned_tasks")
