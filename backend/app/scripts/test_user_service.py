import sys, os
# Ensure package import root is the backend directory so 'app' package imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from app.core.db import SessionLocal
from app.services.user_service import get_user_by_email

db = SessionLocal()
user = get_user_by_email(db, 'admin@example.com')
print('user:', user and user.email)
if user:
    print('hashed:', user.hashed_password)
    from app.core.security import verify_password
    print('verify_password ->', verify_password('adminpass', user.hashed_password))
db.close()
