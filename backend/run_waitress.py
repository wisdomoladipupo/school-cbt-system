import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Importing app...")
from app.main import app
print(f"App imported: {app}")

print("Importing Waitress...")
from waitress import serve
print("Waitress imported")

print("Starting server...")
try:
    serve(app, host="127.0.0.1", port=8000, threads=4)
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
