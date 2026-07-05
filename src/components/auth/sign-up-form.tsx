"use client";

import { useActionState, useState } from "react";
import { register, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const roleOptions = [
  {
    value: "CANDIDATE",
    title: "I'm looking for work",
    description: "Build a profile and get discovered. Always free.",
  },
  {
    value: "COMPANY",
    title: "I'm hiring",
    description: "Search the talent database and reach out directly.",
  },
] as const;

export function SignUpForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(register, {});
  const [role, setRole] = useState<"CANDIDATE" | "COMPANY">("CANDIDATE");

  return (
    <form action={action} className="space-y-5">
      {/* Account type — the core dual-role choice */}
      <div className="grid gap-3 sm:grid-cols-2">
        {roleOptions.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "cursor-pointer rounded-2xl border p-4 transition-colors",
              role === opt.value
                ? "border-foreground"
                : "border-black/10 hover:border-black/30 dark:border-white/15 dark:hover:border-white/40",
            )}
          >
            <input
              type="radio"
              name="role"
              value={opt.value}
              checked={role === opt.value}
              onChange={() => setRole(opt.value)}
              className="sr-only"
            />
            <span className="block text-sm font-semibold">{opt.title}</span>
            <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{opt.description}</span>
          </label>
        ))}
      </div>

      <Field label={role === "COMPANY" ? "Your name" : "Full name"} htmlFor="name">
        <Input id="name" name="name" autoComplete="name" required placeholder="Anna Lindqvist" />
      </Field>

      {role === "COMPANY" ? (
        <Field label="Company name" htmlFor="companyName">
          <Input id="companyName" name="companyName" required placeholder="Acme Technologies AB" />
        </Field>
      ) : null}

      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : role === "COMPANY" ? "Create company account" : "Create free account"}
      </Button>

      <p className="text-center text-xs text-zinc-500">
        By creating an account you agree to how we handle your data — see the{" "}
        <a href="/privacy" target="_blank" className="underline">
          Privacy Policy
        </a>
        . Export or delete everything, any time, from Settings.
      </p>
    </form>
  );
}
