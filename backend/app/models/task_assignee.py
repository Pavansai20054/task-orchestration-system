from sqlalchemy import Column, Integer, ForeignKey, DateTime, Table
from datetime import datetime

from app.db.database import Base


# Many-to-many association table for tasks and assignees
TaskAssignee = Table(
    "task_assignees",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("assigned_at", DateTime, default=datetime.utcnow),
)
