from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..core.db import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_answer = Column(Integer, nullable=False)
    marks = Column(Integer, default=1)
    image_url = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))

    exam = relationship("Exam", back_populates="questions")
    creator = relationship("User", backref="questions_created")
