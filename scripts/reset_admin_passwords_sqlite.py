"""
Reset admin users' hashed_password directly in the SQLite DB using passlib argon2 hash.
This avoids importing app models (which may expect a different schema).
"""
import os
import json
import sqlite3
from passlib.context import CryptContext

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, 'backend', 'school_cbt.db')
if not os.path.exists(DB):
    print(json.dumps({'error':'db_not_found','path':DB}))
    raise SystemExit(1)

pwd_ctx = CryptContext(schemes=['argon2'], deprecated='auto')
new_pass = 'adminpass'
hashed = pwd_ctx.hash(new_pass)
emails = ['admin@example.com','admin@school.local']

con = sqlite3.connect(DB)
cur = con.cursor()
updated = 0
for e in emails:
    cur.execute('SELECT id FROM users WHERE email = ?', (e,))
    r = cur.fetchone()
    if r:
        cur.execute('UPDATE users SET hashed_password = ? WHERE email = ?', (hashed, e))
        updated += 1
        print('Updated', e)
    else:
        print('Not found', e)
con.commit()
con.close()
print('Done. updated=', updated)
