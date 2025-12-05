import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from app.core.config import settings
print('DATABASE_URL from settings:', settings.DATABASE_URL)
# Resolve sqlite path
if settings.DATABASE_URL.startswith('sqlite:///'):
    rel = settings.DATABASE_URL.replace('sqlite:///', '')
    abs_path = os.path.abspath(os.path.join(os.getcwd(), rel))
    print('Resolved path (from cwd):', abs_path)
    print('Exists?', os.path.exists(abs_path))
else:
    print('Not an sqlite URL')
