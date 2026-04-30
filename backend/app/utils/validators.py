from datetime import datetime, timezone
from fastapi import HTTPException, status


def validate_due_date(due_date):
    if due_date:
        due_date_utc = (
            due_date
            if due_date.tzinfo is not None
            else due_date.replace(tzinfo=timezone.utc)
        )
        if due_date_utc < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Due date cannot be in the past"
            )
        return


def validate_status(status):
    allowed_status = ["todo", "in_progress", "done"]

    if status and status not in allowed_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {allowed_status}"
        )


def validate_priority(priority):
    allowed_priority = ["low", "medium", "high"]

    if priority and priority not in allowed_priority:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority. Allowed: {allowed_priority}"
        )