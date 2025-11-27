import sqlite3

# Path to your SQLite file
db_path = r"C:\Users\omagu\OneDrive\Desktop\LOCALREPOSITORY\db.sqlite3"

# Connect to the database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# List all tables
print("Tables in database:")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print(tables)

# Check the users table
print("\nUsers table contents:")
cursor.execute("SELECT id, full_name, email, hashed_password, role FROM users;")
users = cursor.fetchall()
for user in users:
    print(user)

conn.close()
