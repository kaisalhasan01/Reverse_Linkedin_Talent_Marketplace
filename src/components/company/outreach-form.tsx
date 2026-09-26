"use client";

import { useActionState } from "react";
import type { OutreachState } from "@/app/company/candidates/[id]/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";

/**
 * Outreach message + optional structured offer. Validation errors come back
 * from the server action with the submitted values, so nothing is lost.
 */
export function OutreachForm({
  action,
}: {
  action: (prev: OutreachState, formData: FormData) => Promise<OutreachState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const v = state.values ?? {};

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Message">
        <Textarea
          name="body"
          required
          maxLength={4000}
          defaultValue={v.body}
          placeholder="Hi! Your profile caught our eye because…"
        />
      </Field>

      <details className="rounded-lg border border-dashed border-black/15 p-3 dark:border-white/15" open>
        <summary className="cursor-pointer text-sm font-medium">Attach job offer (optional)</summary>
        <div className="mt-3 space-y-3">
          <Field label="Role title">
            <Input name="offerTitle" maxLength={120} defaultValue={v.offerTitle} placeholder="Senior Fullstack Engineer" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Salary min (SEK/mo)">
              <Input name="salaryMin" type="number" min={0} defaultValue={v.salaryMin} placeholder="55000" />
            </Field>
            <Field label="Salary max (SEK/mo)">
              <Input name="salaryMax" type="number" min={0} defaultValue={v.salaryMax} placeholder="70000" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hours/week">
              <Input name="hoursPerWeek" type="number" min={1} max={80} defaultValue={v.hoursPerWeek} placeholder="40" />
            </Field>
            <Field label="Location">
              <Input name="offerLocation" maxLength={120} defaultValue={v.offerLocation} placeholder="Stockholm (hybrid)" />
            </Field>
          </div>
        </div>
      </details>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
