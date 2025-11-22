from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any

class AnswerItem(BaseModel):
    question_id: int
    answer_index: int  # index of selected option

class SubmitResult(BaseModel):
    exam_id: int
    answers: List[AnswerItem]

class ResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    student_id: int
    exam_id: int
    answers: List[Dict[str, Any]]
    score: float
    max_score: float
