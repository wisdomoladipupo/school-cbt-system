Backup and migration notes

- Purpose: provide a safe copy of the production/dev SQLite DB before migrations.

How to create a backup

1. From repository root run (PowerShell):

```powershell
python .\scripts\backup_db.py
```

2. The script copies `backend/school_cbt.db` into `backups/` with a timestamped filename.

Notes

- Always create a backup before running destructive migrations.
- Keep older backups off-site or in versioned storage if needed.
- This repository already included `backend/school_cbt.db.bak` as an earlier backup; the `backups/` folder created by the script will store incremental backups.
