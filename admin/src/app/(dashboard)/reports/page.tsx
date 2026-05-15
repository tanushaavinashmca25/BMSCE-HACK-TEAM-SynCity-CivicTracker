import Link from "next/link";
import { ArrowLeft, ListFilter, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportsTable } from "@/components/reports-table";
import { adminApi, STATUSES } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{ status?: string; category?: string }>;

async function loadData(params: { status?: string; category?: string }) {
  try {
    const [reports, config] = await Promise.all([
      adminApi.reports({ ...params, limit: 200 }),
      adminApi.config().catch(() => null),
    ]);
    return { reports, config, error: null as string | null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load";
    return { reports: [], config: null, error: msg };
  }
}

function buildHref(
  base: Record<string, string | undefined>,
  patch: Record<string, string | undefined>
): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...patch })) {
    if (v) merged[k] = v;
  }
  const qs = new URLSearchParams(merged).toString();
  return qs ? `/reports?${qs}` : "/reports";
}

export default async function ReportsListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { status, category } = params;
  const { reports, config, error } = await loadData({ status, category });

  const activeFilters = [status, category].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to dashboard
          </Link>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            All reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse, filter, and sort the full report log.
          </p>
        </div>
        <Badge variant="outline" className="h-7 px-2.5">
          {reports.length} {reports.length === 1 ? "report" : "reports"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListFilter className="h-4 w-4 text-muted-foreground" />
              Filters
            </CardTitle>
            {activeFilters > 0 ? (
              <Link
                href="/reports"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear all
              </Link>
            ) : null}
          </div>
          <CardDescription>
            Filters apply server-side. Sorting is client-side on the column
            headers below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip
                href={buildHref(params, { status: undefined })}
                active={!status}
                label="All"
              />
              {STATUSES.map((s) => (
                <FilterChip
                  key={s}
                  href={buildHref(params, { status: s })}
                  active={status === s}
                  label={s}
                />
              ))}
            </div>
          </div>
          {config?.categories?.length ? (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Category
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  href={buildHref(params, { category: undefined })}
                  active={!category}
                  label="All"
                />
                {config.categories.map((c) => (
                  <FilterChip
                    key={c.code}
                    href={buildHref(params, { category: c.code })}
                    active={category === c.code}
                    label={c.label}
                    color={c.color}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Couldn&apos;t reach the API ({error}).
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <ReportsTable reports={reports} sortable />
        </CardContent>
      </Card>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  color,
}: {
  href: string;
  active: boolean;
  label: string;
  color?: string;
}) {
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors " +
        (active
          ? "bg-primary text-primary-foreground ring-primary"
          : "bg-background text-foreground ring-border hover:bg-muted")
      }
    >
      {color ? (
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : null}
      {label}
    </Link>
  );
}
