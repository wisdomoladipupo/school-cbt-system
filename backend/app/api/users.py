from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..schemas.user import UserCreate, UserOut
from ..services import user_service
from ..api.deps import require_role
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
    existing = user_service.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = user_service.create_user(db, payload.full_name, payload.email, payload.password, payload.role, payload.student_class)
    return user

@router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
    return db.query(user_service.User).all()  # Slight shortcut; ensure you import correctly if you change
