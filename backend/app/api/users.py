from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..schemas.user import UserCreate, UserOut, UserUpdate
from ..services import user_service
from ..models.user import User as UserModel
from ..api.deps import require_role, get_current_user
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
    # Return all users (admin-only). Use the User model from models.user
    try:
        return db.query(UserModel).all()
    except Exception as e:
        # Log and return a clear HTTP error for debugging
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")


@router.get("", response_model=List[UserOut])
def list_users_noslash(db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
    """Alias endpoint to accept requests without trailing slash so proxies/clients don't trigger a redirect that strips auth headers."""
    try:
        return db.query(UserModel).all()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")

@router.get("/students/list", response_model=List[UserOut])
def list_students(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get all students. Accessible to authenticated users (teachers, admins)"""
    return db.query(UserModel).filter(UserModel.role == "student").all()

@router.put("/{user_id}", response_model=UserOut)
def update_user_endpoint(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
    user_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    updated = user_service.update_user(db, user_id, **user_data)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@router.delete("/{user_id}")
def delete_user_endpoint(user_id: int, db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
    success = user_service.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted successfully"}
