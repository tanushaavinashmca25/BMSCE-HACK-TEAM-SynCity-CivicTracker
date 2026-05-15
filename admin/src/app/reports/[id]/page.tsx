import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Shield,
  User as UserIcon,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Send,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { adminApi, STATUSES } from "@/lib/api";
import { STATUS_COLORS, STATUS_FALLBACK, timeAgo } from "@/lib/format";
import { postUpdate } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let report;
  let updates;
  try {
    [report, updates] = await Promise.all([
      adminApi.report(id),
      adminApi.reportUpdates(id).catch(() => []),
    ]);
  } catch {
    notFound();
  }
  if (!report) notFound();

  const action = postUpdate.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ${
            STATUS_COLORS[report.status] || STATUS_FALLBACK
          }`}
        >
          {report.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            {report.image_url ? (
              <Image
                src={report.image_url}
                alt={report.category}
                width={1200}
                height={800}
                className="h-80 w-full bg-muted object-cover"
                unoptimized
              />
            ) : (
              <div className="h-80 w-full bg-muted" />
            )}
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h1 className="font-heading text-2xl font-semibold tracking-tight">
                    {report.category}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Reported {timeAgo(report.created_at)}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                    report.urgency_score >= 4
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Urgency {report.urgency_score}/5
                </span>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {report.address ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{report.address}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="font-mono text-xs">
                    {report.location?.latitude?.toFixed(5)},{" "}
                    {report.location?.longitude?.toFixed(5)}
                  </span>
                </div>
              </div>

              {report.description ? (
                <div className="space-y-1">
                  <Label>Description</Label>
                  <p className="whitespace-pre-wrap text-sm">
                    {report.description}
                  </p>
                </div>
              ) : null}

              {report.user_note ? (
                <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-500/25 dark:bg-indigo-500/10">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Note from reporter
                  </h2>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-indigo-900 dark:text-indigo-100">
                    {report.user_note}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Progress &amp; comments
              </CardTitle>
              <CardDescription>
                Timeline of status changes and authority responses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {updates.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No updates yet. Post a status change or a comment below.
                </p>
              ) : (
                <ol className="relative ml-3 space-y-6 border-l border-border">
                  {updates.map((u) => {
                    const isAuthority = u.author_role === "authority";
                    return (
                      <li key={u.id} className="ml-4">
                        <span
                          className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background ${
                            isAuthority
                              ? "bg-sky-500 text-white"
                              : "bg-indigo-500 text-white"
                          }`}
                        >
                          {isAuthority ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <UserIcon className="h-3 w-3" />
                          )}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {u.author_name ||
                              (isAuthority ? "Operations" : "Citizen")}
                          </span>
                          <span>·</span>
                          <span>{timeAgo(u.created_at)}</span>
                        </div>
                        {u.status_to ? (
                          <span
                            className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                              STATUS_COLORS[u.status_to] || STATUS_FALLBACK
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Status → {u.status_to}
                          </span>
                        ) : null}
                        {u.note ? (
                          <p className="mt-1.5 whitespace-pre-wrap text-sm">
                            {u.note}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Post update</CardTitle>
              <CardDescription>
                Notify the reporter and move the report forward.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={action} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="status_to">Change status (optional)</Label>
                  <NativeSelect
                    id="status_to"
                    name="status_to"
                    defaultValue=""
                  >
                    <option value="">— No change —</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="note">Comment</Label>
                  <Textarea
                    id="note"
                    name="note"
                    rows={4}
                    placeholder="What did you find? What's next?"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <Send className="h-4 w-4" />
                  Post update
                </Button>
                <p className="text-xs text-muted-foreground">
                  Reporters get notified and earn XP when their report is marked
                  Resolved or Verified.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
