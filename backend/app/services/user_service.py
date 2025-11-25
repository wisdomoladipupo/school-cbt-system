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

def update_user(db: Session, user_id: int, **kwargs):
    user = get_user(db, user_id)
    if not user:
        return None
    # allowed fields: full_name, password (hashed), role, student_class
    if 'full_name' in kwargs and kwargs['full_name'] is not None:
        user.full_name = kwargs['full_name']
    if 'password' in kwargs and kwargs['password']:
        user.hashed_password = hash_password(kwargs['password'])
    if 'role' in kwargs and kwargs['role'] is not None:
        user.role = kwargs['role']
    if 'student_class' in kwargs:
        user.student_class = kwargs['student_class']
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = get_user(db, user_id)
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True
