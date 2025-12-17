from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..schemas.question import QuestionCreate, QuestionOut, QuestionUpdate
from ..api.deps import require_role, get_current_user
from ..services import exam_service
from typing import List
import os
import uuid
from fastapi.responses import FileResponse

router = APIRouter(prefix="/questions", tags=["questions"])

# -------- Specific routes (must come before generic {id} routes) --------

@router.post("/upload-image")
async def upload_question_image(file: UploadFile = File(...), current_user = Depends(require_role("teacher"))):
    """Upload an image for a question. Returns the relative URL to use in question creation."""
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/questions"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        filepath = os.path.join(upload_dir, unique_filename)
        
        # Save file
        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)
        
        # Return relative URL
        return {"image_url": f"/uploads/questions/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File upload failed: {str(e)}")

@router.get("/exam/{exam_id}", response_model=List[QuestionOut])
def get_questions_for_exam(exam_id: int, db: Session = Depends(get_db)):
    return exam_service.get_questions_for_exam(db, exam_id)

# -------- Generic routes (must come after specific routes) --------

@router.post("/", response_model=QuestionOut)
def add_question(payload: QuestionCreate, db: Session = Depends(get_db), current_user = Depends(require_role("teacher"))):
    # verify exam exists (if provided)
    if payload.exam_id:
        exam = exam_service.get_exam(db, payload.exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
    q = exam_service.add_question(db, current_user.id, payload.exam_id, payload.text, payload.options, payload.correct_answer, payload.marks, payload.image_url)
    return q

@router.put("/{question_id}", response_model=QuestionOut)
def update_question(question_id: int, payload: QuestionUpdate, db: Session = Depends(get_db), current_user = Depends(require_role(["teacher", "admin"]))):
    # Ensure question exists
    q = exam_service.get_question(db, question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    # If teacher, ensure they can access the exam this question belongs to
    if getattr(current_user, "role", None) == "teacher":
        exam = exam_service.get_exam(db, q.exam_id)
        if not exam or not exam_service.teacher_can_access_exam(db, current_user.id, exam):
            raise HTTPException(status_code=403, detail="Not allowed to modify this question")

    try:
        updated = exam_service.update_question(db, question_id, current_user.id, text=payload.text, options=payload.options, correct_answer=payload.correct_answer, marks=payload.marks, image_url=payload.image_url)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db), current_user = Depends(require_role(["teacher", "admin"]))):
    q = exam_service.get_question(db, question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    if getattr(current_user, "role", None) == "teacher":
        exam = exam_service.get_exam(db, q.exam_id)
        if not exam or not exam_service.teacher_can_access_exam(db, current_user.id, exam):
            raise HTTPException(status_code=403, detail="Not allowed to delete this question")

    success = exam_service.delete_question(db, question_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete question")
    return {"detail": "Question deleted"}
