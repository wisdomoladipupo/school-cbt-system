from sqlalchemy.orm import Session
from ..models.exam import Exam
from ..models.question import Question
from ..schemas.exam import ExamCreate
from typing import List

def create_exam(db: Session, creator_id: int, exam_in: ExamCreate):
    exam = Exam(
        title=exam_in.title,
        description=exam_in.description,
        duration_minutes=exam_in.duration_minutes,
        published=exam_in.published,
        created_by=creator_id
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam

def get_exam(db: Session, exam_id: int):
    return db.query(Exam).filter(Exam.id == exam_id).first()

def list_exams(db: Session, published_only: bool = True):
    q = db.query(Exam)
    if published_only:
        q = q.filter(Exam.published == True)
    return q.all()

def add_question(db: Session, creator_id: int, exam_id: int, text: str, options: list, correct_answer: int, marks: int = 1):
    q = Question(
        exam_id=exam_id,
        text=text,
        options=options,
        correct_answer=correct_answer,
        marks=marks,
        created_by=creator_id
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q

def get_questions_for_exam(db: Session, exam_id: int):
    return db.query(Question).filter(Question.exam_id == exam_id).all()

