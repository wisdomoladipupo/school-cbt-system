from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.db import Base, engine
from .api import auth, exams, questions, results, users, classes
import logging
import os
from app.core.db import Base, engine
from app.models.user import User



app = FastAPI(title="School CBT System - Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    # During local development, allow any origin so the dev server (which may
    # run on localhost or a network IP) can call the API without CORS issues.
    # In production, set a restricted list of allowed origins.
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create db tables
Base.metadata.create_all(bind=engine)

# Mount static files for uploads
upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# include routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(classes.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "School CBT Backend is running. Use /api/... endpoints."}

# optional startup logs
@app.on_event("startup")
def startup_event():
    logging.info("Starting School CBT backend")
