export const STATUS_COLORS: Record<string, string> = {
  Reported: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  "Pending Review": "bg-amber-100 text-amber-700 ring-amber-200",
  Assigned: "bg-sky-100 text-sky-700 ring-sky-200",
  "In-Progress": "bg-sky-100 text-sky-700 ring-sky-200",
  Resolved: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  Verified: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return iso;
  const diff = Date.now() - t;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString();
}
