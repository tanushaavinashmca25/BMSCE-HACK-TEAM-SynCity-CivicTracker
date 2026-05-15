from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone
from typing import List
from ..schemas import (
    UserProfile, UserStats, LevelInfo, LeaderboardEntry,
    Badge, ActivityItem, ProfileUpdate, OnboardingPayload,
)
from ..db.supabase import supabase, supabase_admin
from ..core.auth import get_current_user
from ..services.gamification import fetch_levels, resolve_level

router = APIRouter()


def _ensure_stats(user_id: str) -> dict:
    resp = supabase.table("user_stats").select("*").eq("user_id", user_id).execute()
    if resp.data:
        return resp.data[0]
    new_stats = {
        "user_id": user_id,
        "reputation_score": 0,
        "xp_total": 0,
        "streak_count": 0,
        "reports_submitted": 0,
        "reports_resolved": 0,
    }
    insert = (supabase_admin or supabase).table("user_stats").insert(new_stats).execute()
    return insert.data[0] if insert.data else new_stats


def _ensure_profile(user_id: str, email: str) -> dict:
    try:
        resp = supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()
        if resp.data:
            return resp.data[0]
        default = {"user_id": user_id}
        ins = (supabase_admin or supabase).table("user_profiles").insert(default).execute()
        return ins.data[0] if ins.data else default
    except Exception:
        return {"user_id": user_id}


def _build_stats(row: dict) -> UserStats:
    levels = fetch_levels()
    current, nxt, progress = resolve_level(row.get("xp_total", 0), levels)
    rank = 0
    try:
        rpc = supabase.rpc("get_user_rank", {"target": row["user_id"]}).execute()
        rank = rpc.data if isinstance(rpc.data, int) else (rpc.data[0] if rpc.data else 0)
    except Exception:
        rank = 0
    return UserStats(
        reputation_score=row.get("reputation_score", 0),
        xp_total=row.get("xp_total", 0),
        streak_count=row.get("streak_count", 0),
        reports_submitted=row.get("reports_submitted", 0),
        reports_resolved=row.get("reports_resolved", 0),
        level=current,
        next_level=nxt,
        progress_to_next=progress,
        rank=rank or 0,
    )


def _onboarding_complete(profile_row: dict) -> bool:
    # Explicit onboarding marker takes precedence so returning users (whose
    # profile rows predate the name/phone requirement) skip the screen.
    if profile_row.get("onboarded_at"):
        return True
    return (
        bool((profile_row.get("display_name") or "").strip())
        and bool((profile_row.get("phone") or "").strip())
    )


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    stats_row = _ensure_stats(current_user["id"])
    profile_row = _ensure_profile(current_user["id"], current_user.get("email") or "")
    return UserProfile(
        id=current_user["id"],
        email=current_user["email"],
        display_name=profile_row.get("display_name"),
        phone=profile_row.get("phone"),
        avatar_url=profile_row.get("avatar_url"),
        bio=profile_row.get("bio"),
        onboarding_complete=_onboarding_complete(profile_row),
        stats=_build_stats({**stats_row, "user_id": current_user["id"]}),
    )


@router.post("/onboarding", response_model=UserProfile)
async def complete_onboarding(
    body: OnboardingPayload,
    current_user: dict = Depends(get_current_user),
):
    client = supabase_admin or supabase
    user_id = current_user["id"]
    update_payload = {
        "display_name": body.display_name.strip(),
        "phone": body.phone.strip(),
        "onboarded_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        existing = client.table("user_profiles").select("user_id").eq("user_id", user_id).execute()
        if existing.data:
            client.table("user_profiles").update(update_payload).eq("user_id", user_id).execute()
        else:
            client.table("user_profiles").insert({"user_id": user_id, **update_payload}).execute()
    except Exception as e:
        import logging
        logging.getLogger("civic.users").exception("onboarding save failed user_id=%s", user_id)
        raise HTTPException(status_code=500, detail=f"Could not save profile: {e}")
    return await get_me(current_user)


@router.patch("/me", response_model=UserProfile)
async def update_me(
    body: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    payload = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if payload:
        payload["user_id"] = current_user["id"]
        (supabase_admin or supabase).table("user_profiles").upsert(payload).execute()
    return await get_me(current_user)


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def leaderboard(limit: int = Query(50, ge=1, le=200)):
    rows: List[dict] = []
    try:
        resp = supabase.rpc("get_leaderboard", {"limit_n": limit}).execute()
        rows = resp.data or []
    except Exception:
        rows = []

    # Fallback: query user_stats + user_profiles directly when the RPC is missing,
    # erroring, or has filtered everyone out.
    if not rows:
        try:
            stats_resp = (
                supabase.table("user_stats")
                .select("*")
                .order("xp_total", desc=True)
                .limit(limit)
                .execute()
            )
            stats = stats_resp.data or []
            user_ids = [s["user_id"] for s in stats if (s.get("xp_total") or 0) > 0]
            profiles_by_id: dict = {}
            if user_ids:
                prof_resp = (
                    supabase.table("user_profiles")
                    .select("user_id, display_name, avatar_url")
                    .in_("user_id", user_ids)
                    .execute()
                )
                profiles_by_id = {p["user_id"]: p for p in (prof_resp.data or [])}
            rank = 0
            for s in stats:
                if (s.get("xp_total") or 0) <= 0:
                    continue
                rank += 1
                prof = profiles_by_id.get(s["user_id"], {})
                rows.append({
                    "user_id": s["user_id"],
                    "display_name": prof.get("display_name"),
                    "avatar_url": prof.get("avatar_url"),
                    "xp_total": s.get("xp_total", 0),
                    "reputation_score": s.get("reputation_score", 0),
                    "streak_count": s.get("streak_count", 0),
                    "reports_submitted": s.get("reports_submitted", 0),
                    "reports_resolved": s.get("reports_resolved", 0),
                    "rank": rank,
                })
        except Exception:
            rows = []

    levels = fetch_levels()
    out: List[LeaderboardEntry] = []
    for r in rows:
        current, _, _ = resolve_level(r.get("xp_total", 0), levels)
        out.append(LeaderboardEntry(
            user_id=r["user_id"],
            display_name=r.get("display_name") or "Citizen",
            avatar_url=r.get("avatar_url"),
            xp_total=r.get("xp_total", 0),
            reputation_score=r.get("reputation_score", 0),
            streak_count=r.get("streak_count", 0),
            reports_submitted=r.get("reports_submitted", 0),
            reports_resolved=r.get("reports_resolved", 0),
            rank=r.get("rank", 0),
            level=current,
        ))
    return out


@router.get("/me/achievements", response_model=List[Badge])
async def my_achievements(current_user: dict = Depends(get_current_user)):
    try:
        catalog_resp = supabase.table("badges").select("*").order("sort_order").execute()
        catalog = catalog_resp.data or []
    except Exception:
        catalog = []
    try:
        awarded_resp = (
            supabase.table("user_badges")
            .select("badge_code, awarded_at")
            .eq("user_id", current_user["id"])
            .execute()
        )
        awarded = {row["badge_code"]: row["awarded_at"] for row in (awarded_resp.data or [])}
    except Exception:
        awarded = {}

    stats = _ensure_stats(current_user["id"])

    def progress_for(badge: dict) -> int:
        k = badge["kind"]
        if k == "reports":
            return stats.get("reports_submitted", 0)
        if k == "resolved":
            return stats.get("reports_resolved", 0)
        if k == "streak":
            return stats.get("streak_count", 0)
        if k == "reputation":
            return stats.get("reputation_score", 0)
        return 0

    out = []
    for b in catalog:
        out.append(Badge(
            code=b["code"],
            name=b["name"],
            description=b["description"],
            icon=b["icon"],
            color=b["color"],
            xp_reward=b.get("xp_reward", 0),
            threshold=b.get("threshold", 1),
            kind=b["kind"],
            awarded=b["code"] in awarded,
            awarded_at=awarded.get(b["code"]),
            progress=progress_for(b),
        ))
    return out


@router.get("/me/activity", response_model=List[ActivityItem])
async def my_activity(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    try:
        resp = (
            supabase.table("user_activity")
            .select("*")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [ActivityItem(**row) for row in (resp.data or [])]
    except Exception:
        return []
