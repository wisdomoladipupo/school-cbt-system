import sys, os, traceback
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
client.raise_server_exceptions = True

print('Testing GET /api/classes/level/JSS1...')
try:
    resp = client.get('/api/classes/level/JSS1')
    print('Status code:', resp.status_code)
    print('Response body:', resp.text)
except Exception as e:
    print('Exception raised:')
    traceback.print_exc()
