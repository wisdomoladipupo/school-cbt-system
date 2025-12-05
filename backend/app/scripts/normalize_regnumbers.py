import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

import sqlite3
import re

def normalize():
    conn = sqlite3.connect("school-cbt-sys/backend/school_cbt.db")
    cursor = conn.cursor()
    pattern = re.compile(r"^NG/EEV/\d{4}/[A-Z]$", re.IGNORECASE)
    cursor.execute("SELECT id, email, registration_number FROM users WHERE registration_number IS NOT NULL")
    users = cursor.fetchall()
    updated = 0
    for user_id, email, reg in users:
        if not reg:
            continue
        if pattern.match(reg):
            parts = reg.split("/")
            if len(parts) >= 4:
                new = f"{parts[0]}/{parts[1]}/{parts[2]}{parts[3]}".upper()
                cursor.execute("UPDATE users SET registration_number = ? WHERE id = ?", (new, user_id))
                updated += 1
                print(f"Updated {email}: {reg} -> {new}")
    conn.commit()
    conn.close()
    print(f"Done. Updated {updated} users.")

if __name__ == "__main__":
    normalize()
