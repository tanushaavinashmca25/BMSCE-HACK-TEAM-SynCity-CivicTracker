import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  TrendingUp,
  Activity,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReportsTable } from "@/components/reports-table";
import { ReportsMap } from "@/components/reports-map";
import { adminApi } from "@/lib/api";
import { STATUS_COLORS, STATUS_FALLBACK } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadData() {
  try {
    const [kpis, reports, config] = await Promise.all([
      adminApi.kpis(),
      adminApi.reports({ limit: 200 }),
      adminApi.config().catch(() => null),
    ]);
    return { kpis, reports, config, error: null as string | null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load";
    return { kpis: null, reports: [], config: null, error: msg };
  }
}

export default async function AdminDashboard() {
  const { kpis, reports, config, error } = await loadData();
  const recentReports = reports.slice(0, 10);

  const appName = config?.app_name || "Civic Tracker";

  const kpiCards = [
    {
      title: "Total reports",
      value: kpis?.total_reports ?? 0,
      icon: LayoutGrid,
      accent: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
      sub: kpis ? `${kpis.active_citizens} active citizens` : "—",
    },
    {
      title: "Pending review",
      value: kpis?.pending_review ?? 0,
      icon: Clock,
      accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
      sub: "Awaiting triage",
    },
    {
      title: "Resolved (24h)",
      value: kpis?.resolved_24h ?? 0,
      icon: CheckCircle2,
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
      sub: `${kpis?.verified ?? 0} verified total`,
    },
    {
      title: "High urgency",
      value: kpis?.high_urgency ?? 0,
      icon: AlertTriangle,
      accent: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
      sub: "Score ≥ 4",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {appName} Command Center
          </h1>
          <p className="text-sm text-muted-foreground">
            {config?.tagline ||
              "Operations dashboard for verified civic reports."}
          </p>
        </div>
        {kpis ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="h-7 px-2.5">
              In progress · {kpis.in_progress}
            </Badge>
            <Badge variant="outline" className="h-7 px-2.5">
              Verified · {kpis.verified}
            </Badge>
          </div>
        ) : null}
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Couldn&apos;t reach the API ({error}). Check that the FastAPI
            backend is running and that{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              NEXT_PUBLIC_API_URL
            </code>{" "}
            is set.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-md ${kpi.accent}`}
              >
                <kpi.icon className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="font-heading text-3xl font-semibold tabular-nums">
                {kpi.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-rose-500" />
                Reports map
              </CardTitle>
              <CardDescription>
                {reports.length} report{reports.length === 1 ? "" : "s"} plotted ·
                click a marker to open.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: "Reported", color: "#6366f1" },
                { label: "Pending", color: "#f59e0b" },
                { label: "In progress", color: "#0ea5e9" },
                { label: "Resolved", color: "#10b981" },
              ].map((l) => (
                <span
                  key={l.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <ReportsMap reports={reports} height={460} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Recent reports</CardTitle>
                <CardDescription>
                  Latest 10 submissions across all wards.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="h-6">
                  {reports.length}
                </Badge>
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ReportsTable reports={recentReports} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-indigo-500" />
                Status breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {kpis && Object.entries(kpis.by_status).length > 0 ? (
                Object.entries(kpis.by_status).map(([k, v], i, arr) => (
                  <div key={k}>
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          STATUS_COLORS[k] || STATUS_FALLBACK
                        }`}
                      >
                        {k}
                      </span>
                      <span className="font-semibold tabular-nums">{v}</span>
                    </div>
                    {i < arr.length - 1 ? <Separator className="mt-2" /> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No data.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-emerald-500" />
                Civic engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-heading text-3xl font-semibold tabular-nums">
                {kpis?.active_citizens ?? 0}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Citizens with stats on file
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-sky-500" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {config?.categories?.length ? (
                config.categories.map((c) => (
                  <div
                    key={c.code}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full ring-2 ring-background"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-medium">{c.label}</span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {c.description.slice(0, 32)}
                      {c.description.length > 32 ? "…" : ""}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No config.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-rose-500" />
                Coverage
              </CardTitle>
              <CardDescription>Reports geolocated to date</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-heading text-3xl font-semibold tabular-nums">
                {kpis?.total_reports ?? 0}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                across all wards
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
