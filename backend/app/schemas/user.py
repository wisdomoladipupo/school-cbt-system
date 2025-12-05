from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Literal

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Literal["admin", "teacher", "student"] = "student"
    student_class: Optional[str] = None
    # Passport photo data (could be a data URL or uploaded image path)
    passport: str

class LoginRequest(BaseModel):
    email: str  # Use plain str instead of EmailStr to accept a wider range of email formats
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    # Use a plain string here to avoid strict EmailStr validation on existing
    # or special-use addresses (e.g. admin@school.local) when serializing users.
    email: str
    role: str
    student_class: Optional[str]
    registration_number: Optional[str]
    passport: Optional[str]
    class_id: Optional[int] = None  # Student's assigned class ID


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[Literal["admin", "teacher", "student"]]
    student_class: Optional[str] = None
    passport: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int
    role: str
