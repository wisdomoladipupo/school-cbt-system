from pydantic import BaseModel, ConfigDict
from typing import Optional, List

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

class ClassCreate(BaseModel):
    name: str
    level: str  # NUR1, NUR2, etc.

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

class AssignStudentToClass(BaseModel):
    student_id: int
    class_id: int
    # Subjects will be auto-populated based on class level

class AssignTeacherToClass(BaseModel):
    teacher_id: int
    class_id: int

class AssignTeacherToSubject(BaseModel):
    teacher_id: int
    subject_id: int
    class_id: int

class TeacherSubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    teacher_id: int
    subject_id: int
    class_id: int
