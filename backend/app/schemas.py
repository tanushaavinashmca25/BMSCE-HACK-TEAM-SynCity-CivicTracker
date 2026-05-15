from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
from datetime import datetime
from enum import Enum

class ReportStatus(str, Enum):
    REPORTED = "Reported"
    PENDING_REVIEW = "Pending Review"
    REJECTED = "Rejected"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In-Progress"
    RESOLVED = "Resolved"
    VERIFIED = "Verified"

class ReportCategory(str, Enum):
    POTHOLE = "Pothole"
    GARBAGE = "Garbage"
    UTILITY_FAULT = "Utility Fault"
    OTHER = "Other"

class GeoLocation(BaseModel):
    latitude: float
    longitude: float

class WardBase(BaseModel):
    ward_name: str
    assigned_officer_id: Optional[str] = None

class WardResponse(WardBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ContractBase(BaseModel):
    contractor_name: str
    warranty_expiry: Optional[datetime] = None

class ContractResponse(ContractBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ReportBase(BaseModel):
    category: ReportCategory
    description: Optional[str] = None
    location: GeoLocation
    address: Optional[str] = None

class ReportCreate(ReportBase):
    image_url: str
    image_path: Optional[str] = None
    exif_data: Optional[dict] = None
    user_note: Optional[str] = None

class ReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    urgency_score: Optional[int] = None
    assigned_officer_id: Optional[str] = None
    ward_id: Optional[str] = None
    contract_id: Optional[str] = None

class ReportResponse(ReportBase):
    id: str
    user_id: str
    status: ReportStatus
    urgency_score: int
    image_url: str
    image_path: Optional[str] = None
    ward_id: Optional[str] = None
    contract_id: Optional[str] = None
    user_note: Optional[str] = None
    yolo_result: Optional[dict] = None
    ai_analysis: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ReportUpdateEntry(BaseModel):
    id: str
    report_id: str
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    author_role: str
    status_to: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime


class ReportUpdateCreate(BaseModel):
    note: Optional[str] = None
    status_to: Optional[ReportStatus] = None
    author_role: str = "citizen"  # 'citizen' | 'authority' | 'system'

class LevelInfo(BaseModel):
    tier: int
    name: str
    min_xp: int
    color: str
    perks: Optional[str] = None

class UserStats(BaseModel):
    reputation_score: int = 0
    xp_total: int = 0
    streak_count: int = 0
    reports_submitted: int = 0
    reports_resolved: int = 0
    level: LevelInfo
    next_level: Optional[LevelInfo] = None
    progress_to_next: float = 0.0
    rank: int = 0

class UserProfile(BaseModel):
    id: str
    email: str
    display_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    onboarding_complete: bool = False
    stats: UserStats

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class OnboardingPayload(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=4, max_length=32)

class LeaderboardEntry(BaseModel):
    user_id: str
    display_name: str
    avatar_url: Optional[str] = None
    xp_total: int
    reputation_score: int
    streak_count: int
    reports_submitted: int
    reports_resolved: int
    rank: int
    level: LevelInfo

class Badge(BaseModel):
    code: str
    name: str
    description: str
    icon: str
    color: str
    xp_reward: int
    threshold: int
    kind: str
    awarded: bool = False
    awarded_at: Optional[datetime] = None
    progress: int = 0

class ActivityItem(BaseModel):
    id: str
    kind: str
    title: str
    detail: Optional[str] = None
    xp_delta: int
    ref_id: Optional[str] = None
    created_at: datetime

class CategoryInfo(BaseModel):
    code: str
    label: str
    icon: str
    color: str
    description: str

class AppConfig(BaseModel):
    app_name: str
    tagline: str
    categories: List[CategoryInfo]
    levels: List[LevelInfo]
    xp_rules: dict

class DeduplicationResult(BaseModel):
    is_duplicate: bool
    existing_report_id: Optional[str] = None
    distance_meters: Optional[float] = None
