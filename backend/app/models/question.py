from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..core.db import Base

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=True)
    text = Column(Text, nullable=False)
    # options stored as JSON list: ["A", "B", "C", "D"]
    options = Column(JSON, nullable=False)
    # correct_answer stores the index or value to compare (we'll use index)
    correct_answer = Column(Integer, nullable=False)
    marks = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))

    exam = relationship("Exam", backref="questions")
