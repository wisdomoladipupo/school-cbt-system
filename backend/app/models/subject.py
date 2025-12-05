from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.db import Base

# Association table for many-to-many relationship between teachers and classes
teacher_class_association = Table(
    "teacher_class",
    Base.metadata,
    Column("teacher_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("class_id", Integer, ForeignKey("classes.id"), primary_key=True),
)

# Association table for many-to-many relationship between students and classes
student_class_association = Table(
    "student_class",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("class_id", Integer, ForeignKey("classes.id"), primary_key=True),
)

# Association table for many-to-many relationship between classes and subjects
class_subject_association = Table(
    "class_subject",
    Base.metadata,
    Column("class_id", Integer, ForeignKey("classes.id"), primary_key=True),
    Column("subject_id", Integer, ForeignKey("subjects.id"), primary_key=True),
)

# Association table for many-to-many relationship between teachers and subjects in classes
teacher_subject_association = Table(
    "teacher_subject",
    Base.metadata,
    Column("teacher_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("subject_id", Integer, ForeignKey("subjects.id"), primary_key=True),
    Column("class_id", Integer, ForeignKey("classes.id"), primary_key=True),
)


class Class(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)  # e.g., "JSS1A", "SS2B"
    level = Column(String, nullable=False)  # NUR1, NUR2, NUR3, JSS1, JSS2, JSS3, SS1, SS2, SS3
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships - use lazy='selectin' to avoid circular imports
    teachers = relationship(
        "User",
        secondary=teacher_class_association,
        lazy="selectin",
    )
    students = relationship(
        "User",
        secondary=student_class_association,
        lazy="selectin",
    )
    subjects = relationship(
        "Subject",
        secondary=class_subject_association,
        lazy="selectin",
    )


class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)  # e.g., "English Language", "Mathematics"
    code = Column(String, nullable=False, unique=True)  # e.g., "ENG", "MAT"
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StudentSubject(Base):
    __tablename__ = "student_subjects"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("User", backref="student_subjects")
    subject = relationship("Subject", backref="student_subjects")
    class_obj = relationship("Class", backref="student_subjects")


class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    teacher = relationship("User", backref="teacher_subjects")
    subject = relationship("Subject", backref="teacher_subjects")
    class_obj = relationship("Class", backref="teacher_subjects")


class TeacherSubjectRequest(Base):
    __tablename__ = "teacher_subject_requests"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    status = Column(String, default="pending")  # pending | approved | rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    teacher = relationship("User", backref="teacher_subject_requests")
    subject = relationship("Subject", backref="teacher_subject_requests")
    class_obj = relationship("Class", backref="teacher_subject_requests")


# Map Nigerian school levels to their subjects
NIGERIAN_SCHOOL_SUBJECTS = {
    "NUR1": ["Numeracy", "Literacy", "Creative Activities", "Play/Breaks"],
    "NUR2": ["Numeracy", "Literacy", "Creative Activities", "Play/Breaks"],
    "NUR3": ["Numeracy", "Literacy", "Creative Activities", "Play/Breaks"],
    "PRY1": ["English Language", "Mathematics", "Science", "Social Studies", "Physical Education", "Music", "Art and Craft"],
    "PRY2": ["English Language", "Mathematics", "Science", "Social Studies", "Physical Education", "Music", "Art and Craft"],
    "PRY3": ["English Language", "Mathematics", "Science", "Social Studies", "Physical Education", "Music", "Art and Craft"],
    "PRY4": ["English Language", "Mathematics", "Science", "Social Studies", "Physical Education", "Music", "Art and Craft"],
    "PRY5": ["English Language", "Mathematics", "Science", "Social Studies", "Physical Education", "Music", "Art and Craft"],
    "PRY6": ["English Language", "Mathematics", "Science", "Social Studies", "Physical Education", "Music", "Art and Craft"],
    "JSS1": [
        "English Language",
        "Mathematics",
        "Integrated Science",
        "Social Studies",
        "Civic Education",
        "Computer Science",
        "Physical Education",
        "Music",
        "Visual Arts",
    ],
    "JSS2": [
        "English Language",
        "Mathematics",
        "Integrated Science",
        "Social Studies",
        "Civic Education",
        "Computer Science",
        "Physical Education",
        "Music",
        "Visual Arts",
    ],
    "JSS3": [
        "English Language",
        "Mathematics",
        "Integrated Science",
        "Social Studies",
        "Civic Education",
        "Computer Science",
        "Physical Education",
        "Music",
        "Visual Arts",
    ],
    "SS1": [
        "English Language",
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "History",
        "Government",
        "Economics",
        "Literature in English",
        "Computer Science",
        "Physical Education",
        "Technical Drawing",
    ],
    "SS2": [
        "English Language",
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "History",
        "Government",
        "Economics",
        "Literature in English",
        "Computer Science",
        "Physical Education",
        "Technical Drawing",
    ],
    "SS3": [
        "English Language",
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "History",
        "Government",
        "Economics",
        "Literature in English",
        "Computer Science",
        "Physical Education",
        "Technical Drawing",
    ],
}

# Display names for school levels
SCHOOL_LEVEL_DISPLAY = {
    "NUR1": "Nursery 1",
    "NUR2": "Nursery 2",
    "NUR3": "Nursery 3",
    "PRY1": "Primary 1",
    "PRY2": "Primary 2",
    "PRY3": "Primary 3",
    "PRY4": "Primary 4",
    "PRY5": "Primary 5",
    "PRY6": "Primary 6",
    "JSS1": "JSS 1",
    "JSS2": "JSS 2",
    "JSS3": "JSS 3",
    "SS1": "SS 1",
    "SS2": "SS 2",
    "SS3": "SS 3",
}

