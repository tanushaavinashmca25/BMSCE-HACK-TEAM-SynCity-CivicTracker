from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    GEMINI_API_KEY: str
    
    # App Settings
    APP_NAME: str = "SynCity"
    DEBUG: bool = True
    REPORT_PHOTOS_BUCKET: str = "report-photos"
    ADMIN_API_KEY: Optional[str] = None
    ALLOW_ADMIN_WITHOUT_KEY: bool = True  # demo-friendly default; flip in prod

    # YOLO inference (HuggingFace Space)
    YOLO_SERVICE_URL: Optional[str] = None
    YOLO_SERVICE_TOKEN: Optional[str] = None
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
