import sqlite3
import sys, os
# ensure we can import core.security
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from core.security import verify_password

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'school_cbt.db'))
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
email = 'admin@example.com'
cursor.execute('SELECT id, email, hashed_password FROM users WHERE email = ?', (email,))
row = cursor.fetchone()
if not row:
    print('Admin user not found')
else:
    print('Found user:', row[1])
    hashed = row[2]
    print('Hashed password:', hashed)
    ok = verify_password('adminpass', hashed)
    print('verify_password("adminpass") ->', ok)
conn.close()
