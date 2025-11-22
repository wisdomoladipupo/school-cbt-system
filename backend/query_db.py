import sqlite3

conn = sqlite3.connect('school_cbt.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in database:")
for table in tables:
    print(f"  - {table[0]}")

# Get user count
cursor.execute("SELECT COUNT(*) FROM users;")
user_count = cursor.fetchone()[0]
print(f"\nTotal users: {user_count}")

# Show first few users
cursor.execute("SELECT id, full_name, email FROM users LIMIT 5;")
users = cursor.fetchall()
print("\nFirst 5 users:")
for user in users:
    print(f"  ID: {user[0]}, Name: {user[1]}, Email: {user[2]}")

conn.close()
