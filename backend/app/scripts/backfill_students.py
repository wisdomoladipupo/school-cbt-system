from ..core.db import SessionLocal
from ..services.user_service import generate_registration_number
from ..models.user import User


def backfill():
    db = SessionLocal()
    students = db.query(User).filter(User.role == "student", User.registration_number == None).all()
    print(f"Found {len(students)} students without registration numbers")
    for s in students:
        try:
            reg = generate_registration_number(db)
            s.registration_number = reg
            db.add(s)
            db.commit()
            print(f"Updated {s.email} -> {reg}")
        except Exception as e:
            print(f"Failed to update {s.email}: {e}")
    db.close()


if __name__ == "__main__":
    backfill()
