from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..schemas.question import QuestionCreate, QuestionOut
from ..api.deps import require_role, get_current_user
from ..services import exam_service
from typing import List

router = APIRouter(prefix="/questions", tags=["questions"])

@router.post("/", response_model=QuestionOut)
def add_question(payload: QuestionCreate, db: Session = Depends(get_db), current_user = Depends(require_role("teacher"))):
    # verify exam exists (if provided)
    if payload.exam_id:
        exam = exam_service.get_exam(db, payload.exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
    q = exam_service.add_question(db, current_user.id, payload.exam_id, payload.text, payload.options, payload.correct_answer, payload.marks)
    return q

@router.get("/exam/{exam_id}", response_model=List[QuestionOut])
def get_questions_for_exam(exam_id: int, db: Session = Depends(get_db)):
    return exam_service.get_questions_for_exam(db, exam_id)
