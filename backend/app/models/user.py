from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..core.db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student")  # admin | teacher | student
    student_class = Column(String, nullable=True)  # e.g., "JSS1", "SS2"
    registration_number = Column(String, nullable=True, unique=True)
    # URL or path to the user's passport/photo image
    passport = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
