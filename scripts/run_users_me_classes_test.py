"""
Run a lightweight integration check for GET /api/users/me/classes without pytest.
Creates a teacher and class in the DB, overrides dependency, calls endpoint and reports success/failure.
"""
from fastapi.testclient import TestClient
from app.main import app
from app.core.db import SessionLocal
from app.models.user import User
from app.models.subject import Class as ClassModel
from app.api.deps import get_current_user as real_get_current_user

client = TestClient(app)

def create_teacher_and_class(db):
    teacher = User(full_name="Integration Teacher", email="int_runner@example.com", hashed_password="x", role="teacher")
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    cls = ClassModel(name=f"RUNNER_CLASS_{teacher.id}", level="JSS1")
    cls.teachers.append(teacher)
    db.add(cls)
    db.commit()
    db.refresh(cls)

    return teacher, cls


def main():
    db = SessionLocal()
    try:
        teacher, cls = create_teacher_and_class(db)
        app.dependency_overrides[real_get_current_user] = lambda: teacher

        resp = client.get("/api/users/me/classes")
        print("Status code:", resp.status_code)
        print("Response JSON:", resp.json())

        data = resp.json()
        found = any(c.get("class_name") == cls.name for c in data)
        if resp.status_code == 200 and found:
            print("SUCCESS: class found in /api/users/me/classes")
            rc = 0
        else:
            print("FAIL: expected class not found or unexpected status")
            rc = 2

    except Exception as e:
        print("ERROR during test run:", e)
        rc = 3
    finally:
        app.dependency_overrides.pop(real_get_current_user, None)
        try:
            db.expire_all()
            c = db.query(ClassModel).filter(ClassModel.name == cls.name).first()
            if c:
                db.delete(c)
            t = db.query(User).filter(User.email == teacher.email).first()
            if t:
                db.delete(t)
            db.commit()
        except Exception as e:
            print("CLEANUP ERROR:", e)
            db.rollback()
        db.close()

    raise SystemExit(rc)

if __name__ == "__main__":
    main()
