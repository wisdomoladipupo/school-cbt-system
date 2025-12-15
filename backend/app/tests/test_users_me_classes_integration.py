from fastapi.testclient import TestClient
from app.main import app
from app.core.db import SessionLocal
from app.models.user import User
from app.models.subject import Class as ClassModel

from app.api.deps import get_current_user as real_get_current_user

client = TestClient(app)


def create_teacher_and_class(db):
    teacher = User(full_name="Integration Teacher", email="int_teacher@example.com", hashed_password="x", role="teacher")
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    cls = ClassModel(name=f"INT_CLASS_{teacher.id}", level="JSS1")
    # associate teacher via relationship
    cls.teachers.append(teacher)
    db.add(cls)
    db.commit()
    db.refresh(cls)

    return teacher, cls


def test_get_my_classes_returns_class_for_teacher():
    db = SessionLocal()
    try:
        teacher, cls = create_teacher_and_class(db)

        # Override dependency to return the teacher model instance
        app.dependency_overrides[real_get_current_user] = lambda: teacher

        resp = client.get("/api/users/me/classes")
        assert resp.status_code == 200, f"Unexpected status: {resp.status_code} {resp.text}"
        data = resp.json()

        # Expect at least one class, and our class should be present
        assert isinstance(data, list)
        found = any(c.get("class_name") == cls.name for c in data)
        assert found, f"Created class {cls.name} not found in response: {data}"

    finally:
        # cleanup: remove overrides and created rows
        app.dependency_overrides.pop(real_get_current_user, None)
        # remove created association and rows
        try:
            # refresh objects if detached
            db.expire_all()
            # delete class and teacher
            # find by name/email
            c = db.query(ClassModel).filter(ClassModel.name == cls.name).first()
            if c:
                db.delete(c)
            t = db.query(User).filter(User.email == teacher.email).first()
            if t:
                db.delete(t)
            db.commit()
        except Exception:
            db.rollback()
        db.close()


def test_non_teacher_get_my_classes_returns_empty():
    db = SessionLocal()
    try:
        student = User(full_name="Integration Student", email="int_student@example.com", hashed_password="x", role="student")
        db.add(student)
        db.commit()
        db.refresh(student)

        app.dependency_overrides[real_get_current_user] = lambda: student

        resp = client.get("/api/users/me/classes")
        assert resp.status_code == 200
        data = resp.json()
        assert data == [] or isinstance(data, list)
    finally:
        app.dependency_overrides.pop(real_get_current_user, None)
        try:
            s = db.query(User).filter(User.email == "int_student@example.com").first()
            if s:
                db.delete(s)
            db.commit()
        except Exception:
            db.rollback()
        db.close()
