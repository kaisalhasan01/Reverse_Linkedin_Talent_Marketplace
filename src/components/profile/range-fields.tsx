"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/input";

/**
 * Start/end inputs where the end can't precede the start. The browser's own
 * validation (min=start) explains the problem right at the field before
 * anything is sent — the server action enforces the same rule regardless.
 */
export function DateRangeFields() {
  const [start, setStart] = useState("");
  return (
    <>
      <Field label="Start date">
        <Input name="startDate" type="date" required onChange={(e) => setStart(e.target.value)} />
      </Field>
      <Field label="End date" hint="Leave empty if current.">
        <Input name="endDate" type="date" min={start || undefined} />
      </Field>
    </>
  );
}

export function YearRangeFields() {
  const [start, setStart] = useState("");
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Start year">
        <Input
          name="startYear"
          type="number"
          required
          min={1950}
          max={2100}
          onChange={(e) => setStart(e.target.value)}
        />
      </Field>
      <Field label="End year">
        <Input name="endYear" type="number" min={start || 1950} max={2100} />
      </Field>
    </div>
  );
}
