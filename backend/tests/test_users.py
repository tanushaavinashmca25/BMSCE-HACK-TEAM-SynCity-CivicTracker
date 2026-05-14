import pytest
from unittest.mock import MagicMock

def test_get_me_success(client, mock_supabase):
    # Mock user_stats fetch (list of data)
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[{
        "user_id": "test-user-uuid",
        "reputation_score": 100,
        "xp_total": 500,
        "streak_count": 5
    }])

    response = client.get("/api/v1/users/me")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "test-user-uuid"
    assert data["stats"]["reputation_score"] == 100
    assert data["stats"]["xp_total"] == 500

def test_get_me_initializes_stats(client, mock_supabase):
    # Mock user_stats not found initially
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[])
    # Mock subsequent insert
    mock_supabase.table().insert().execute.return_value = MagicMock(data=[{"user_id": "test-user-uuid", "reputation_score": 0, "xp_total": 0, "streak_count": 0}])

    response = client.get("/api/v1/users/me")
    
    assert response.status_code == 200
    assert response.json()["stats"]["reputation_score"] == 0
