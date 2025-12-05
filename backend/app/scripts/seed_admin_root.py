import sqlite3
from passlib.context import CryptContext
import os

root_db = os.path.abspath(os.path.join(os.getcwd(), 'school_cbt.db'))
print('Root DB path:', root_db)

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
admin_password = pwd_context.hash('adminpass')

conn = sqlite3.connect(root_db)
cursor = conn.cursor()
# Insert admin if not exists
cursor.execute("SELECT id FROM users WHERE email = ?", ('admin@example.com',))
if cursor.fetchone():
    print('admin@example.com already exists in root DB')
else:
    cursor.execute("INSERT INTO users (full_name, email, hashed_password, role, passport) VALUES (?, ?, ?, ?, ?)", ('Admin User', 'admin@example.com', admin_password, 'admin', '/uploads/default-admin.png'))
    print('Inserted admin@example.com into root DB')

cursor.execute("SELECT id FROM users WHERE email = ?", ('admin@school.local',))
if cursor.fetchone():
    print('admin@school.local already exists in root DB')
else:
    cursor.execute("INSERT INTO users (full_name, email, hashed_password, role, passport) VALUES (?, ?, ?, ?, ?)", ('Admin User', 'admin@school.local', admin_password, 'admin', '/uploads/default-admin.png'))
    print('Inserted admin@school.local into root DB')

conn.commit()
conn.close()
