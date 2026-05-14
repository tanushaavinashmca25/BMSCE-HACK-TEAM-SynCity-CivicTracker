import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, MapPin, Shield, User as UserIcon, MessageSquare, CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminApi, STATUSES } from "@/lib/api";
import { STATUS_COLORS, timeAgo } from "@/lib/format";
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
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <span
          className={`text-sm font-semibold inline-flex items-center rounded-full px-3 py-1 ring-1 ${
            STATUS_COLORS[report.status] || "bg-slate-100 text-slate-700 ring-slate-200"
          }`}
        >
          {report.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            {report.image_url ? (
              <Image
                src={report.image_url}
                alt={report.category}
                width={1200}
                height={800}
                className="w-full h-80 object-cover bg-slate-100"
                unoptimized
              />
            ) : (
              <div className="w-full h-80 bg-slate-100" />
            )}
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">{report.category}</h1>
                  <p className="text-sm text-muted-foreground">
                    Reported {timeAgo(report.created_at)} ·
                    {" "}
                    urgency {report.urgency_score}/5
                  </p>
                </div>
              </div>

              {report.address ? (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  {report.address}
                </div>
              ) : null}

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {report.location?.latitude?.toFixed(5)},
                {" "}
                {report.location?.longitude?.toFixed(5)}
              </div>

              {report.description ? (
                <div>
                  <h2 className="text-sm font-semibold mb-1">Description</h2>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {report.description}
                  </p>
                </div>
              ) : null}

              {report.user_note ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-md p-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    Note from reporter
                  </h2>
                  <p className="text-sm text-indigo-900 mt-1 whitespace-pre-wrap">
                    {report.user_note}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                Progress &amp; comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {updates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No updates yet. Post a status change or a comment below.
                </p>
              ) : (
                <ol className="relative border-l border-slate-200 ml-3 space-y-6">
                  {updates.map((u) => {
                    const isAuthority = u.author_role === "authority";
                    return (
                      <li key={u.id} className="ml-4">
                        <span
                          className={`absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${
                            isAuthority ? "bg-sky-500" : "bg-indigo-500"
                          }`}
                        >
                          {isAuthority ? (
                            <Shield className="h-3 w-3 text-white" />
                          ) : (
                            <UserIcon className="h-3 w-3 text-white" />
                          )}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {u.author_name || (isAuthority ? "Operations" : "Citizen")}
                          </span>
                          <span>·</span>
                          <span>{timeAgo(u.created_at)}</span>
                        </div>
                        {u.status_to ? (
                          <span
                            className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ring-1 ${
                              STATUS_COLORS[u.status_to] ||
                              "bg-slate-100 text-slate-700 ring-slate-200"
                            }`}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Status → {u.status_to}
                          </span>
                        ) : null}
                        {u.note ? (
                          <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
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
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Post update</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={action} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Change status (optional)
                  </label>
                  <select
                    name="status_to"
                    defaultValue=""
                    className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">— No change —</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Comment
                  </label>
                  <textarea
                    name="note"
                    rows={4}
                    placeholder="What did you find? What's next?"
                    className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Post update
                </Button>
                <p className="text-xs text-slate-500">
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
