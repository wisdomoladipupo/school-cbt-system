"""
Schema sync helper for SQLite backend.

- Runs `Base.metadata.create_all(bind=engine)` to create missing tables.
- Compares SQLAlchemy table column names with SQLite PRAGMA table_info.
- Adds missing columns with a reasonable SQLite type mapping using ALTER TABLE ADD COLUMN.

Run from repository root:
    python .\school-cbt-sys\scripts\schema_sync.py

Caveats:
- ALTER TABLE ADD COLUMN on SQLite supports only adding columns with no NOT NULL constraint
  (unless there's a DEFAULT). This script will add columns as NULLable to be safe.
- Complex migrations (renames, type changes) are not handled. Use Alembic for production migrations.
"""
import os
import sys
import sqlite3
import re
from sqlalchemy import inspect

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND = os.path.join(ROOT, "backend")
DB_PATH = os.path.join(BACKEND, "school_cbt.db")

if not os.path.exists(DB_PATH):
    print("ERROR: DB not found:", DB_PATH)
    raise SystemExit(1)

# Make backend package importable
sys.path.insert(0, BACKEND)

# Import SQLAlchemy Base and engine
try:
    from app.core.db import Base, engine
except Exception as e:
    print("Failed to import Base/engine:", e)
    raise

# Type mapping: SQLAlchemy types -> SQLite affinity
def map_sqla_type_to_sqlite(col):
    tname = col.type.__class__.__name__.lower()
    # Common maps
    if "integer" in tname or "int" in tname:
        return "INTEGER"
    if "string" in tname or "varchar" in tname or "text" in tname:
        return "TEXT"
    if "datetime" in tname or "date" in tname or "timestamp" in tname:
        return "TEXT"
    if "boolean" in tname:
        return "INTEGER"
    # Fallback
    return "TEXT"

# 1) Create any missing tables
print("Running create_all() to create missing tables (if any)...")
# Ensure model modules are imported so metadata is populated
models_dir = os.path.join(BACKEND, 'app', 'models')
if os.path.isdir(models_dir):
    for fname in os.listdir(models_dir):
        if not fname.endswith('.py') or fname.startswith('__'):
            continue
        mod_name = fname[:-3]
        try:
            __import__(f"app.models.{mod_name}")
            print(f"Imported model module: app.models.{mod_name}")
        except Exception as e:
            print(f"Warning: failed to import app.models.{mod_name}: {e}")

Base.metadata.create_all(bind=engine)
print("create_all() complete.")

# 2) For each table in metadata, compare columns
inspector = inspect(engine)
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

summary = {"tables_checked": 0, "columns_added": 0, "errors": []}

for table_name, table_obj in Base.metadata.tables.items():
    summary["tables_checked"] += 1
    try:
        # Get existing columns via PRAGMA
        cur.execute(f"PRAGMA table_info('{table_name}')")
        existing = [r[1] for r in cur.fetchall()]

        model_cols = [c for c in table_obj.columns]
        missing = [c for c in model_cols if c.name not in existing]

        if not missing:
            print(f"Table '{table_name}': all columns present.")
            continue

        print(f"Table '{table_name}': missing columns: {[c.name for c in missing]}")

        for col in missing:
            colname = col.name
            sqlite_type = map_sqla_type_to_sqlite(col)

            # Build ALTER TABLE ADD COLUMN statement; keep it simple and NULLable
            sql = f"ALTER TABLE '{table_name}' ADD COLUMN '{colname}' {sqlite_type}"

            # If column has a server_default that is a simple literal, include a default value
            try:
                default = None
                if getattr(col, 'server_default', None) is not None:
                    sd = col.server_default.arg if hasattr(col.server_default, 'arg') else None
                    if sd is not None:
                        # Try to coerce to a literal (int/str)
                        if isinstance(sd, str):
                            # strip SQL function wrappers if any
                            m = re.match(r"^'(.+)'$", sd)
                            if m:
                                default = m.group(1)
                            else:
                                default = sd
                        else:
                            default = str(sd)
                if default is not None:
                    # For TEXT defaults, quote
                    if sqlite_type == 'TEXT':
                        sql += f" DEFAULT '{default}'"
                    else:
                        sql += f" DEFAULT {default}"
            except Exception:
                pass

            print("Executing:", sql)
            try:
                cur.execute(sql)
                summary['columns_added'] += 1
            except Exception as e:
                print(f"Failed to add column {colname} to {table_name}: {e}")
                summary['errors'].append(str(e))

        conn.commit()
    except Exception as e:
        print(f"Error checking table {table_name}: {e}")
        summary['errors'].append(str(e))

conn.close()

print('\nSchema sync summary:')
print(f"Tables checked: {summary['tables_checked']}")
print(f"Columns added: {summary['columns_added']}")
if summary['errors']:
    print('Errors:')
    for e in summary['errors']:
        print('-', e)
else:
    print('No errors.')

print('\nDone. Note: For structural changes beyond adding nullable columns, use Alembic migrations.')
