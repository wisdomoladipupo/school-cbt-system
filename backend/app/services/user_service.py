from sqlalchemy.orm import Session
from ..models.user import User
from ..core.security import hash_password
import time
import random

def generate_registration_number(email: str) -> str:
    ts = int(time.time())
    rand = random.randint(100, 999)
    local = email.split("@")[0][:4].upper()
    return f"{local}-{ts}-{rand}"

def create_user(db: Session, full_name: str, email: str, password: str, role: str = "student", student_class: str = None):
    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role=role,
        student_class=student_class,
        registration_number=generate_registration_number(email) if role == "student" else None
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()
