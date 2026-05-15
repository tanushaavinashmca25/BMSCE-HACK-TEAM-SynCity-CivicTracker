/* eslint-disable @typescript-eslint/no-explicit-any */

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;

declare global {
  interface Window {
    L?: any;
    __leafletLoading?: Promise<void>;
  }
}

export function loadLeaflet(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.L) return Promise.resolve();
  if (window.__leafletLoading) return window.__leafletLoading;

  window.__leafletLoading = new Promise<void>((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet="1"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.dataset.leaflet = '1';
      document.head.appendChild(link);
    }
    const s = document.createElement('script');
    s.src = LEAFLET_JS;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load map'));
    document.head.appendChild(s);
  });
  return window.__leafletLoading;
}

export function pinIcon(L: any, color: string, key: string) {
  const w = 34;
  const h = 46;
  const svg = `
    <svg width="${w}" height="${h}" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1.5 C8.4 1.5 1.5 8.4 1.5 17 c0 11.5 15.5 27 15.5 27 s15.5-15.5 15.5-27 C32.5 8.4 25.6 1.5 17 1.5 z"
            fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="17" cy="17" r="5" fill="#ffffff"/>
    </svg>`;
  return L.divIcon({
    className: 'civic-pin',
    html: svg,
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 2],
    popupAnchor: [0, -h * 0.85],
  });
}

export const OSM_TILES = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
};

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
