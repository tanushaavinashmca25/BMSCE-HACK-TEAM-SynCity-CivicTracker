from fastapi import APIRouter
from ..schemas import AppConfig, CategoryInfo
from ..services.gamification import fetch_levels

router = APIRouter()


@router.get("/", response_model=AppConfig)
async def get_app_config():
    categories = [
        CategoryInfo(
            code="Pothole",
            label="Pothole",
            icon="road",
            color="#F97316",
            description="Damaged road surfaces or potholes.",
        ),
        CategoryInfo(
            code="Garbage",
            label="Garbage",
            icon="trash",
            color="#10B981",
            description="Uncollected waste or illegal dumping.",
        ),
        CategoryInfo(
            code="Utility Fault",
            label="Utility Fault",
            icon="bolt",
            color="#F59E0B",
            description="Broken streetlights, leaks, exposed wiring.",
        ),
        CategoryInfo(
            code="Other",
            label="Other",
            icon="alert",
            color="#6366F1",
            description="Anything else affecting your neighborhood.",
        ),
    ]
    return AppConfig(
        app_name="Civic Tracker",
        tagline="Spot it. Snap it. Solve it.",
        categories=categories,
        levels=fetch_levels(),
        xp_rules={
            "report_submitted": 10,
            "report_verified": 25,
            "report_resolved": 50,
            "streak_day": 5,
        },
    )
