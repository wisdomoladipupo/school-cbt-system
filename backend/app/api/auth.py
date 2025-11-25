from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..schemas.user import UserCreate, LoginRequest, Token
from ..services import user_service
from ..core.security import verify_password, create_access_token
from datetime import timedelta
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    try:
        existing = user_service.get_user_by_email(db, payload.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user = user_service.create_user(db, payload.full_name, payload.email, payload.password, payload.role, payload.student_class)
        token = create_access_token({"user_id": user.id, "role": user.role}, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=Token)
def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    user = user_service.get_user_by_email(db, form_data.email)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"user_id": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}
