import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional
from ..schemas import (
    ReportCreate, ReportResponse, DeduplicationResult, GeoLocation,
    ReportUpdateEntry, ReportUpdateCreate,
)
from ..db.supabase import supabase, supabase_admin
from ..services.geo_service import GeoService
from ..services.gemini_service import gemini_service
from ..services import yolo_service
from ..core.auth import get_current_user
import uuid

logger = logging.getLogger("civic.reports")

# XP table
XP_REPORT_SUBMITTED = 0          # no XP for just submitting; earn on verification
XP_REPORT_VERIFIED = 25           # YOLO-confirmed
XP_REPORT_RESOLVED_OWN = 50      # your report verified resolved
REP_VERIFIED = 2

router = APIRouter()


def _bump_streak(user_id: str) -> None:
    """
    Increment the user's daily streak.

    Rules (UTC):
      - First action ever → streak = 1
      - Same UTC day as last → no change
      - Exactly one day after last → +1
      - Any larger gap → reset to 1

    Resilient to a missing `streak_last_at` column: if the write or read fails
    because the column isn't there, falls back to just bumping streak_count.
    """
    client = supabase_admin or supabase
    today = datetime.now(timezone.utc).date()

    current = {}
    try:
        resp = (
            client.table("user_stats")
            .select("streak_count, streak_last_at")
            .eq("user_id", user_id)
            .execute()
        )
        current = (resp.data or [{}])[0]
    except Exception:
        # Column may not exist — try again without it so we can still bump.
        try:
            resp = (
                client.table("user_stats")
                .select("streak_count")
                .eq("user_id", user_id)
                .execute()
            )
            current = (resp.data or [{}])[0]
        except Exception:
            current = {}

    last_at_raw = current.get("streak_last_at")
    last_date = None
    if last_at_raw:
        try:
            last_date = datetime.fromisoformat(str(last_at_raw).replace("Z", "+00:00")).date()
        except Exception:
            last_date = None

    if last_date == today:
        return  # already counted today

    if last_date and (today - last_date) == timedelta(days=1):
        new_streak = (current.get("streak_count") or 0) + 1
    else:
        new_streak = 1

    payload = {
        "user_id": user_id,
        "streak_count": new_streak,
        "streak_last_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        client.table("user_stats").upsert(payload).execute()
    except Exception:
        # Schema doesn't have streak_last_at — degrade gracefully.
        try:
            client.table("user_stats").upsert({
                "user_id": user_id,
                "streak_count": new_streak,
            }).execute()
        except Exception:
            logger.exception("streak update failed for %s", user_id)


def _award(target_user: str, xp: int, rep: int, kind: str, title: str, detail: str, ref: Optional[str] = None):
    """Best-effort gamification update via RPC, falling back to direct table writes."""
    try:
        (supabase_admin or supabase).rpc("award_xp", {
            "target": target_user,
            "delta_xp": xp,
            "delta_rep": rep,
            "kind": kind,
            "title": title,
            "detail": detail,
            "ref": ref,
        }).execute()
    except Exception:
        try:
            (supabase_admin or supabase).table("user_stats").upsert({
                "user_id": target_user,
                "xp_total": xp,
                "reputation_score": rep,
            }).execute()
        except Exception:
            pass


async def _verify_report_async(report_id: str, image_url: str, category: str, user_id: str):
    """
    Background verification job: runs YOLO (truth) and Gemini (rich context).
    YOLO determines verified/rejected. Gemini result is stored as additional
    metadata for authorities — never used to gate XP.
    """
    yolo = await yolo_service.verify(image_url, category)

    # Gemini runs alongside for richer description / urgency / hazards.
    gemini_result = {}
    try:
        gemini_result = await gemini_service.analyze_report(
            image_url, category, "", image_path=None,
        )
    except Exception as e:
        logger.exception("gemini failed for %s: %s", report_id, e)

    gemini_verified = gemini_result.get("ai_verification_status") == "Verified"
    verified = (yolo.ok and yolo.category_detected) or gemini_verified

    if verified:
        new_status = "Verified"
    elif gemini_result.get("ai_verification_status") == "Inauthentic":
        new_status = "Rejected"
    else:
        new_status = "Rejected" if yolo.ok else "Pending Review"

    update = {
        "status": new_status,
        "yolo_result": yolo.as_dict(),
        "ai_analysis": gemini_result or None,
        "urgency_score": int(gemini_result.get("urgency_score", 1)) if gemini_result else 1,
        "updated_at": "now()",
    }
    if gemini_result.get("enhanced_description"):
        update["description"] = gemini_result["enhanced_description"]

    try:
        (supabase_admin or supabase).table("reports").update(update).eq("id", report_id).execute()
    except Exception as e:
        logger.exception("verify update failed for %s: %s", report_id, e)
        return

    if verified:
        _award(
            user_id,
            xp=XP_REPORT_VERIFIED,
            rep=REP_VERIFIED,
            kind="report_verified",
            title=f"{category} verified",
            detail=None,
            ref=report_id,
        )
        _bump_streak(user_id)


@router.post("/", response_model=ReportResponse)
async def create_report(
    report: ReportCreate,
    background: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    force: bool = Query(False),
):
    if not force:
        dedup = await GeoService.check_deduplication(report.location, report.category)
        if dedup.is_duplicate:
            existing = None
            try:
                existing_resp = (
                    supabase.table("reports")
                    .select("id, image_url, description, category, status, created_at, user_note, address")
                    .eq("id", dedup.existing_report_id)
                    .single()
                    .execute()
                )
                existing = existing_resp.data
            except Exception:
                existing = None
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "A similar issue has already been reported nearby.",
                    "existing_report_id": dedup.existing_report_id,
                    "distance": dedup.distance_meters,
                    "existing_report": existing,
                },
            )

    report_data = {
        "user_id": current_user["id"],
        "category": report.category,
        "description": report.description,
        "image_url": report.image_url,
        "image_path": report.image_path,
        "location": {"latitude": report.location.latitude, "longitude": report.location.longitude},
        "status": "Pending Review",
        "urgency_score": 1,
        "exif_data": report.exif_data,
        "address": report.address,
        "user_note": (report.user_note or None),
        "geom": f"POINT({report.location.longitude} {report.location.latitude})",
    }

    response = supabase.table("reports").insert(report_data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create report")
    created_report = response.data[0]

    # Bump the submitted counter (no XP yet — that happens on verification).
    try:
        current = (
            supabase.table("user_stats")
            .select("reports_submitted")
            .eq("user_id", current_user["id"])
            .execute()
        )
        prev = (current.data or [{}])[0].get("reports_submitted") or 0
        (supabase_admin or supabase).table("user_stats").upsert({
            "user_id": current_user["id"],
            "reports_submitted": prev + 1,
        }).execute()
    except Exception:
        pass

    background.add_task(
        _verify_report_async,
        created_report["id"],
        report.image_url,
        report.category,
        current_user["id"],
    )

    return created_report


@router.get("/", response_model=List[ReportResponse])
async def list_reports(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[float] = 1000,
    category: Optional[str] = None,
    status: Optional[str] = None
):
    query = supabase.table("reports").select("*")
    if status:
        query = query.eq("status", status)
    if category:
        query = query.eq("category", category)
    if lat is not None and lng is not None:
        response = supabase.rpc('get_reports_in_radius', {
            'lat': lat, 'lng': lng, 'radius_meters': radius
        }).execute()
        return response.data or []
    response = query.order("created_at", desc=True).limit(50).execute()
    return response.data or []


@router.get("/me", response_model=List[ReportResponse])
async def my_reports(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    resp = (
        supabase.table("reports")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data or []


class WardReportsResponse(BaseModel):
    ward: Optional[dict] = None
    reports: List[ReportResponse]
    fallback: bool = False  # true when ward couldn't be resolved and we used radius


@router.get("/ward", response_model=WardReportsResponse)
async def ward_reports(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_meters: float = Query(2000, ge=100, le=10000),
    limit: int = Query(100, ge=1, le=500),
):
    """
    Reports for the user's ward. Tries a Postgres function `find_ward_for_point(lat, lng)`
    first; if it isn't deployed or returns nothing, falls back to a radius scan around
    the GPS so the screen is always populated.
    """
    ward = None
    reports: List[dict] = []

    try:
        resp = supabase.rpc("find_ward_for_point", {"lat": lat, "lng": lng}).execute()
        data = resp.data
        if data:
            ward = data[0] if isinstance(data, list) else data
    except Exception:
        ward = None

    if ward and ward.get("id"):
        try:
            r = (
                supabase.table("reports")
                .select("*")
                .eq("ward_id", ward["id"])
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            reports = r.data or []
        except Exception:
            reports = []

    if not reports:
        try:
            r = supabase.rpc(
                "get_reports_in_radius",
                {"lat": lat, "lng": lng, "radius_meters": radius_meters},
            ).execute()
            reports = r.data or []
        except Exception:
            reports = []
        return WardReportsResponse(ward=ward, reports=reports, fallback=True)

    return WardReportsResponse(ward=ward, reports=reports, fallback=False)


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str):
    resp = supabase.table("reports").select("*").eq("id", report_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Report not found")
    return resp.data


@router.get("/{report_id}/updates", response_model=List[ReportUpdateEntry])
async def list_report_updates(report_id: str):
    try:
        rpc = supabase.rpc("get_report_updates", {"target": report_id}).execute()
        return rpc.data or []
    except Exception:
        resp = (
            supabase.table("report_updates")
            .select("*")
            .eq("report_id", report_id)
            .order("created_at")
            .execute()
        )
        return resp.data or []


@router.post("/{report_id}/updates", response_model=ReportUpdateEntry)
async def add_report_comment(
    report_id: str,
    body: ReportUpdateCreate,
    current_user: dict = Depends(get_current_user),
):
    """Citizens can post comments. Status changes from this endpoint are ignored."""
    if not (body.note and body.note.strip()):
        raise HTTPException(status_code=400, detail="note is required")

    report_resp = supabase.table("reports").select("id, user_id").eq("id", report_id).single().execute()
    if not report_resp.data:
        raise HTTPException(status_code=404, detail="Report not found")

    payload = {
        "report_id": report_id,
        "author_id": current_user["id"],
        "author_role": "citizen",
        "note": body.note.strip(),
    }
    ins = (supabase_admin or supabase).table("report_updates").insert(payload).execute()
    return ins.data[0]


@router.get("/clusters")
async def get_clusters(radius_meters: float = Query(10.0)):
    response = supabase.rpc('get_report_clusters', {'radius_meters': radius_meters}).execute()
    return response.data or []


class ResolveReportRequest(BaseModel):
    resolution_image_url: str
    resolution_image_path: Optional[str] = None


@router.post("/{report_id}/resolve", response_model=ReportResponse)
async def resolve_report(
    report_id: str,
    body: ResolveReportRequest,
    current_user: dict = Depends(get_current_user)
):
    report_response = supabase.table("reports").select("*").eq("id", report_id).single().execute()
    if not report_response.data:
        raise HTTPException(status_code=404, detail="Report not found")
    original_report = report_response.data

    ai_verification = await gemini_service.verify_resolution(
        original_report["image_url"],
        body.resolution_image_url,
        original_image_path=original_report.get("image_path"),
        resolution_image_path=body.resolution_image_path,
    )
    if not ai_verification.get("is_resolved"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "AI could not verify resolution. Evidence insufficient.",
                "reasoning": ai_verification.get("reasoning"),
            }
        )

    response = supabase.table("reports").update({
        "status": "Verified",
        "updated_at": "now()"
    }).eq("id", report_id).execute()

    xp_to_award = 50 if ai_verification.get("confidence_score", 0) > 0.8 else 20
    _award(
        original_report["user_id"],
        xp=xp_to_award,
        rep=5,
        kind="report_resolved",
        title="Report resolved",
        detail=f"Your {original_report.get('category')} report was verified resolved.",
        ref=report_id,
    )
    try:
        (supabase_admin or supabase).table("user_stats").update({
            "reports_resolved": (supabase.table("user_stats")
                                 .select("reports_resolved")
                                 .eq("user_id", original_report["user_id"])
                                 .execute()
                                 .data[0].get("reports_resolved", 0) + 1)
        }).eq("user_id", original_report["user_id"]).execute()
    except Exception:
        pass

    return response.data[0]
