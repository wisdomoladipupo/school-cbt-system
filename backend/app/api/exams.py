from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..schemas.exam import ExamCreate, ExamOut
from ..api.deps import require_role, get_current_user
from ..services import exam_service
from ..services.document_parser import parse_docx, parse_pdf
from typing import List
import os
import tempfile

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

@router.post("/import-from-document/{exam_id}")
async def import_questions_from_document(
    exam_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("teacher"))
):
    """Import questions from a Word (.docx) or PDF file"""
    try:
        # Verify exam exists and user has permission
        exam = exam_service.get_exam(db, exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        if exam.teacher_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Permission denied")
        
        # Determine file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name
        
        try:
            # Parse based on file type
            if file_ext == '.docx':
                parsed_questions = parse_docx(tmp_path)
            elif file_ext == '.pdf':
                parsed_questions = parse_pdf(tmp_path)
            else:
                raise HTTPException(status_code=400, detail="Unsupported file type. Use .docx or .pdf")
            
            # Add questions to exam
            created_count = 0
            for pq in parsed_questions:
                exam_service.add_question(
                    db, 
                    current_user.id, 
                    exam_id, 
                    pq.text, 
                    pq.options, 
                    pq.correct_answer,
                    marks=1
                )
                created_count += 1
            
            return {
                "success": True,
                "questions_imported": created_count,
                "exam_id": exam_id
            }
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")
