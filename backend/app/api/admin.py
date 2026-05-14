from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..schemas import (
    ReportResponse, ReportUpdateEntry, ReportUpdateCreate, ReportStatus,
)
from ..db.supabase import supabase, supabase_admin
from ..core.admin_auth import require_admin

router = APIRouter()

VALID_STATUSES = {s.value for s in ReportStatus}


@router.get("/reports", response_model=List[ReportResponse])
async def admin_list_reports(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    _admin: dict = Depends(require_admin),
):
    q = supabase.table("reports").select("*")
    if status:
        q = q.eq("status", status)
    if category:
        q = q.eq("category", category)
    resp = q.order("created_at", desc=True).limit(limit).execute()
    return resp.data or []


@router.get("/kpis")
async def admin_kpis(_admin: dict = Depends(require_admin)):
    try:
        rows = supabase.table("reports").select("status, urgency_score, created_at").execute().data or []
    except Exception:
        rows = []

    total = len(rows)
    by_status: dict = {}
    high_urgency = 0
    from datetime import datetime, timezone, timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    resolved_24h = 0
    pending = 0
    in_progress = 0
    verified = 0
    for r in rows:
        st = r.get("status") or "Unknown"
        by_status[st] = by_status.get(st, 0) + 1
        if (r.get("urgency_score") or 0) >= 4:
            high_urgency += 1
        if st in ("Pending Review",):
            pending += 1
        if st in ("In-Progress", "Assigned"):
            in_progress += 1
        if st in ("Resolved", "Verified"):
            verified += 1
        try:
            ts_raw = r.get("created_at")
            if ts_raw and st in ("Resolved", "Verified"):
                ts = datetime.fromisoformat(str(ts_raw).replace("Z", "+00:00"))
                if ts >= cutoff:
                    resolved_24h += 1
        except Exception:
            pass

    try:
        users_count = (supabase.table("user_stats").select("user_id", count="exact").execute()).count or 0
    except Exception:
        users_count = 0

    return {
        "total_reports": total,
        "pending_review": pending,
        "in_progress": in_progress,
        "verified": verified,
        "resolved_24h": resolved_24h,
        "high_urgency": high_urgency,
        "by_status": by_status,
        "active_citizens": users_count,
    }


@router.post("/reports/{report_id}/updates", response_model=ReportUpdateEntry)
async def admin_add_update(
    report_id: str,
    body: ReportUpdateCreate,
    _admin: dict = Depends(require_admin),
):
    report_resp = supabase.table("reports").select("*").eq("id", report_id).single().execute()
    if not report_resp.data:
        raise HTTPException(status_code=404, detail="Report not found")

    if body.status_to and body.status_to.value not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    if not body.status_to and not (body.note and body.note.strip()):
        raise HTTPException(status_code=400, detail="Provide a note or a status change")

    if body.status_to:
        (supabase_admin or supabase).table("reports").update({
            "status": body.status_to.value,
            "updated_at": "now()",
        }).eq("id", report_id).execute()

    payload = {
        "report_id": report_id,
        "author_role": "authority",
        "author_name": "Operations",
        "status_to": body.status_to.value if body.status_to else None,
        "note": (body.note or "").strip() or None,
    }
    ins = (supabase_admin or supabase).table("report_updates").insert(payload).execute()

    if body.status_to and body.status_to.value in ("Resolved", "Verified"):
        try:
            user_id = report_resp.data.get("user_id")
            if user_id:
                (supabase_admin or supabase).rpc("award_xp", {
                    "target": user_id,
                    "delta_xp": 30,
                    "delta_rep": 3,
                    "kind": "report_resolved",
                    "title": "Your report was marked resolved",
                    "detail": payload.get("note") or "",
                    "ref": report_id,
                }).execute()
        except Exception:
            pass

    return ins.data[0]
