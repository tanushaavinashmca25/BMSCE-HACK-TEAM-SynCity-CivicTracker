"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Report } from "@/lib/api";
import { STATUS_COLORS, STATUS_FALLBACK, timeAgo } from "@/lib/format";

type SortKey = "category" | "urgency" | "status" | "created";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<string, number> = {
  Reported: 0,
  "Pending Review": 1,
  Assigned: 2,
  "In-Progress": 3,
  Resolved: 4,
  Verified: 5,
};

function compare(a: Report, b: Report, key: SortKey): number {
  switch (key) {
    case "category":
      return a.category.localeCompare(b.category);
    case "urgency":
      return (a.urgency_score || 0) - (b.urgency_score || 0);
    case "status":
      return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    case "created":
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  }
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-left font-medium transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        className
      )}
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  );
}

export function ReportsTable({
  reports,
  sortable = false,
  defaultSortKey = "created",
  defaultSortDir = "desc",
}: {
  reports: Report[];
  sortable?: boolean;
  defaultSortKey?: SortKey;
  defaultSortDir?: SortDir;
}) {
  const router = useRouter();
  const [sortKey, setSortKey] = React.useState<SortKey>(defaultSortKey);
  const [sortDir, setSortDir] = React.useState<SortDir>(defaultSortDir);

  const sorted = React.useMemo(() => {
    if (!sortable) return reports;
    const out = [...reports].sort((a, b) => compare(a, b, sortKey));
    return sortDir === "asc" ? out : out.reverse();
  }, [reports, sortable, sortKey, sortDir]);

  const toggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "created" || key === "urgency" ? "desc" : "asc");
    }
  };

  if (reports.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No reports match the current filters.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px] pl-4">Photo</TableHead>
          <TableHead>
            {sortable ? (
              <SortHeader
                label="Category"
                active={sortKey === "category"}
                dir={sortDir}
                onClick={() => toggle("category")}
              />
            ) : (
              "Category"
            )}
          </TableHead>
          <TableHead>Address</TableHead>
          <TableHead>
            {sortable ? (
              <SortHeader
                label="Urgency"
                active={sortKey === "urgency"}
                dir={sortDir}
                onClick={() => toggle("urgency")}
              />
            ) : (
              "Urgency"
            )}
          </TableHead>
          <TableHead>
            {sortable ? (
              <SortHeader
                label="Status"
                active={sortKey === "status"}
                dir={sortDir}
                onClick={() => toggle("status")}
              />
            ) : (
              "Status"
            )}
          </TableHead>
          <TableHead className="pr-4">
            {sortable ? (
              <SortHeader
                label="When"
                active={sortKey === "created"}
                dir={sortDir}
                onClick={() => toggle("created")}
              />
            ) : (
              "When"
            )}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((report) => {
          const href = `/reports/${report.id}`;
          const go = () => router.push(href);
          return (
            <TableRow
              key={report.id}
              onClick={go}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  go();
                }
              }}
              tabIndex={0}
              role="link"
              aria-label={`View report ${report.category}`}
              className="group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <TableCell className="pl-4">
                {report.image_url ? (
                  <Image
                    src={report.image_url}
                    alt={report.category}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-md bg-muted object-cover ring-1 ring-border"
                    unoptimized
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-muted ring-1 ring-border" />
                )}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 font-medium">
                  {report.category}
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </TableCell>
              <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
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
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                    STATUS_COLORS[report.status] || STATUS_FALLBACK
                  }`}
                >
                  {report.status}
                </span>
              </TableCell>
              <TableCell className="pr-4 text-sm text-muted-foreground">
                {timeAgo(report.created_at)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
