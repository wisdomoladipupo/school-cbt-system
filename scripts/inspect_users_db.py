"""
Inspect the `users` table in the backend SQLite DB and print a brief summary.
Run from repository root:

    python .\school-cbt-sys\scripts\inspect_users_db.py

"""
import sqlite3
import os
import json

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend', 'school_cbt.db')

if not os.path.exists(DB_PATH):
    print(json.dumps({'error': 'db_not_found', 'path': DB_PATH}))
    raise SystemExit(1)

con = sqlite3.connect(DB_PATH)
con.row_factory = sqlite3.Row
cur = con.cursor()

out = {'db_path': DB_PATH}
try:
    cur.execute("SELECT count(*) as cnt FROM users")
    out['user_count'] = cur.fetchone()['cnt']

    cur.execute("SELECT id, full_name, email, role, registration_number, created_at FROM users ORDER BY id DESC LIMIT 10")
    rows = [dict(r) for r in cur.fetchall()]
    out['sample_users'] = rows
except Exception as e:
    out['error'] = str(e)
finally:
    con.close()

print(json.dumps(out, default=str, indent=2))
