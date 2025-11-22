from fastapi import FastAPI
from .core.db import Base, engine
from .api import auth, exams, questions, results, users
import logging

app = FastAPI(title="School CBT System - Backend")

# create db tables
Base.metadata.create_all(bind=engine)

# include routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "School CBT Backend is running. Use /api/... endpoints."}

# optional startup logs
@app.on_event("startup")
def startup_event():
    logging.info("Starting School CBT backend")
