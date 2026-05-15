/* eslint-disable @typescript-eslint/no-explicit-any */

const LEAFLET_VERSION = "1.9.4";
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;

declare global {
  interface Window {
    L?: any;
    __leafletLoading?: Promise<void>;
  }
}

export function loadLeaflet(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.L) return Promise.resolve();
  if (window.__leafletLoading) return window.__leafletLoading;

  window.__leafletLoading = new Promise<void>((resolve, reject) => {
    if (!document.querySelector(`link[data-leaflet="1"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      link.dataset.leaflet = "1";
      document.head.appendChild(link);
    }
    const s = document.createElement("script");
    s.src = LEAFLET_JS;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Leaflet"));
    document.head.appendChild(s);
  });
  return window.__leafletLoading;
}

export const STATUS_PIN: Record<string, string> = {
  Reported: "#0B2D6B",
  "Pending Review": "#B45309",
  Rejected: "#B91C1C",
  Assigned: "#0369A1",
  "In-Progress": "#0369A1",
  Resolved: "#047857",
  Verified: "#047857",
};
export const FALLBACK_PIN = "#64748b";

export function pinIcon(L: any, color: string, key: string, size: 1 | 1.3 = 1) {
  const w = Math.round(34 * size);
  const h = Math.round(46 * size);
  const svg = `
    <svg width="${w}" height="${h}" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg"
         style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)) drop-shadow(0 1px 2px rgba(0,0,0,0.25));">
      <defs>
        <linearGradient id="g-${key}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.78"/>
        </linearGradient>
        <radialGradient id="hi-${key}" cx="0.35" cy="0.3" r="0.4">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <path d="M17 1.5 C8.4 1.5 1.5 8.4 1.5 17 c0 11.5 15.5 27 15.5 27 s15.5-15.5 15.5-27 C32.5 8.4 25.6 1.5 17 1.5 z"
            fill="url(#g-${key})" stroke="#ffffff" stroke-width="2.2"/>
      <path d="M17 1.5 C8.4 1.5 1.5 8.4 1.5 17 c0 11.5 15.5 27 15.5 27 s15.5-15.5 15.5-27 C32.5 8.4 25.6 1.5 17 1.5 z"
            fill="url(#hi-${key})"/>
      <circle cx="17" cy="17" r="5.4" fill="#ffffff"/>
      <circle cx="17" cy="17" r="2.6" fill="${color}"/>
    </svg>
    <div style="position:absolute; left:50%; bottom:-2px; transform:translateX(-50%);
                width:${Math.round(14 * size)}px; height:${Math.round(5 * size)}px; border-radius:50%;
                background: radial-gradient(ellipse at center, rgba(0,0,0,0.35), rgba(0,0,0,0));"></div>
  `;
  return L.divIcon({
    className: "civic-pin",
    html: `<div style="position:relative; width:${w}px; height:${h}px;">${svg}</div>`,
    iconSize: [w, h],
    iconAnchor: [Math.round(w / 2), h - 2],
    popupAnchor: [0, -Math.round(h * 0.85)],
    tooltipAnchor: [0, -Math.round(h * 0.85)],
  });
}

export const OSM_TILES = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
