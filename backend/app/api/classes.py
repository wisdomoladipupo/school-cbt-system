from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..schemas.subject import (
    SubjectCreate,
    SubjectOut,
    ClassCreate,
    ClassOut,
    ClassUpdate,
    ClassWithSubjects,
    AssignStudentToClass,
    AssignTeacherToClass,
    AssignTeacherToSubject,
    TeacherSubjectOut,
)
from ..services.subject_service import SubjectService, ClassService
from ..core.security import decode_access_token
from ..models.user import User
from ..models.subject import NIGERIAN_SCHOOL_SUBJECTS, SCHOOL_LEVEL_DISPLAY
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/classes", tags=["classes"])


def get_current_user(token: str, db: Session = Depends(get_db)) -> User:
    """Get current user from token"""
    decoded = decode_access_token(token)
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == decoded.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ============================================
# SUBJECT ENDPOINTS
# ============================================

@router.get("/levels", response_model=list[dict])
def get_school_levels():
    """Get all available school levels in Nigerian system."""
    try:
        levels = [
            {
                "code": level,
                "display_name": SCHOOL_LEVEL_DISPLAY.get(level, level)
            }
            for level in sorted(NIGERIAN_SCHOOL_SUBJECTS.keys())
        ]

        return levels

    except Exception as e:
        logger.error(f"Error fetching school levels: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch school levels")


@router.get("/subjects", response_model=list[SubjectOut])
def list_subjects(db: Session = Depends(get_db)):
    """Get all subjects."""
    try:
        return SubjectService.list_subjects(db)
    except Exception as e:
        logger.error(f"Error fetching subjects: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch subjects")


@router.post("/subjects", response_model=SubjectOut)
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    """Create a new subject."""
    try:
        return SubjectService.create_subject(db, subject)
    except Exception as e:
        logger.error(f"Error creating subject: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create subject")


# ============================================
# CLASS ENDPOINTS
# ============================================

@router.post("", response_model=ClassOut)
def create_class(class_data: ClassCreate, db: Session = Depends(get_db)):
    """Create a new class with subjects auto-populated for its level."""
    try:
        return ClassService.create_class(db, class_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating class: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create class")


@router.get("", response_model=list[ClassOut])
def list_classes(db: Session = Depends(get_db)):
    """Get all classes."""
    try:
        return ClassService.list_classes(db)
    except Exception as e:
        logger.error(f"Error fetching classes: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch classes")


@router.get("/{class_id}", response_model=ClassWithSubjects)
def get_class(class_id: int, db: Session = Depends(get_db)):
    """Get a specific class with its subjects."""
    try:
        db_class = ClassService.get_class_by_id(db, class_id)
        if not db_class:
            raise HTTPException(status_code=404, detail="Class not found")

        return db_class

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error fetching class: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch class")


@router.get("/level/{level}", response_model=list[ClassOut])
def get_classes_by_level(level: str, db: Session = Depends(get_db)):
    """Get all classes for a specific level."""
    try:
        return ClassService.list_classes_by_level(db, level)
    except Exception as e:
        logger.error(f"Error fetching classes by level: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch classes")


@router.put("/{class_id}", response_model=ClassOut)
def update_class(class_id: int, data: ClassUpdate, db: Session = Depends(get_db)):
    """Update class name, level, and subjects."""
    try:
        db_class = ClassService.get_class_by_id(db, class_id)
        if not db_class:
            raise HTTPException(status_code=404, detail="Class not found")

        # Update name (optional)
        if data.name is not None:
            db_class.name = data.name

        # Update level (optional)
        if data.level is not None:
            db_class.level = data.level

        # Update subjects (optional)
        if data.subject_ids is not None:
            subjects = db.query(Subject).filter(
                Subject.id.in_(data.subject_ids)
            ).all()
            db_class.subjects = subjects

        db.commit()
        db.refresh(db_class)
        return db_class

    except Exception as e:
        logger.error(f"Error updating class: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update class")

# ============================================
# STUDENT ASSIGNMENT ENDPOINTS
# ============================================


@router.post("/{class_id}/assign-student")
def assign_student_to_class(
    class_id: int,
    payload: AssignStudentToClass,
    db: Session = Depends(get_db),
):
    """Assign a student to a class and auto-create exams for all subjects"""
    try:
        # Verify class exists
        db_class = ClassService.get_class_by_id(db, class_id)
        if not db_class:
            raise HTTPException(status_code=404, detail="Class not found")

        # Verify student exists
        student = db.query(User).filter(User.id == payload.student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        result = ClassService.assign_student_to_class(
            db, payload.student_id, class_id
        )
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error assigning student to class: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to assign student to class"
        )


@router.get("/{class_id}/students")
def get_class_students(class_id: int, db: Session = Depends(get_db)):
    """Get all students in a class"""
    try:
        students = ClassService.get_class_students(db, class_id)
        return [
            {
                "id": s.id,
                "full_name": s.full_name,
                "email": s.email,
                "role": s.role,
            }
            for s in students
        ]
    except Exception as e:
        logger.error(f"Error fetching class students: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch students")


# ============================================
# TEACHER ASSIGNMENT ENDPOINTS
# ============================================


@router.post("/{class_id}/assign-teacher")
def assign_teacher_to_class(
    class_id: int,
    payload: AssignTeacherToClass,
    db: Session = Depends(get_db),
):
    """Assign a teacher to a class"""
    try:
        # Verify class exists
        db_class = ClassService.get_class_by_id(db, class_id)
        if not db_class:
            raise HTTPException(status_code=404, detail="Class not found")

        # Verify teacher exists
        teacher = db.query(User).filter(User.id == payload.teacher_id).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")

        result = ClassService.assign_teacher_to_class(
            db, payload.teacher_id, class_id
        )
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error assigning teacher to class: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to assign teacher to class"
        )


@router.get("/{class_id}/teachers")
def get_class_teachers(class_id: int, db: Session = Depends(get_db)):
    """Get all teachers for a class"""
    try:
        db_class = ClassService.get_class_by_id(db, class_id)
        if not db_class:
            raise HTTPException(status_code=404, detail="Class not found")

        return [
            {
                "id": t.id,
                "full_name": t.full_name,
                "email": t.email,
                "role": t.role,
            }
            for t in db_class.teachers
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching class teachers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch teachers")


# ============================================
# TEACHER-SUBJECT ASSIGNMENT ENDPOINTS
# ============================================


@router.post("/{class_id}/assign-teacher-to-subject")
def assign_teacher_to_subject(
    class_id: int,
    payload: AssignTeacherToSubject,
    db: Session = Depends(get_db),
):
    """Assign a teacher to a subject in a class"""
    try:
        # Verify class exists
        db_class = ClassService.get_class_by_id(db, class_id)
        if not db_class:
            raise HTTPException(status_code=404, detail="Class not found")

        # Verify teacher exists
        teacher = db.query(User).filter(User.id == payload.teacher_id).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")

        result = ClassService.assign_teacher_to_subject(
            db, payload.teacher_id, payload.subject_id, class_id
        )
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error assigning teacher to subject: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to assign teacher to subject"
        )


@router.get("/{class_id}/subjects-with-teachers")
def get_class_subjects_with_teachers(class_id: int, db: Session = Depends(get_db)):
    """Get all subjects in a class with their assigned teachers"""
    try:
        db_class = ClassService.get_class_by_id(db, class_id)
        if not db_class:
            raise HTTPException(status_code=404, detail="Class not found")

        result = ClassService.get_class_subjects_with_teachers(db, class_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching subjects with teachers: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch subjects with teachers"
        )


@router.get("/subject/{subject_id}/teachers")
def get_subject_teachers(
    subject_id: int, class_id: int, db: Session = Depends(get_db)
):
    """Get all teachers assigned to a subject in a class"""
    try:
        result = ClassService.get_subject_teachers(db, subject_id, class_id)
        return result
    except Exception as e:
        logger.error(f"Error fetching subject teachers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch subject teachers")


@router.put("/{class_id}/subjects", response_model=ClassOut)
def update_class_subjects(class_id: int, subject_ids: list[int], db: Session = Depends(get_db)):
    """Update subjects for a class. Replaces all current subjects."""
    try:
        db_class = ClassService.update_class_subjects(db, class_id, subject_ids)
        return db_class
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating class subjects: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update class subjects")


@router.post("/{class_id}/subjects/{subject_id}", response_model=ClassOut)
def add_subject_to_class(class_id: int, subject_id: int, db: Session = Depends(get_db)):
    """Add a subject to a class"""
    try:
        db_class = ClassService.add_subject_to_class(db, class_id, subject_id)
        return db_class
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding subject to class: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add subject to class")


@router.delete("/{class_id}/subjects/{subject_id}", response_model=ClassOut)
def remove_subject_from_class(class_id: int, subject_id: int, db: Session = Depends(get_db)):
    """Remove a subject from a class"""
    try:
        db_class = ClassService.remove_subject_from_class(db, class_id, subject_id)
        return db_class
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error removing subject from class: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove subject from class")
