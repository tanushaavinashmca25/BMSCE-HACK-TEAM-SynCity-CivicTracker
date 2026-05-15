"use client";

import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";

type Props = {
  id?: string;
  name?: string;
  label?: string;
};

/** Admin status dropdown — includes Rejected for invalid / duplicate reports */
export function StatusSelect({
  id = "status_to",
  name = "status_to",
  label = "Change status (optional)",
}: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} name={name} defaultValue="">
        <option value="">— No change —</option>
        <option value="Reported">Reported</option>
        <option value="Pending Review">Pending Review</option>
        <option value="Rejected">Rejected</option>
        <option value="Assigned">Assigned</option>
        <option value="In-Progress">In-Progress</option>
        <option value="Resolved">Resolved</option>
        <option value="Verified">Verified</option>
      </NativeSelect>
    </div>
  );
}
