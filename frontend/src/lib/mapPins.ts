/** Pin colors aligned with admin dashboard map */
export const STATUS_PIN: Record<string, string> = {
  Reported: '#0B2D6B',
  'Pending Review': '#B45309',
  Assigned: '#0369A1',
  'In-Progress': '#0369A1',
  Resolved: '#047857',
  Verified: '#047857',
  Rejected: '#B91C1C',
};

export const FALLBACK_PIN = '#64748b';

export function pinColor(status: string) {
  return STATUS_PIN[status] || FALLBACK_PIN;
}
