from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# ============================================
# SUBJECT SCHEMAS
# ============================================

class SubjectCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class SubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    description: Optional[str]


# ============================================
# CLASS SCHEMAS
# ============================================

class ClassCreate(BaseModel):
    name: str
    level: str  # e.g. NUR1, NUR2, PRI1, JSS1, etc.


class ClassUpdate(BaseModel):
    """
    Used for updating an existing class.
    All fields are optional to allow partial updates.
    """
    name: Optional[str] = None
    level: Optional[str] = None
    subject_ids: Optional[List[int]] = None


class ClassOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    level: str


class ClassWithSubjects(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    level: str
    subjects: List[SubjectOut]


# ============================================
# STUDENT–SUBJECT SCHEMAS
# ============================================

class StudentSubjectCreate(BaseModel):
    student_id: int
    subject_id: int
    class_id: int


class StudentSubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    subject_id: int
    class_id: int


# ============================================
# ASSIGNMENT SCHEMAS
# ============================================

class AssignStudentToClass(BaseModel):
    student_id: int


class AssignTeacherToClass(BaseModel):
    teacher_id: int


class AssignTeacherToSubject(BaseModel):
    teacher_id: int
    subject_id: int


class TeacherSubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teacher_id: int
    subject_id: int
    class_id: int


class TeacherRequestCreate(BaseModel):
    subject_id: int


class TeacherRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teacher_id: int
    subject_id: int
    class_id: int
    status: str
