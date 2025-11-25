from pydantic import BaseModel, ConfigDict
from typing import Optional

class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: Optional[int] = 30
    published: Optional[bool] = False
    class_id: Optional[int] = None
    subject_id: Optional[int] = None

class ExamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    title: str
    description: Optional[str]
    duration_minutes: int
    published: bool
    created_by: int
    class_id: Optional[int] = None
    subject_id: Optional[int] = None
