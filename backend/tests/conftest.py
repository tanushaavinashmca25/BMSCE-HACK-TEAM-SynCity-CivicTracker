import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user

# Mock Supabase
@pytest.fixture(autouse=True)
def mock_supabase():
    shared_mock = MagicMock()
    with patch("app.api.reports.supabase", shared_mock), \
         patch("app.api.users.supabase", shared_mock), \
         patch("app.services.geo_service.supabase", shared_mock):
        yield shared_mock

@pytest.fixture(autouse=True)
def mock_supabase_admin():
    with patch("app.api.reports.supabase_admin") as mock:
        yield mock

# Mock Gemini
@pytest.fixture(autouse=True)
def mock_gemini():
    with patch("app.services.gemini_service.gemini_service") as mock:
        mock.analyze_report.return_value = {
            "enhanced_description": "Mocked AI Description",
            "urgency_score": 4,
            "hazards": ["Test Hazard"],
            "ai_verification_status": "Verified"
        }
        yield mock

# Mock Auth Dependency
@pytest.fixture
def mock_user():
    return {"id": "test-user-uuid", "email": "test@example.com"}

@pytest.fixture
def client(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
