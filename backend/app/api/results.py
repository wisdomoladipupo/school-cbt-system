from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..schemas.result import SubmitResult, ResultOut
from ..api.deps import get_current_user, require_role
from ..services import result_service, exam_service
from typing import List

router = APIRouter(prefix="/results", tags=["results"])

@router.post("/submit", response_model=ResultOut)
def submit_result(payload: SubmitResult, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # only student may submit (admins/teachers could submit for testing; we allow admin bypass)
    if current_user.role != "student" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only students may submit results")
    exam = exam_service.get_exam(db, payload.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    answers_list = [a.dict() for a in payload.answers]
    result = result_service.grade_and_record(db, current_user.id, payload.exam_id, answers_list)
    return result

@router.get("/me", response_model=List[ResultOut])
def my_results(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return result_service.get_results_for_student(db, current_user.id)

@router.get("/exam/{exam_id}", response_model=List[ResultOut])
def results_for_exam(exam_id: int, db: Session = Depends(get_db), current_user = Depends(require_role("teacher"))):
    # teachers can view results for exams they created or admin
    return result_service.get_results_for_exam(db, exam_id)
