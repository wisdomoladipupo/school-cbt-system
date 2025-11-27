from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print('1) Registering admin...')
resp = client.post('/api/auth/register', json={
    'full_name': 'Smoke Admin',
    'email': 'smoke-admin+test@example.com',
    'password': 'SmokePass123!',
    'role': 'admin'
})
print('admin register status', resp.status_code, resp.text)
if resp.status_code != 200:
    raise SystemExit('admin register failed')
admin_token = resp.json()['access_token']
headers = {'Authorization': f'Bearer {admin_token}'}

print('2) Creating class PRY1...')
resp = client.post('/api/classes', json={'name': 'Test Class A', 'level': 'PRY1'}, headers=headers)
print('create class status', resp.status_code, resp.text)
if resp.status_code != 200:
    raise SystemExit('create class failed')
class_obj = resp.json()
class_id = class_obj['id']

print('3) Registering student...')
resp = client.post('/api/auth/register', json={
    'full_name': 'Smoke Student',
    'email': 'smoke-student+test@example.com',
    'password': 'StudentPass1!',
    'role': 'student',
    'student_class': None
})
print('student register status', resp.status_code, resp.text)
if resp.status_code != 200:
    raise SystemExit('student register failed')
# We need the created user id from DB. Register returns token only, so query the users list (admin) to find the student
resp = client.get('/api/users/', headers=headers)
print('list users status', resp.status_code)
users = resp.json()
student = next((u for u in users if u['email'] == 'smoke-student+test@example.com'), None)
if not student:
    raise SystemExit('student not found in user list')
student_id = student['id']

print('4) Assigning student to class...')
resp = client.post(f'/api/classes/{class_id}/assign-student', json={'student_id': student_id, 'class_id': class_id})
print('assign status', resp.status_code, resp.text)
if resp.status_code != 200:
    raise SystemExit('assign failed')
print('Assign result:', resp.json())

print('Smoke test completed successfully')
