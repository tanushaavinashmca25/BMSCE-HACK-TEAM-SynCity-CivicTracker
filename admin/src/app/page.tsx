import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Map as MapIcon,
  Users,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import { STATUS_COLORS, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadData() {
  try {
    const [kpis, reports, config] = await Promise.all([
      adminApi.kpis(),
      adminApi.reports({ limit: 20 }),
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

  const appName = config?.app_name || "Civic Tracker";

  const kpiCards = [
    {
      title: "Total reports",
      value: kpis?.total_reports ?? 0,
      icon: MapIcon,
      color: "text-indigo-600",
      sub: kpis ? `${kpis.active_citizens} active citizens` : "—",
    },
    {
      title: "Pending review",
      value: kpis?.pending_review ?? 0,
      icon: Clock,
      color: "text-amber-600",
      sub: "Awaiting triage",
    },
    {
      title: "Resolved (24h)",
      value: kpis?.resolved_24h ?? 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      sub: `${kpis?.verified ?? 0} verified total`,
    },
    {
      title: "High urgency",
      value: kpis?.high_urgency ?? 0,
      icon: AlertTriangle,
      color: "text-rose-600",
      sub: "Score ≥ 4",
    },
  ];

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {appName} Command Center
          </h1>
          <p className="text-muted-foreground">
            {config?.tagline || "Operations dashboard for verified civic reports."}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {kpis && (
            <>
              <Badge variant="outline" className="px-3 py-1">
                In progress: {kpis.in_progress}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                Verified: {kpis.verified}
              </Badge>
            </>
          )}
        </div>
      </div>

      {error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="py-4 text-sm text-rose-700">
            Couldn&apos;t reach the API ({error}). Check that the FastAPI backend is
            running and that <code>NEXT_PUBLIC_API_URL</code> is set.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent reports</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No reports yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Photo</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {report.image_url ? (
                          <Link href={`/reports/${report.id}`}>
                            <Image
                              src={report.image_url}
                              alt={report.category}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-md object-cover bg-slate-100"
                              unoptimized
                            />
                          </Link>
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-slate-100" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/reports/${report.id}`}
                          className="font-medium hover:underline"
                        >
                          {report.category}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[220px] truncate">
                        {report.address ||
                          `${report.location?.latitude?.toFixed(4)}, ${report.location?.longitude?.toFixed(4)}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 w-3 rounded-full ${
                                i < (report.urgency_score || 0)
                                  ? "bg-rose-500"
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold inline-flex items-center rounded-full px-2 py-0.5 ring-1 ${
                            STATUS_COLORS[report.status] || "bg-slate-100 text-slate-700 ring-slate-200"
                          }`}
                        >
                          {report.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {timeAgo(report.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
                Object.entries(kpis.by_status).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-semibold tabular-nums">{v}</span>
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
              <div className="text-3xl font-bold tabular-nums">
                {kpis?.active_citizens ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
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
            <CardContent className="space-y-2">
              {config?.categories?.length ? (
                config.categories.map((c) => (
                  <div
                    key={c.code}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
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
        </div>
      </div>
    </div>
  );
}
