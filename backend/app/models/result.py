from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from ..core.db import Base

class Result(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    exam_id = Column(Integer, ForeignKey("exams.id"))
    # answers: JSON list of dicts e.g. [{"question_id":1,"answer_index":2}, ...]
    answers = Column(JSON, nullable=False)
    score = Column(Float, default=0.0)
    max_score = Column(Float, default=0.0)
    taken_at = Column(DateTime(timezone=True), server_default=func.now())
