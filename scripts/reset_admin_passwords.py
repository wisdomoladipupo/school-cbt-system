"""
Reset admin users' passwords to `adminpass`.
Run from repo root: python .\school-cbt-sys\scripts\reset_admin_passwords.py
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure we can import app modules
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, 'backend', 'school_cbt.db')
if not os.path.exists(DB_PATH):
    print('DB not found at', DB_PATH)
    raise SystemExit(1)

# Use SQLAlchemy same as app
sys.path.insert(0, os.path.join(ROOT, 'backend'))
from app.core.config import settings
from app.core.security import hash_password

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

ADMIN_EMAILS = ["admin@example.com", "admin@school.local"]
NEW_PASS = 'adminpass'

s = SessionLocal()
try:
    from app.models.user import User
    changed = 0
    for email in ADMIN_EMAILS:
        u = s.query(User).filter(User.email == email).first()
        if u:
            u.hashed_password = hash_password(NEW_PASS)
            s.add(u)
            changed += 1
            print('Updated password for', email)
        else:
            print('No user found for', email)
    s.commit()
    print('Done. Updated:', changed)
finally:
    s.close()
