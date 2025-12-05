import sqlite3
from passlib.context import CryptContext

db_path = "school-cbt-sys/backend/school_cbt.db"

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

admin_password = hash_password("adminpass")

# Insert admin users
cursor.execute("""
INSERT INTO users (full_name, email, hashed_password, role, passport)
VALUES (?, ?, ?, ?, ?)
""", ("Admin User", "admin@example.com", admin_password, "admin", "/uploads/default-admin.png"))

cursor.execute("""
INSERT INTO users (full_name, email, hashed_password, role, passport)
VALUES (?, ?, ?, ?, ?)
""", ("Admin User", "admin@school.local", admin_password, "admin", "/uploads/default-admin.png"))

conn.commit()
conn.close()
print("Admin users created successfully!")
print("Credentials:")
print("  Email: admin@example.com")
print("  Password: adminpass")
