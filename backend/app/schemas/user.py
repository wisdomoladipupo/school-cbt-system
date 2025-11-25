from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Literal

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Literal["admin", "teacher", "student"] = "student"
    student_class: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    full_name: str
    email: EmailStr
    role: str
    student_class: Optional[str]
    registration_number: Optional[str]


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[Literal["admin", "teacher", "student"]]
    student_class: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int
    role: str
