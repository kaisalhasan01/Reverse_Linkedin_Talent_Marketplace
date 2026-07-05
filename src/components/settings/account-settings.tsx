"use client";

import { useActionState } from "react";
import { deleteAccount, type DeleteState } from "@/components/settings/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

/** Shared by candidate and company settings pages. */
export function AccountSettings({ email }: { email: string }) {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, {});

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Export your data</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Download everything Reverse stores about you as JSON (GDPR Art. 20).
          </p>
        </div>
        <a href="/api/me/export" download>
          <Button variant="outline" size="sm">Download my data</Button>
        </a>
      </Card>

      <Card className="space-y-3 border-red-200 dark:border-red-500/30">
        <div>
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Delete account</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Permanently removes your account and everything connected to it — profile, posts,
            connections, messages (GDPR Art. 17). This cannot be undone.
          </p>
        </div>
        <form action={action} className="space-y-3">
          <Field label={`Type ${email} to confirm`} htmlFor="confirm">
            <Input id="confirm" name="confirm" autoComplete="off" placeholder={email} required />
          </Field>
          {state.error ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          ) : null}
          <Button type="submit" variant="danger" size="sm" disabled={pending}>
            {pending ? "Deleting…" : "Delete my account permanently"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
