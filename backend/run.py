import uvicorn
import sys
import os
import traceback
import logging

# Configure logging to see all debug output
logging.basicConfig(level=logging.DEBUG)

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    try:
        config = uvicorn.Config(
            "app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=False,
            log_level="info",
            use_colors=False,
            access_log=True
        )
        server = uvicorn.Server(config)
        server.run()
    except KeyboardInterrupt:
        print("\n\nShutdown by user (Ctrl+C)")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n=== CRITICAL ERROR ===\n{e}\n")
        traceback.print_exc()
        sys.exit(1)
