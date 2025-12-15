from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.db import Base, engine
from app.api import auth, exams, questions, results, users, classes
import logging
import os
from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

# FastAPI app
app = FastAPI(title="School CBT System - Backend")

# Development CORS origins (used for both middleware and error responses)
DEV_CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

# --------------------
# CORS configuration
# --------------------
# During local development, allow all origins
# In production, restrict this to frontend domains
app.add_middleware(
    CORSMiddleware,
    # Explicitly allow local frontend origins during development. Using
    # a wildcard with `allow_credentials=True` is unsafe and may be
    # rejected by browsers when credentials are included.
    allow_origins=DEV_CORS_ORIGINS,
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


@app.exception_handler(Exception)
async def all_exceptions_handler(request: Request, exc: Exception):
    # Log full traceback to server logs for easier debugging of 500 errors
    logging.error(f"Unhandled exception during request {request.method} {request.url}")
    tb = traceback.format_exc()
    logging.error(tb)
    # Also write to a dedicated traceback file so errors from the live uvicorn
    # process are easy to find even if stdout/stderr are noisy.
    try:
        logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', '..', 'logs')
        os.makedirs(logs_dir, exist_ok=True)
        trace_file = os.path.join(logs_dir, 'error_tracebacks.log')
        with open(trace_file, 'a', encoding='utf-8') as f:
            f.write(f"--- {request.method} {request.url} ---\n")
            f.write(tb)
            f.write('\n')
    except Exception:
        logging.error('Failed to write traceback to file')

    # Attach CORS headers when responding from this global handler so that
    # browsers don't block error responses when the middleware may not have
    # had a chance to add headers (some edge cases). Use the request Origin
    # header only if it's an allowed development origin.
    origin = request.headers.get("origin")
    headers = {}
    if origin and origin in DEV_CORS_ORIGINS:
        headers.update({
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        })

    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"}, headers=headers)
