/** Single source of truth for report status options in the admin UI */
export const REPORT_STATUSES = [
  "Reported",
  "Pending Review",
  "Rejected",
  "Assigned",
  "In-Progress",
  "Resolved",
  "Verified",
] as const;

export type ReportStatusLabel = (typeof REPORT_STATUSES)[number];
