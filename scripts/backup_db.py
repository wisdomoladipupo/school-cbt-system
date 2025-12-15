"""
Simple DB backup script.
Copies `backend/school_cbt.db` into `backups/` with a timestamped filename.
Run from the repository root with: `python .\scripts\backup_db.py`
"""
import os
import shutil
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, "backend", "school_cbt.db")
BACKUP_DIR = os.path.join(ROOT, "backups")

os.makedirs(BACKUP_DIR, exist_ok=True)

if not os.path.exists(DB_PATH):
    print(f"Database file not found: {DB_PATH}")
    raise SystemExit(1)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_name = f"school_cbt.db.backup_{timestamp}"
backup_path = os.path.join(BACKUP_DIR, backup_name)

shutil.copy2(DB_PATH, backup_path)
print(f"Created backup: {backup_path}")
