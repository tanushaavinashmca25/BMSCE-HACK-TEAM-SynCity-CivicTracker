from typing import Optional, List
from ..db.supabase import supabase
from ..schemas import LevelInfo


def fetch_levels() -> List[LevelInfo]:
    try:
        resp = supabase.table("levels").select("*").order("tier").execute()
        return [LevelInfo(**row) for row in (resp.data or [])]
    except Exception:
        # Fallback list keeps the API usable if the table isn't migrated yet.
        return [
            LevelInfo(tier=1, name="Junior Inspector", min_xp=0, color="#94A3B8"),
            LevelInfo(tier=2, name="Urban Scout", min_xp=100, color="#0EA5E9"),
            LevelInfo(tier=3, name="Civic Guardian", min_xp=500, color="#10B981"),
            LevelInfo(tier=4, name="Urban Architect", min_xp=1500, color="#F59E0B"),
            LevelInfo(tier=5, name="Civic Legend", min_xp=5000, color="#EF4444"),
        ]


def resolve_level(xp: int, levels: List[LevelInfo]):
    """Return (current_level, next_level_or_None, progress_to_next 0..1)."""
    levels_sorted = sorted(levels, key=lambda l: l.min_xp)
    current = levels_sorted[0]
    nxt: Optional[LevelInfo] = None
    for i, lvl in enumerate(levels_sorted):
        if xp >= lvl.min_xp:
            current = lvl
            nxt = levels_sorted[i + 1] if i + 1 < len(levels_sorted) else None
    if nxt is None:
        return current, None, 1.0
    span = max(1, nxt.min_xp - current.min_xp)
    progress = max(0.0, min(1.0, (xp - current.min_xp) / span))
    return current, nxt, progress
