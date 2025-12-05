import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
import uvicorn
import asyncio

app = FastAPI()

@app.get("/")
def root():
    print("[ROOT HANDLER CALLED]")  # DEBUG
    return {"message": "Test OK"}

if __name__ == "__main__":
    print("Starting simple test server on port 9999...")
    try:
        # Use direct uvicorn.run with explicit arguments
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=9999,
            log_level="debug",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\nShutdown requested")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

