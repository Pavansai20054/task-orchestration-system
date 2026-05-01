from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserUpdate
from app.utils.validators import validate_password


def update_me(db: Session, current_user: User, payload: UserUpdate):
    update_data = payload.model_dump(exclude_unset=True)

    if "email" in update_data:
        existing_user = db.query(User).filter(User.email == update_data["email"]).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = update_data["email"]

    if "password" in update_data:
        validate_password(update_data["password"])
        current_user.password = hash_password(update_data["password"])

    db.commit()
    db.refresh(current_user)
    return current_user
