import sqlite3
conn = sqlite3.connect("school-cbt-sys/backend/school_cbt.db")
conn.execute("ALTER TABLE users ADD COLUMN passport TEXT")
conn.commit()
conn.close()
print("Added 'passport' column to users table.")
