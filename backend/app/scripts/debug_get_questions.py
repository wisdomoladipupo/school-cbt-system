from fastapi.testclient import TestClient
import traceback

from app.main import app


def run():
    client = TestClient(app)
    # Let exceptions propagate so we can see the full traceback in this script
    client.raise_server_exceptions = True
    try:
        resp = client.get("/api/exams/2/questions")
        print("STATUS:", resp.status_code)
        try:
            print("JSON:", resp.json())
        except Exception:
            print("TEXT:", resp.text)
    except Exception:
        print("Exception raised during in-process request:")
        traceback.print_exc()


if __name__ == '__main__':
    run()
