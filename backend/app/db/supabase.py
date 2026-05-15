from supabase import create_client, Client
from ..config import settings

try:
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
except Exception:
    # Fallback for testing/initialization without keys
    supabase = None
    supabase_admin = None
