from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.db import Base, engine
from app.api import auth, exams, questions, results, users, classes
import logging
import os

# FastAPI app
app = FastAPI(title="School CBT System - Backend")

# --------------------
# CORS configuration
# --------------------
# During local development, allow all origins
# In production, restrict this to frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------
# Database tables
# --------------------
Base.metadata.create_all(bind=engine)

# --------------------
# Static files for uploads
# --------------------
try:
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")
    print(f"Mounted uploads at {upload_dir}")
except Exception as e:
    print(f"WARNING: Failed to mount uploads: {e}")

# --------------------
# Health check endpoint
# --------------------
@app.get("/")
def health_check():
    return {"status": "healthy", "message": "Backend is running"}

# --------------------
# API routers
# --------------------
app.include_router(auth.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(classes.router, prefix="/api")

# --------------------
# Root endpoint
# --------------------
@app.get("/")
def root():
    return {"message": "School CBT Backend is running. Use /api/... endpoints."}

# --------------------
# Startup logging
# --------------------
@app.on_event("startup")
def startup_event():
    logging.info("Starting School CBT backend")
