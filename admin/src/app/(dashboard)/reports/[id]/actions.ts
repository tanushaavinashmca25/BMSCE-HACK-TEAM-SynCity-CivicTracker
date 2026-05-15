"use server";

import { revalidatePath } from "next/cache";
import { adminApi } from "@/lib/api";

export async function postUpdate(reportId: string, formData: FormData): Promise<void> {
  const note = String(formData.get("note") || "").trim();
  const status_to = String(formData.get("status_to") || "").trim();

  if (!note && !status_to) return;
  try {
    await adminApi.addUpdate(reportId, {
      note: note || undefined,
      status_to: status_to || undefined,
    });
  } catch (e) {
    console.error("postUpdate failed", e);
  }
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/");
}
