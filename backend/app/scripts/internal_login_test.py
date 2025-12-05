import sys, os, traceback
# ensure backend package imports resolve
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
# Let exceptions propagate so we can capture traceback
client.raise_server_exceptions = True

payload = {"email": "admin@example.com", "password": "adminpass"}

print('Running internal login test...')
try:
    resp = client.post('/api/auth/login', json=payload)
    print('Status code:', resp.status_code)
    print('Response body:', resp.text)
except Exception as e:
    print('Exception raised during in-process request:')
    traceback.print_exc()
    # also try with exceptions swallowed to show response if any
    try:
        client.raise_server_exceptions = False
        resp2 = client.post('/api/auth/login', json=payload)
        print('\nWhen server exceptions are not raised:')
        print('Status code:', resp2.status_code)
        print('Response body:', resp2.text)
    except Exception:
        print('No fallback response available')
