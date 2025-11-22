from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

class QuestionCreate(BaseModel):
    exam_id: Optional[int] = None
    text: str
    options: List[str] = Field(min_length=2)
    correct_answer: int  # index in options list, 0-based
    marks: Optional[int] = 1

class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    exam_id: Optional[int]
    text: str
    options: List[str]
    marks: int
