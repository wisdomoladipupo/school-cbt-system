from sqlalchemy.orm import Session
from ..models.result import Result
from ..models.question import Question
from ..models.exam import Exam

def grade_and_record(db: Session, student_id: int, exam_id: int, answers: list):
    # build a map question_id -> Question
    q_ids = [a['question_id'] for a in answers]
    questions = db.query(Question).filter(Question.id.in_(q_ids)).all()
    q_map = {q.id: q for q in questions}

    score = 0.0
    max_score = 0.0
    # evaluate
    for a in answers:
        qid = a['question_id']
        ans_index = a.get('answer_index')
        q = q_map.get(qid)
        if not q:
            continue
        max_score += q.marks
        if ans_index == q.correct_answer:
            score += q.marks

    result = Result(
        student_id=student_id,
        exam_id=exam_id,
        answers=answers,
        score=score,
        max_score=max_score
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result

def get_results_for_student(db: Session, student_id: int):
    return db.query(Result).filter(Result.student_id == student_id).all()

def get_results_for_exam(db: Session, exam_id: int):
    return db.query(Result).filter(Result.exam_id == exam_id).all()
