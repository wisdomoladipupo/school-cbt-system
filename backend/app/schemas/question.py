from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

class QuestionCreate(BaseModel):
    exam_id: Optional[int] = None
    text: str
    options: List[str] = Field(min_length=2)
    correct_answer: int  # index in options list, 0-based
    marks: Optional[int] = 1
    image_url: Optional[str] = None  # URL to question image

class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    exam_id: Optional[int]
    text: str
    correct_answer: int
    options: List[str]
    marks: int
    image_url: Optional[str] = None


class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[int] = None
    marks: Optional[int] = None
    image_url: Optional[str] = None
