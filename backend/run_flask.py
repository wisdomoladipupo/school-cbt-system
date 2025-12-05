#!/usr/bin/env python
"""
Simple Flask wrapper around FastAPI for testing on Windows
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from app.main import app
from flask import Flask, request, jsonify
from flask_cors import CORS

flask_app = Flask(__name__)

# Enable CORS for all routes from localhost:3000
CORS(flask_app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
     supports_credentials=True)

# Create a TestClient that we'll use to call the FastAPI app
client = TestClient(app)

@flask_app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def proxy(path):
    """Proxy all /api/* requests to FastAPI"""
    method = request.method
    
    # Get body if present
    if request.content_length:
        body = request.get_data()
    else:
        body = None
    
    # Forward headers
    headers = dict(request.headers)
    headers.pop('Host', None)
    
    try:
        # Call FastAPI through TestClient
        if method == 'GET':
            response = client.get(f'/api/{path}', headers=headers)
        elif method == 'POST':
            response = client.post(f'/api/{path}', content=body, headers=headers)
        elif method == 'PUT':
            response = client.put(f'/api/{path}', content=body, headers=headers)
        elif method == 'DELETE':
            response = client.delete(f'/api/{path}', headers=headers)
        elif method == 'PATCH':
            response = client.patch(f'/api/{path}', content=body, headers=headers)
        elif method == 'OPTIONS':
            return '', 200
        else:
            response = client.request(method.lower(), f'/api/{path}', content=body, headers=headers)
        
        return response.content, response.status_code, dict(response.headers)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@flask_app.route('/', methods=['GET', 'OPTIONS'])
def root():
    """Root endpoint"""
    return {'message': 'School CBT Backend is running. Use /api/... endpoints.'}

if __name__ == '__main__':
    print("Starting School CBT Backend (Flask wrapper)")
    print("Listening at http://127.0.0.1:8000")
    flask_app.run(host='127.0.0.1', port=8000, debug=False, use_reloader=False)
