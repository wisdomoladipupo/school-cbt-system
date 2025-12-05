import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from core.db import Base, engine, SessionLocal
from services.user_service import create_user
from core.security import hash_password

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    from models.user import User

    # Ensure primary admin user exists
    admin_primary = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_primary:
        create_user(
            db,
            "Admin User",
            "admin@example.com",
            "adminpass",
            role="admin",
            passport="/uploads/default-admin.png",
        )
        print("Admin user created: admin@example.com / adminpass")

    # Also support the admin@school.local address used in some docs
    admin_school = db.query(User).filter(User.email == "admin@school.local").first()
    if not admin_school:
        create_user(
            db,
            "Admin User",
            "admin@school.local",
            "adminpass",
            role="admin",
            passport="/uploads/default-admin.png",
        )
        print("Admin user created: admin@school.local / adminpass")

    db.close()

if __name__ == "__main__":
    seed()
