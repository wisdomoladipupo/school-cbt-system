
    @staticmethod
    def update_class_subjects(db: Session, class_id: int, subject_ids: list[int]) -> Class:
        """Update subjects for a class. Replaces all current subjects with the provided list."""
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise ValueError("Class not found")
        
        # Clear existing subjects
        class_obj.subjects = []
        
        # Add new subjects
        for subject_id in subject_ids:
            subject = SubjectService.get_subject_by_id(db, subject_id)
            if not subject:
                raise ValueError(f"Subject {subject_id} not found")
            class_obj.subjects.append(subject)
        
        db.commit()
        db.refresh(class_obj)
        return class_obj

    @staticmethod
    def add_subject_to_class(db: Session, class_id: int, subject_id: int) -> Class:
        """Add a subject to a class"""
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise ValueError("Class not found")
        
        subject = SubjectService.get_subject_by_id(db, subject_id)
        if not subject:
            raise ValueError("Subject not found")
        
        if subject not in class_obj.subjects:
            class_obj.subjects.append(subject)
            db.commit()
            db.refresh(class_obj)
        
        return class_obj

    @staticmethod
    def remove_subject_from_class(db: Session, class_id: int, subject_id: int) -> Class:
        """Remove a subject from a class"""
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise ValueError("Class not found")
        
        subject = SubjectService.get_subject_by_id(db, subject_id)
        if not subject:
            raise ValueError("Subject not found")
        
        if subject in class_obj.subjects:
            class_obj.subjects.remove(subject)
            db.commit()
            db.refresh(class_obj)
        
        return class_obj
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..models.subject import (
    Subject,
    Class,
    StudentSubject,
    NIGERIAN_SCHOOL_SUBJECTS,
)
from ..models.exam import Exam
from ..models.user import User
from ..schemas.subject import (
    SubjectCreate,
    ClassCreate,
    StudentSubjectCreate,
    AssignStudentToClass,
)


class SubjectService:
    @staticmethod
    def create_subject(db: Session, subject: SubjectCreate) -> Subject:
        db_subject = Subject(**subject.dict())
        db.add(db_subject)
        db.commit()
        db.refresh(db_subject)
        return db_subject

    @staticmethod
    def get_subject_by_id(db: Session, subject_id: int) -> Subject:
        return db.query(Subject).filter(Subject.id == subject_id).first()

    @staticmethod
    def list_subjects(db: Session) -> list[Subject]:
        return db.query(Subject).all()

    @staticmethod
    def initialize_subjects_for_level(db: Session, level: str) -> list[Subject]:
        """Create subjects for a given school level if they don't exist"""
        if level not in NIGERIAN_SCHOOL_SUBJECTS:
            raise ValueError(f"Invalid school level: {level}")

        subjects = []
        for subject_name in NIGERIAN_SCHOOL_SUBJECTS[level]:
            # Check if subject already exists
            existing = (
                db.query(Subject)
                .filter(Subject.name == subject_name)
                .first()
            )
            if not existing:
                # Create subject code - use initials from each word or a shorter version
                words = subject_name.split()
                if len(words) > 1:
                    code = "".join([w[0].upper() for w in words])  # e.g., "EL" for "English Language"
                else:
                    code = subject_name[:3].upper()
                
                # Ensure code is unique by checking if it exists
                existing_code = db.query(Subject).filter(Subject.code == code).first()
                if existing_code:
                    code = code + str(len(db.query(Subject).filter(Subject.code.like(code + "%")).all()))
                
                db_subject = Subject(name=subject_name, code=code)
                db.add(db_subject)
                try:
                    db.commit()
                    db.refresh(db_subject)
                    subjects.append(db_subject)
                except IntegrityError:
                    db.rollback()
                    existing = (
                        db.query(Subject)
                        .filter(Subject.name == subject_name)
                        .first()
                    )
                    if existing:
                        subjects.append(existing)
            else:
                subjects.append(existing)

        return subjects


class ClassService:
    @staticmethod
    def create_class(db: Session, class_data: ClassCreate) -> Class:
        """Create a new class and populate with subjects for its level"""
        db_class = Class(**class_data.dict())
        db.add(db_class)
        db.commit()
        db.refresh(db_class)

        # Populate subjects for this class level
        subjects = SubjectService.initialize_subjects_for_level(
            db, class_data.level
        )
        db_class.subjects = subjects
        db.commit()
        db.refresh(db_class)

        return db_class

    @staticmethod
    def get_class_by_id(db: Session, class_id: int) -> Class:
        return db.query(Class).filter(Class.id == class_id).first()

    @staticmethod
    def list_classes(db: Session) -> list[Class]:
        return db.query(Class).all()

    @staticmethod
    def list_classes_by_level(db: Session, level: str) -> list[Class]:
        return db.query(Class).filter(Class.level == level).all()

    @staticmethod
    def assign_student_to_class(
        db: Session, student_id: int, class_id: int, created_by_id: int = None
    ) -> dict:
        """Assign a student to a class and create exams for all class subjects"""
        user = db.query(User).filter(User.id == student_id).first()
        if not user:
            raise ValueError("Student not found")

        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise ValueError("Class not found")

        # Add student to class
        if user not in class_obj.students:
            class_obj.students.append(user)
            db.commit()

        # Create student-subject relationships and exams for each subject
        created_exams = []
        for subject in class_obj.subjects:
            # Create student-subject relationship
            existing_ss = (
                db.query(StudentSubject)
                .filter(
                    StudentSubject.student_id == student_id,
                    StudentSubject.subject_id == subject.id,
                    StudentSubject.class_id == class_id,
                )
                .first()
            )
            if not existing_ss:
                student_subject = StudentSubject(
                    student_id=student_id,
                    subject_id=subject.id,
                    class_id=class_id,
                )
                db.add(student_subject)
                db.commit()

            # Create exam for this subject
            exam = Exam(
                title=f"{subject.name} - {class_obj.name}",
                description=f"Exam for {subject.name} in class {class_obj.name}",
                duration_minutes=60,
                published=False,
                created_by=created_by_id or student_id,
            )
            db.add(exam)
            db.commit()
            db.refresh(exam)
            created_exams.append(exam)

        return {
            "student_id": student_id,
            "class_id": class_id,
            "subjects_assigned": len(class_obj.subjects),
            "exams_created": len(created_exams),
        }

    @staticmethod
    def assign_teacher_to_class(
        db: Session, teacher_id: int, class_id: int
    ) -> dict:
        """Assign a teacher to a class"""
        user = db.query(User).filter(User.id == teacher_id).first()
        if not user:
            raise ValueError("Teacher not found")

        if user.role != "teacher":
            raise ValueError("User is not a teacher")

        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise ValueError("Class not found")

        # Add teacher to class
        if user not in class_obj.teachers:
            class_obj.teachers.append(user)
            db.commit()

        return {
            "teacher_id": teacher_id,
            "class_id": class_id,
            "message": "Teacher assigned to class",
        }

    @staticmethod
    def get_class_students(db: Session, class_id: int) -> list[User]:
        """Get all students in a class"""
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            return []
        return class_obj.students

    @staticmethod
    def get_student_classes(db: Session, student_id: int) -> list[Class]:
        """Get all classes a student is enrolled in"""
        user = db.query(User).filter(User.id == student_id).first()
        if not user:
            return []
        return user.enrolled_classes

    @staticmethod
    def get_teacher_classes(db: Session, teacher_id: int) -> list[Class]:
        """Get all classes a teacher teaches"""
        user = db.query(User).filter(User.id == teacher_id).first()
        if not user:
            return []
        return user.teaching_classes

    @staticmethod
    def assign_teacher_to_subject(
        db: Session, teacher_id: int, subject_id: int, class_id: int
    ) -> dict:
        """Assign a teacher to a subject in a class"""
        from ..models.subject import TeacherSubject
        
        # Verify teacher exists and is a teacher
        teacher = db.query(User).filter(User.id == teacher_id).first()
        if not teacher:
            raise ValueError("Teacher not found")
        if teacher.role != "teacher":
            raise ValueError("User is not a teacher")

        # Verify subject exists
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            raise ValueError("Subject not found")

        # Verify class exists
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise ValueError("Class not found")

        # Verify subject is assigned to this class
        if subject not in class_obj.subjects:
            raise ValueError("Subject is not assigned to this class")

        # Check if teacher is already assigned to this subject in this class
        existing = (
            db.query(TeacherSubject)
            .filter(
                TeacherSubject.teacher_id == teacher_id,
                TeacherSubject.subject_id == subject_id,
                TeacherSubject.class_id == class_id,
            )
            .first()
        )
        if existing:
            return {
                "teacher_id": teacher_id,
                "subject_id": subject_id,
                "class_id": class_id,
                "message": "Teacher already assigned to this subject in this class",
            }

        # Create new teacher-subject assignment
        teacher_subject = TeacherSubject(
            teacher_id=teacher_id,
            subject_id=subject_id,
            class_id=class_id,
        )
        db.add(teacher_subject)
        db.commit()
        db.refresh(teacher_subject)

        return {
            "id": teacher_subject.id,
            "teacher_id": teacher_id,
            "subject_id": subject_id,
            "class_id": class_id,
            "message": "Teacher assigned to subject successfully",
        }

    @staticmethod
    def get_subject_teachers(
        db: Session, subject_id: int, class_id: int
    ) -> list[dict]:
        """Get all teachers assigned to a subject in a class"""
        from ..models.subject import TeacherSubject
        
        teacher_subjects = (
            db.query(TeacherSubject)
            .filter(
                TeacherSubject.subject_id == subject_id,
                TeacherSubject.class_id == class_id,
            )
            .all()
        )
        
        result = []
        for ts in teacher_subjects:
            result.append({
                "id": ts.id,
                "teacher_id": ts.teacher_id,
                "teacher_name": ts.teacher.full_name if ts.teacher else "Unknown",
                "teacher_email": ts.teacher.email if ts.teacher else "Unknown",
                "subject_id": ts.subject_id,
                "class_id": ts.class_id,
            })
        return result

    @staticmethod
    def get_class_subjects_with_teachers(
        db: Session, class_id: int
    ) -> list[dict]:
        """Get all subjects in a class with their assigned teachers"""
        from ..models.subject import TeacherSubject
        
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            return []

        result = []
        for subject in class_obj.subjects:
            teachers = (
                db.query(TeacherSubject)
                .filter(
                    TeacherSubject.subject_id == subject.id,
                    TeacherSubject.class_id == class_id,
                )
                .all()
            )
            
            result.append({
                "subject_id": subject.id,
                "subject_name": subject.name,
                "subject_code": subject.code,
                "teachers": [
                    {
                        "id": t.id,
                        "teacher_id": t.teacher_id,
                        "teacher_name": t.teacher.full_name if t.teacher else "Unknown",
                        "teacher_email": t.teacher.email if t.teacher else "Unknown",
                    }
                    for t in teachers
                ],
            })
            })
        return result

    @staticmethod
    def update_class_subjects(db: Session, class_id: int, subject_ids: list[int]) -> Class:
        """Update subjects for a class. Replaces all current subjects with the provided list."""
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise ValueError("Class not found")
        
        # Clear existing subjects
        class_obj.subjects = []
        
        # Add new subjects
        for subject_id in subject_ids:
            subject = SubjectService.get_subject_by_id(db, subject_id)
            if not subject:
                raise ValueError(f"Subject {subject_id} not found")
            class_obj.subjects.append(subject)
        
        db.commit()
        db.refresh(class_obj)
        return class_obj

    @staticmethod
    def add_subject_to_class(db: Session, class_id: int, subject_id: int) -> Class:
        """Add a subject to a class"""
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise ValueError("Class not found")
        
        subject = SubjectService.get_subject_by_id(db, subject_id)
        if not subject:
            raise ValueError("Subject not found")
        
        if subject not in class_obj.subjects:
            class_obj.subjects.append(subject)
            db.commit()
            db.refresh(class_obj)
        
        return class_obj

    @staticmethod
    def remove_subject_from_class(db: Session, class_id: int, subject_id: int) -> Class:
        """Remove a subject from a class"""
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise ValueError("Class not found")
        
        subject = SubjectService.get_subject_by_id(db, subject_id)
        if not subject:
            raise ValueError("Subject not found")
        
        if subject in class_obj.subjects:
            class_obj.subjects.remove(subject)
            db.commit()
            db.refresh(class_obj)
        
        return class_obj
