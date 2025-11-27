from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core.db import get_db
from ..schemas.exam import ExamCreate, ExamOut
from ..services import exam_service
from ..api.deps import require_role, get_current_user
from ..schemas.user import User  # make sure this import exists

router = APIRouter(prefix="/exams", tags=["exams"])

# ---------------------------------------------------------
# Create new exam (TEACHER ONLY)
# ---------------------------------------------------------
@router.post("/", response_model=ExamOut)
def create_exam(
    exam_in: ExamCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("teacher"))
):
    exam = exam_service.create_exam(db, current_user.id, exam_in)
    return exam


# ---------------------------------------------------------
# LIST EXAMS for CURRENT USER (teachers, admins, students)
# Matches: GET /api/exams
# ---------------------------------------------------------
@router.get("/all", response_model=List[ExamOut])
def list_all_exams(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Admins and teachers see all exams
    if current_user.role in ["admin", "teacher"]:
        return exam_service.list_exams(db, published_only=False)

    # Students only see published exams
    return exam_service.list_exams(db, published_only=True)



# ---------------------------------------------------------
# ADMIN ONLY: GET ALL EXAMS
# Matches: GET /api/exams/all
# ---------------------------------------------------------
@router.get("/all", response_model=List[ExamOut])
def admin_list_all_exams(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("admin"))
):
    return exam_service.list_exams(db, published_only=False)


# ---------------------------------------------------------
# Get a single exam by ID
# Matches: GET /api/exams/{exam_id}
# ---------------------------------------------------------
@router.get("/{exam_id}", response_model=ExamOut)
def get_exam(
    exam_id: int,
    db: Session = Depends(get_db)
):
    exam = exam_service.get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam
