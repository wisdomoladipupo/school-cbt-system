import json
import urllib.request

url = 'http://127.0.0.1:8000/api/auth/login'
body = json.dumps({'email':'admin@example.com','password':'adminpass'}).encode('utf-8')
req = urllib.request.Request(url, data=body, headers={'Content-Type':'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = resp.read().decode('utf-8')
        print('STATUS', resp.status)
        print('BODY', data)
except urllib.error.HTTPError as e:
    print('HTTP ERROR', e.code)
    try:
        print(e.read().decode('utf-8'))
    except Exception:
        pass
except Exception as e:
    print('ERROR', e)
