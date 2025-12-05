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
            student_class=payload.student_class,
            passport=payload.passport,
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
def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    try:
        identifier = form_data.email.strip()
        logger.info(f"Login attempt for identifier={identifier}")

        # Detect registration-number formats and normalize.
        # Accept either NG/EEV/1234A or legacy NG/EEV/1234/A (case-insensitive).
        import re
        reg_pattern_new = re.compile(r"^NG/EEV/\d{4}[A-Z]$", re.IGNORECASE)
        reg_pattern_legacy = re.compile(r"^NG/EEV/\d{4}/[A-Z]$", re.IGNORECASE)

        user = None
        if reg_pattern_new.match(identifier) or reg_pattern_legacy.match(identifier):
            # Normalize to the new format without the extra slash before the letter
            norm = identifier.upper()
            if reg_pattern_legacy.match(norm):
                # convert NG/EEV/1234/A -> NG/EEV/1234A
                norm = norm.replace("/", "", 1)  # only remove the first extra slash after prefix? safer to reconstruct
                # Better reconstruction: split and join
                parts = identifier.split("/")
                # parts like ['NG', 'EEV', '1234', 'A'] -> join 3rd and 4th
                if len(parts) >= 4:
                    norm = f"{parts[0]}/{parts[1]}/{parts[2]}{parts[3]}".upper()

            user = user_service.get_user_by_registration_number(db, norm)
            logger.info(f"Lookup by registration number returned: {user and user.email}")
        else:
            normalized_email = identifier.lower()
            user = user_service.get_user_by_email(db, normalized_email)

        # If user not found or password invalid, fail
        if not user or not verify_password(form_data.password, user.hashed_password):
            logger.info(f"Failed login attempt for identifier={identifier}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Enforce that students must login using registration number
        if user.role == "student" and not (reg_pattern_new.match(identifier) or reg_pattern_legacy.match(identifier)):
            # user attempted to login with email; instruct to use reg number
            raise HTTPException(status_code=403, detail="Students must login using their registration number")

        token = create_access_token({"user_id": user.id, "role": user.role})
        logger.info(f"Successful login for identifier={identifier}")
        return {"access_token": token, "token_type": "bearer"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Login failed")
