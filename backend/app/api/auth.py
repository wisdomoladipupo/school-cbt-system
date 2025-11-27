from fastapi import APIRouter, Depends, HTTPException, status, Request
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
        normalized_email = payload.email.strip().lower()  # normalize email
        existing = user_service.get_user_by_email(db, normalized_email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user = user_service.create_user(
            db,
            full_name=payload.full_name,
            email=normalized_email,
            password=payload.password,
            role=payload.role,
            student_class=payload.student_class
        )
        
        token = create_access_token(
            {"user_id": user.id, "role": user.role},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": token, "token_type": "bearer"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=Token)
def login(request: Request, form_data: LoginRequest, db: Session = Depends(get_db)):
    try:
        client_host = request.client.host
    except Exception:
        client_host = "unknown"

    normalized_email = form_data.email.strip().lower()  # normalize email
    logger.info(f"Login attempt from {client_host} for email={normalized_email}")

    user = user_service.get_user_by_email(db, normalized_email)
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.info(f"Failed login attempt from {client_host} for email={normalized_email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"user_id": user.id, "role": user.role})
    logger.info(f"Successful login for email={normalized_email} from {client_host}")
    return {"access_token": token, "token_type": "bearer"}
