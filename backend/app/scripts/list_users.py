import sqlite3

conn = sqlite3.connect("school-cbt-sys/backend/school_cbt.db")
cursor = conn.cursor()
cursor.execute("SELECT id, full_name, email, role, registration_number FROM users")
users = cursor.fetchall()
print("Users in database:")
for user in users:
    print(f"  ID: {user[0]}, Name: {user[1]}, Email: {user[2]}, Role: {user[3]}, Reg#: {user[4]}")
conn.close()
