"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { MapPin } from "lucide-react";
import {
  loadLeaflet,
  pinIcon,
  STATUS_PIN,
  FALLBACK_PIN,
  OSM_TILES,
} from "@/lib/leaflet";

export function ReportMap({
  id,
  latitude,
  longitude,
  status,
  height = 280,
  zoom = 16,
}: {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  height?: number;
  zoom?: number;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const [phase, setPhase] = React.useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then(() => {
        if (cancelled || !containerRef.current || !window.L) return;
        const L = window.L;
        if (!mapRef.current) {
          mapRef.current = L.map(containerRef.current, {
            center: [latitude, longitude],
            zoom,
            scrollWheelZoom: false,
            zoomControl: true,
          });
          L.tileLayer(OSM_TILES.url, {
            attribution: OSM_TILES.attribution,
            maxZoom: 19,
          }).addTo(mapRef.current);
        }
        const color = STATUS_PIN[status] || FALLBACK_PIN;
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker([latitude, longitude], {
          icon: pinIcon(L, color, id, 1.3),
        }).addTo(mapRef.current);
        mapRef.current.setView([latitude, longitude], zoom);
        setPhase("ready");
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id, latitude, longitude, status, zoom]);

  if (phase === "error") {
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
      {phase !== "ready" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-background/60 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          Loading map…
        </div>
      ) : null}
    </div>
  );
}
