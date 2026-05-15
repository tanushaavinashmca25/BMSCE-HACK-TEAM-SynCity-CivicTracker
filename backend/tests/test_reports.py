import pytest
from unittest.mock import MagicMock

def test_create_report_success(client, mock_supabase, mock_gemini):
    # Mock no duplicates
    mock_supabase.rpc().execute.return_value = MagicMock(data=[])
    
    # Mock successful insert
    mock_supabase.table().insert().execute.return_value = MagicMock(data=[{
        "id": "report-uuid",
        "user_id": "test-user-uuid",
        "category": "Pothole",
        "description": "Mocked AI Description",
        "image_url": "http://example.com/image.jpg",
        "location": {"latitude": 12.97, "longitude": 77.59},
        "status": "Reported",
        "urgency_score": 4,
        "created_at": "2026-05-14T00:00:00Z",
        "updated_at": "2026-05-14T00:00:00Z"
    }])

    report_data = {
        "category": "Pothole",
        "description": "Bumpy road",
        "location": {"latitude": 12.97, "longitude": 77.59},
        "image_url": "http://example.com/image.jpg"
    }

    response = client.post("/api/v1/reports/", json=report_data)
    
    assert response.status_code == 200
    assert response.json()["id"] == "report-uuid"
    assert response.json()["urgency_score"] == 4

def test_create_report_duplicate_error(client, mock_supabase):
    # Mock a duplicate found within radius
    mock_supabase.rpc().execute.return_value = MagicMock(data=[{
        "id": "existing-uuid",
        "distance": 5.2
    }])

    report_data = {
        "category": "Pothole",
        "location": {"latitude": 12.97, "longitude": 77.59},
        "image_url": "http://example.com/image.jpg"
    }

    response = client.post("/api/v1/reports/", json=report_data)
    
    assert response.status_code == 409
    assert "already been reported nearby" in response.json()["detail"]["message"]

def test_list_reports(client, mock_supabase):
    mock_supabase.table().select().order().limit().execute.return_value = MagicMock(data=[])
    
    response = client.get("/api/v1/reports/")
    assert response.status_code == 200
    assert response.json() == []
