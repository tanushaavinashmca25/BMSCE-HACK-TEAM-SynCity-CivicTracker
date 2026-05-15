"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import type { Report } from "@/lib/api";
import {
  loadLeaflet,
  pinIcon,
  STATUS_PIN,
  FALLBACK_PIN,
  OSM_TILES,
  escapeHtml,
} from "@/lib/leaflet";

export function ReportsMap({
  reports,
  height = 460,
}: {
  reports: Report[];
  height?: number;
}) {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const layerRef = React.useRef<any>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [error, setError] = React.useState<string | null>(null);

  const points = React.useMemo(
    () =>
      reports.filter(
        (r) =>
          typeof r.location?.latitude === "number" &&
          typeof r.location?.longitude === "number"
      ),
    [reports]
  );

  React.useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then(() => {
        if (cancelled || !containerRef.current || !window.L) return;
        const L = window.L;
        if (!mapRef.current) {
          mapRef.current = L.map(containerRef.current, {
            center: [12.9716, 77.5946],
            zoom: 11,
            scrollWheelZoom: true,
            zoomControl: true,
          });
          L.tileLayer(OSM_TILES.url, {
            attribution: OSM_TILES.attribution,
            maxZoom: 19,
          }).addTo(mapRef.current);
        }
        setStatus("ready");
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.L) return;
    const L = window.L;

    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }

    if (points.length === 0) return;

    // Reports submitted from the same building often share identical GPS
    // coordinates and would stack into a single visible pin. Fan them out in
    // a tiny circle (~9m radius) so every report is clickable.
    const groups = new Map<string, Report[]>();
    points.forEach((r) => {
      const key = `${r.location.latitude.toFixed(5)},${r.location.longitude.toFixed(5)}`;
      const arr = groups.get(key) ?? [];
      arr.push(r);
      groups.set(key, arr);
    });

    const layer = L.layerGroup();
    const latlngs: [number, number][] = [];

    groups.forEach((bucket) => {
      bucket.forEach((r, i) => {
        let lat = r.location.latitude;
        let lng = r.location.longitude;
        if (bucket.length > 1) {
          const angle = (2 * Math.PI * i) / bucket.length;
          const dLat = 0.00008 * Math.cos(angle); // ~9m N/S
          const dLng =
            (0.00008 * Math.sin(angle)) /
            Math.max(Math.cos((lat * Math.PI) / 180), 0.1);
          lat += dLat;
          lng += dLng;
        }
        latlngs.push([lat, lng]);

        const color = STATUS_PIN[r.status] || FALLBACK_PIN;
        const marker = L.marker([lat, lng], {
          icon: pinIcon(L, color, r.id),
          riseOnHover: true,
        });

        const html = `
          <div style="font-family: ui-sans-serif, system-ui; min-width: 200px;">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 2px;">
              ${escapeHtml(r.category)}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
              ${escapeHtml(r.address || "")}
            </div>
            <div style="display: inline-block; padding: 2px 8px; border-radius: 999px;
              font-size: 11px; font-weight: 600; color: white; background: ${color};">
              ${escapeHtml(r.status)}
            </div>
            <div style="margin-top: 8px;">
              <a href="/reports/${encodeURIComponent(r.id)}"
                 data-report-id="${escapeHtml(r.id)}"
                 style="font-size: 12px; color: #4f46e5; font-weight: 600; text-decoration: none;">
                Open report →
              </a>
            </div>
          </div>`;
        marker.bindPopup(html);
        marker.on("popupopen", () => {
          const a = document.querySelector<HTMLAnchorElement>(
            `a[data-report-id="${r.id}"]`
          );
          if (a) {
            a.addEventListener("click", (ev) => {
              ev.preventDefault();
              router.push(`/reports/${r.id}`);
            });
          }
        });
        marker.bindTooltip(`${r.category} · ${r.status}`, { direction: "top" });
        marker.addTo(layer);
      });
    });

    layer.addTo(mapRef.current);
    layerRef.current = layer;

    if (latlngs.length === 1) {
      mapRef.current.setView(latlngs[0], 15);
    } else {
      mapRef.current.fitBounds(latlngs, { padding: [40, 40] });
    }
  }, [points, status, router]);

  if (status === "error") {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
        style={{ minHeight: height }}
      >
        {error || "Failed to load the map."}
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden rounded-md ring-1 ring-border"
      />
      {status !== "ready" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-background/60 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          Loading map…
        </div>
      ) : null}
    </div>
  );
}
