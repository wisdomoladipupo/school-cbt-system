

from sqlalchemy.orm import Session
from ..models.exam import Exam
from ..models.question import Question
from ..models.subject import TeacherSubject
from ..models.user import User
from ..schemas.exam import ExamCreate
from typing import List, Optional
from docx import Document
from fastapi import UploadFile
from sqlalchemy import or_, and_
import tempfile
from io import BytesIO
import re


# CREATE EXAM
def create_exam(db: Session, creator_id: int, exam_in: ExamCreate):
    exam = Exam(
        title=exam_in.title,
        description=exam_in.description,
        duration_minutes=exam_in.duration_minutes,
        published=exam_in.published if exam_in.published is not None else False,
        created_by=creator_id,
        class_id=getattr(exam_in, "class_id", None),
        subject_id=getattr(exam_in, "subject_id", None),
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam

# GET EXAM
def get_exam(db: Session, exam_id: int):
    return db.query(Exam).filter(Exam.id == exam_id).first()

# LIST EXAMS
def list_exams(db: Session, published_only: bool = True, teacher_id: Optional[int] = None, student_id: Optional[int] = None):
    """List exams, optionally filtered to published ones only.

    If `teacher_id` is provided the results include:
    1. Exams belonging to classes/subjects the teacher is assigned to, OR
    2. Exams created by the teacher themselves
    
    If `student_id` is provided, results are restricted to exams for the
    student's enrolled class(es).
    """
    from ..models.subject import Class
    
    query = db.query(Exam)

    # Filter by student's classes
    if student_id is not None:
        # Get all classes the student is enrolled in
        student_classes = db.query(Class).join(Class.students).filter(User.id == student_id).all()
        class_ids = [c.id for c in student_classes]
        
        if not class_ids:
            # Student not enrolled in any class, return empty
            return []
        
        # Filter exams to those for the student's classes
        query = query.filter(Exam.class_id.in_(class_ids))
    
    # Filter by teacher assignments and created exams
    elif teacher_id is not None:
        ts = db.query(TeacherSubject).filter(TeacherSubject.teacher_id == teacher_id).all()

        # Build conditions: exams for assigned classes/subjects OR exams created by teacher
        conds = [Exam.created_by == teacher_id]  # Always include exams created by teacher
        
        # Add assignments if they exist
        for t in ts:
            conds.append(and_(Exam.class_id == t.class_id, Exam.subject_id == t.subject_id))

        query = query.filter(or_(*conds))

    if published_only:
        query = query.filter(Exam.published == True)
    return query.all()


def teacher_can_access_exam(db: Session, teacher_id: int, exam: Exam) -> bool:
    """Return True if the teacher is allowed to manage/access the given exam.

    A teacher can access the exam if:
    1. They created the exam themselves, OR
    2. They are assigned to the exam's class/subject (via `teacher_subjects`)
    """
    if not exam:
        return False

    # Teachers can always manage exams they created
    if exam.created_by == teacher_id:
        return True

    # Check if teacher is assigned to this exam's class/subject
    # Require an exact teacher_subject match for (class_id, subject_id)
    if exam.class_id is not None and exam.subject_id is not None:
        found = (
            db.query(TeacherSubject)
            .filter(
                TeacherSubject.teacher_id == teacher_id,
                TeacherSubject.class_id == exam.class_id,
                TeacherSubject.subject_id == exam.subject_id,
            )
            .first()
        )
        return bool(found)

    # If exam only has class_id, allow if teacher assigned to that class
    if exam.class_id is not None:
        found = db.query(TeacherSubject).filter(TeacherSubject.teacher_id == teacher_id, TeacherSubject.class_id == exam.class_id).first()
        return bool(found)

    # Otherwise deny
    return False

# DELETE EXAM
def delete_exam(db: Session, exam_id: int) -> bool:
    """Delete an exam and return True if successful"""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        return False
    db.delete(exam)
    db.commit()
    return True

# UPDATE EXAM
def update_exam(db: Session, exam_id: int, title: Optional[str] = None, description: Optional[str] = None, duration_minutes: Optional[int] = None, class_id: Optional[int] = None, subject_id: Optional[int] = None):
    """Update exam fields"""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        return None
    if title is not None:
        exam.title = title
    if description is not None:
        exam.description = description
    if duration_minutes is not None:
        exam.duration_minutes = duration_minutes
    if class_id is not None:
        exam.class_id = class_id
    if subject_id is not None:
        exam.subject_id = subject_id
    db.commit()
    db.refresh(exam)
    return exam

# UPDATE EXAM PUBLISHED STATUS
def update_exam_published(db: Session, exam_id: int, published: bool):
    """Update the published status of an exam"""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        return None
    exam.published = published
    db.commit()
    db.refresh(exam)
    return exam

# GET QUESTIONS
def get_questions_for_exam(db: Session, exam_id: int):
    return db.query(Question).filter(Question.exam_id == exam_id).all()


def get_question(db: Session, question_id: int):
    return db.query(Question).filter(Question.id == question_id).first()

def add_question(db: Session, creator_id: int, exam_id: int, text: str, options: list, correct_answer: int, marks: int = 1, image_url: str = None):
    if not options:
        raise ValueError("Options cannot be empty")
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise ValueError("Exam not found")
    if correct_answer < 0 or correct_answer >= len(options):
        raise ValueError("correct_answer index out of range")

    q = Question(
        exam_id=exam_id,
        text=text,
        options=options,
        correct_answer=correct_answer,
        marks=marks,
        image_url=image_url,
        created_by=creator_id
    )
    try:
        db.add(q)
        db.commit()
        db.refresh(q)
    except Exception:
        db.rollback()
        raise
    return q


# UPDATE QUESTION
def update_question(db: Session, question_id: int, updater_id: int, text: Optional[str] = None, options: Optional[list] = None, correct_answer: Optional[int] = None, marks: Optional[int] = None, image_url: Optional[str] = None):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise ValueError("Question not found")

    # If options provided, validate correct_answer index (if provided)
    if options is not None:
        if len(options) < 2:
            raise ValueError("Options must contain at least two items")
        q.options = options
    if correct_answer is not None:
        if q.options is None:
            raise ValueError("Cannot set correct_answer without options")
        if correct_answer < 0 or correct_answer >= len(q.options):
            raise ValueError("correct_answer index out of range")
        q.correct_answer = correct_answer
    if text is not None:
        q.text = text
    if marks is not None:
        q.marks = marks
    if image_url is not None:
        q.image_url = image_url

    try:
        db.add(q)
        db.commit()
        db.refresh(q)
    except Exception:
        db.rollback()
        raise
    return q


# DELETE QUESTION
def delete_question(db: Session, question_id: int) -> bool:
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        return False
    try:
        db.delete(q)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True


# existing functions...

def import_questions_from_docx(db: Session, exam_id: int, file_bytes: bytes, creator_id: int):
    """
    Parse a docx from bytes and create questions for the given exam.
    Supports multiple question formats:
    - Numbered: "1. Question text" / "A. Option" / "Answer: A"
    - Bullet: "• Question" / "A) Option" / "Answer: A"
    
    Returns dict with success status and number of questions created.
    """
    questions_created = 0
    questions_skipped = 0
    errors = []

    # Basic validations
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise ValueError("Exam not found")

    try:
        doc = Document(BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Failed to parse document: {str(e)}")

    # Collect non-empty paragraph texts
    paras = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]

    if not paras:
        raise ValueError("Document contains no questions")

    # Parse questions using state machine
    i = 0
    while i < len(paras):
        line = paras[i]

        # Detect question start (numbered, bullet, or plain text)
        is_question = False
        question_text = line
        
        # Check for numbered question (1., 1), etc.)
        num_match = re.match(r"^\s*\d+[.)\]]\s*(.+)$", line)
        if num_match:
            question_text = num_match.group(1).strip()
            is_question = True
        # Check for bullet question (•, -, *, etc.)
        elif re.match(r"^\s*[•\-*]\s+(.+)$", line):
            is_question = True
        # Plain text question (if not an option or answer line)
        elif not re.match(r"^\s*[A-Da-d][.)\]]\s", line) and not line.lower().startswith("answer"):
            is_question = True
        
        if is_question:
            i += 1

            # Accumulate multi-line question text
            while i < len(paras):
                next_line = paras[i]
                # Stop if we hit options
                if re.match(r"^\s*[A-Da-d][.)\]]\s", next_line):
                    break
                # Stop if we hit answer
                if next_line.lower().startswith("answer"):
                    break
                # Stop if we hit new question
                if re.match(r"^\s*\d+[.)\]]\s", next_line) or next_line.startswith("•"):
                    break
                question_text += " " + next_line.strip()
                i += 1

            # Collect options
            options = []
            while i < len(paras):
                opt_match = re.match(r"^\s*([A-Da-d])[.)\]]\s*(.+)$", paras[i])
                if opt_match:
                    options.append(opt_match.group(2).strip())
                    i += 1
                else:
                    break

            # Look for answer
            correct_answer = None
            if i < len(paras):
                ans_line = paras[i].strip()
                ans_match = re.search(r"[Aa]nswer\s*[:=]?\s*([A-Da-d])", ans_line)
                if ans_match:
                    char = ans_match.group(1).upper()
                    correct_answer = ord(char) - 65  # A->0, B->1, etc.
                    i += 1

            # Create question if we have required data
            if len(options) >= 2 and correct_answer is not None:
                try:
                    add_question(
                        db,
                        creator_id=creator_id,
                        exam_id=exam_id,
                        text=question_text.strip(),
                        options=options,
                        correct_answer=correct_answer,
                        marks=1
                    )
                    questions_created += 1
                except Exception as e:
                    questions_skipped += 1
                    errors.append(f"Q: {question_text[:50]}... - {str(e)}")
            elif len(options) > 0 or question_text:
                questions_skipped += 1
                reason = f"Options: {len(options)}, Answer: {correct_answer}"
                errors.append(f"Incomplete: {question_text[:50]}... ({reason})")
        else:
            i += 1

    return {
        "success": True,
        "questions_created": questions_created,
        "questions_skipped": questions_skipped,
        "errors": errors[:10]  # Return first 10 errors
    }

