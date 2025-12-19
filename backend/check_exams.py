from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime

def check_exams():
    # Get the absolute path to the database
    db_path = os.path.abspath('school_cbt.db')
    print(f"Checking database at: {db_path}")
    print(f"Current time: {datetime.now()}\n")
    
    # Create SQLAlchemy engine
    engine = create_engine(f'sqlite:///{db_path}')
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Get total number of exams
        result = session.execute(text("SELECT COUNT(*) FROM exams"))
        total_exams = result.scalar()
        print(f"Total number of exams: {total_exams}")
        
        # Get most recent 10 exams
        print("\nMost recent 10 exams:")
        result = session.execute(text("""
            SELECT e.id, e.title, e.created_at, u.email as created_by, e.published
            FROM exams e
            LEFT JOIN users u ON e.created_by = u.id
            ORDER BY e.created_at DESC
            LIMIT 10
        """))
        
        for row in result:
            print(f"ID: {row[0]}, Title: {row[1]}, Created At: {row[2]}, Created By: {row[3]}, Published: {row[4]}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    check_exams()
