#!/usr/bin/env python
"""
Backend server runner - uses FastAPI TestClient as ASGI server
This bypasses uvicorn/waitress issues on Windows while providing a working HTTP server
"""
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.main import app as fastapi_app
import socket
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class ASGIHandler(BaseHTTPRequestHandler):
    """HTTP handler that delegates to FastAPI"""
    client = TestClient(fastapi_app)
    
    def do_request(self):
        # Parse request
        path = self.path
        method = self.command
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b''
        
        # Build request for TestClient
        headers = dict(self.headers)
        
        try:
            # Make request to FastAPI app
            if method == 'GET':
                response = self.client.get(path, headers=headers)
            elif method == 'POST':
                response = self.client.post(path, content=body, headers=headers)
            elif method == 'PUT':
                response = self.client.put(path, content=body, headers=headers)
            elif method == 'DELETE':
                response = self.client.delete(path, headers=headers)
            else:
                response = self.client.request(method.lower(), path, content=body, headers=headers)
            
            # Send response
            self.send_response(response.status_code)
            for key, value in response.headers.items():
                self.send_header(key, value)
            self.end_headers()
            self.wfile.write(response.content)
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def do_GET(self):
        self.do_request()
    
    def do_POST(self):
        self.do_request()
    
    def do_PUT(self):
        self.do_request()
    
    def do_DELETE(self):
        self.do_request()
    
    def log_message(self, format, *args):
        # Suppress default logging
        print(f"[{self.client_address[0]}] {format % args}")

if __name__ == "__main__":
    host = "127.0.0.1"
    port = 8000
    
    print(f"Starting School CBT Backend on {host}:{port}")
    print("Using FastAPI TestClient as HTTP server")
    
    server = HTTPServer((host, port), ASGIHandler)
    print(f"✓ Server listening at http://{host}:{port}")
    print("Press Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Shutdown gracefully")
        server.shutdown()
