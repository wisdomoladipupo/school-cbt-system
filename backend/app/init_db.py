from .core.db import Base, engine, SessionLocal
from .services.user_service import create_user, generate_registration_number
from .core.security import hash_password

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # seed admin if not exists
    from .models.user import User
    admin = db.query(User).filter(User.email == "admin@school.local").first()
    if not admin:
        create_user(db, "Admin User", "admin@school.local", "adminpass", role="admin")
        print("Admin user created: admin@school.local / adminpass")
    db.close()

if __name__ == "__main__":
    seed()
