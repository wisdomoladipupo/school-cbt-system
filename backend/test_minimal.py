import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

print("Creating minimal app...")
app = FastAPI(title="Minimal Test")

print("Adding CORS middleware...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Adding root route...")
@app.get("/")
def root():
    return {"message": "Minimal OK"}

print("App created successfully")

if __name__ == "__main__":
    from waitress import serve
    print("Starting...")
    serve(app, host="127.0.0.1", port=8001, threads=4)
