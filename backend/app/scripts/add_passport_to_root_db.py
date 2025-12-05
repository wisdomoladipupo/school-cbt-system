import sqlite3
import os

root_db = os.path.abspath(os.path.join(os.getcwd(), 'school_cbt.db'))
print('Root DB path:', root_db)
conn = sqlite3.connect(root_db)
cursor = conn.cursor()
# Check if passport column exists
cursor.execute("PRAGMA table_info(users)")
cols = [c[1] for c in cursor.fetchall()]
if 'passport' in cols:
    print('passport column already exists')
else:
    print('Adding passport column')
    cursor.execute("ALTER TABLE users ADD COLUMN passport TEXT")
    conn.commit()
    print('Added passport column')
conn.close()
