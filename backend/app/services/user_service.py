from sqlalchemy.orm import Session
from ..models.user import User
from ..core.security import hash_password
import time
import random

def generate_registration_number(db: Session, prefix: str = "NG/EEV") -> str:
    """Generate a registration number like NG/EEV/0427/A ensuring uniqueness.

    Format: NG/EEV/<4-digit-number>/<UPPER_LETTER>
    """
    # Desired format: NG/EEV/1234A (no slash before the letter)
    for _ in range(10):
        digits = random.randint(0, 9999)
        digits_str = str(digits).zfill(4)
        letter = chr(random.randint(65, 90))  # A-Z
        reg = f"{prefix}/{digits_str}{letter}"
        # Ensure uniqueness in DB
        exists = db.query(User).filter(User.registration_number == reg).first()
        if not exists:
            return reg
    # fallback: always use 4 digits and a random letter
    digits = random.randint(0, 9999)
    digits_str = str(digits).zfill(4)
    letter = random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    return f"{prefix}/{digits_str}{letter}"

def create_user(db: Session, full_name: str, email: str, password: str, role: str = "student", student_class: str = None, passport: str = None):
    if not passport:
        raise ValueError("Passport/photo is required for all users")

    reg_num = None
    if role == "student":
        reg_num = generate_registration_number(db)

    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role=role,
        student_class=student_class,
        registration_number=reg_num,
        passport=passport,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_registration_number(db: Session, reg: str):
    return db.query(User).filter(User.registration_number == reg).first()

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
    if 'passport' in kwargs:
        user.passport = kwargs['passport']
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
