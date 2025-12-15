
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from sqlalchemy.orm import Session
from typing import List
from ..core.db import get_db
from ..schemas.exam import ExamCreate, ExamOut
from ..services import exam_service
from ..api.deps import require_role, get_current_user
from io import BytesIO

router = APIRouter(prefix="/exams", tags=["exams"])


@router.post("/", response_model=ExamOut)
def create_exam(
    exam_in: ExamCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["teacher"]))
):
    return exam_service.create_exam(db, current_user.id, exam_in)


@router.get("/all", response_model=List[ExamOut])
def list_all_exams(
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    return exam_service.list_exams(db, published_only=False)


@router.get("/", response_model=List[ExamOut])
def list_exams_for_user(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role == "admin":
        return exam_service.list_exams(db, published_only=False)
    if current_user.role == "teacher":
        # Return only exams relevant to this teacher
        return exam_service.list_exams(db, published_only=False, teacher_id=current_user.id)
    # For students, return only published exams for their class
    return exam_service.list_exams(db, published_only=True, student_id=current_user.id)


# -------------------- Specific routes (must come before /{exam_id} catch-all) --------------------

@router.post("/import-from-document/{exam_id}")
async def import_from_document(
    exam_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["teacher", "admin"]))
):
    # Validate exam exists
    exam = exam_service.get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Optional: Restrict to exam creator or admin
    # Enforce teacher assignment: teachers can only import into exams for
    # classes/subjects they are assigned to.
    if getattr(current_user, "role", None) == "teacher":
        if not exam_service.teacher_can_access_exam(db, current_user.id, exam):
            raise HTTPException(status_code=403, detail="Not allowed to import into this exam")

    try:
        file_bytes = await file.read()
        import_result = exam_service.import_questions_from_docx(
            db, exam_id, file_bytes, creator_id=current_user.id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

    return import_result


@router.put("/{exam_id}/publish", response_model=ExamOut)
def toggle_publish_exam(
    exam_id: int,
    publish_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["teacher", "admin"]))
):
    exam = exam_service.get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # If teacher, ensure they are allowed to publish this exam
    if getattr(current_user, "role", None) == "teacher":
        if not exam_service.teacher_can_access_exam(db, current_user.id, exam):
            raise HTTPException(status_code=403, detail="Not allowed to publish this exam")

    published = publish_data.get("published", False)
    return exam_service.update_exam_published(db, exam_id, published)


@router.get("/{exam_id}/questions")
def get_exam_questions(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    questions = exam_service.get_questions_for_exam(db, exam_id)
    return questions


# -------------------- Generic exam routes (catch-all, must come last) --------------------

@router.get("/{exam_id}", response_model=ExamOut)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = exam_service.get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


@router.delete("/{exam_id}")
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["teacher", "admin"]))
):
    exam = exam_service.get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # If teacher, ensure they are allowed to delete this exam
    if getattr(current_user, "role", None) == "teacher":
        if not exam_service.teacher_can_access_exam(db, current_user.id, exam):
            raise HTTPException(status_code=403, detail="Not allowed to delete this exam")

    success = exam_service.delete_exam(db, exam_id)
    if not success:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"detail": "Exam deleted successfully"}
