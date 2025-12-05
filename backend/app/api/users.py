from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..schemas.user import UserCreate, UserOut, UserUpdate
from ..services import user_service
from ..models.user import User as UserModel
from ..api.deps import require_role, get_current_user
from typing import List
from ..models.subject import TeacherSubject, Class, Subject as SubjectModel

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
    existing = user_service.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    try:
        user = user_service.create_user(
            db,
            payload.full_name,
            payload.email,
            payload.password,
            payload.role,
            payload.student_class,
            passport=payload.passport,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
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

@router.get("/me", response_model=UserOut)
def get_current_user_endpoint(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get the current authenticated user with their class information"""
    from ..models.subject import Class
    user = db.query(UserModel).filter(UserModel.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If student, get their class_id
    if user.role == "student":
        class_obj = db.query(Class).join(Class.students).filter(UserModel.id == user.id).first()
        if class_obj:
            user.class_id = class_obj.id
    
    return user

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


@router.get("/teacher-assignments")
def list_teacher_assignments(db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
    """Return a list of teachers and their subject assignments across classes.

    Response format:
    [
      {
        "teacher_id": int,
        "teacher_name": str,
        "teacher_email": str,
        "assignments": [
          {"class_id": int, "class_name": str, "subject_id": int, "subject_name": str}
        ]
      }
    ]
    """
    try:
        rows = (
            db.query(TeacherSubject)
            .join(Class, TeacherSubject.class_id == Class.id)
            .join(SubjectModel, TeacherSubject.subject_id == SubjectModel.id)
            .all()
        )

        # Group by teacher
        result_map: dict[int, dict] = {}
        for ts in rows:
            t = ts.teacher
            if not t:
                continue
            entry = result_map.setdefault(t.id, {
                "teacher_id": t.id,
                "teacher_name": t.full_name,
                "teacher_email": t.email,
                "assignments": []
            })

            entry["assignments"].append({
                "class_id": ts.class_id,
                "class_name": ts.class_obj.name if hasattr(ts, "class_obj") and ts.class_obj else None,
                "subject_id": ts.subject_id,
                "subject_name": ts.subject.name if hasattr(ts, "subject") and ts.subject else None,
            })

        # Ensure all teachers appear (even those without assignments)
        teachers = db.query(UserModel).filter(UserModel.role == "teacher").all()
        for t in teachers:
            if t.id not in result_map:
                result_map[t.id] = {
                    "teacher_id": t.id,
                    "teacher_name": t.full_name,
                    "teacher_email": t.email,
                    "assignments": [],
                }

        return list(result_map.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch teacher assignments: {str(e)}")


@router.get("/me/assignments")
def get_my_assignments(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Return the list of class/subject assignments for the current teacher.

    Response format:
    [ {"class_id": int, "class_name": str, "subject_id": int, "subject_name": str} ]
    """
    try:
        if getattr(current_user, "role", None) != "teacher":
            return []

        rows = (
            db.query(TeacherSubject)
            .join(Class, TeacherSubject.class_id == Class.id)
            .join(SubjectModel, TeacherSubject.subject_id == SubjectModel.id)
            .filter(TeacherSubject.teacher_id == current_user.id)
            .all()
        )

        result = []
        for ts in rows:
            result.append({
                "class_id": ts.class_id,
                "class_name": ts.class_obj.name if hasattr(ts, "class_obj") and ts.class_obj else None,
                "subject_id": ts.subject_id,
                "subject_name": ts.subject.name if hasattr(ts, "subject") and ts.subject else None,
            })

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch my assignments: {str(e)}")
