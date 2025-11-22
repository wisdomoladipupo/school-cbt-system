from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..schemas.exam import ExamCreate, ExamOut
from ..api.deps import require_role, get_current_user
from ..services import exam_service
from typing import List

router = APIRouter(prefix="/exams", tags=["exams"])

@router.post("/", response_model=ExamOut)
def create_exam(exam_in: ExamCreate, db: Session = Depends(get_db), current_user = Depends(require_role("teacher"))):
    exam = exam_service.create_exam(db, current_user.id, exam_in)
    return exam

@router.get("/", response_model=List[ExamOut])
def list_exams(db: Session = Depends(get_db)):
    return exam_service.list_exams(db)

@router.get("/{exam_id}", response_model=ExamOut)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    e = exam_service.get_exam(db, exam_id)
    if not e:
        raise HTTPException(status_code=404, detail="Exam not found")
    return e
