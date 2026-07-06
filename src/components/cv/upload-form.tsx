"use client";

import { useActionState } from "react";
import { uploadCv, type UploadState } from "@/app/candidate/profile/import/actions";
import { Button } from "@/components/ui/button";

export function CvUploadForm() {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadCv, {});

  return (
    <form action={action} className="space-y-4">
      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 p-6 text-center transition-colors hover:border-foreground dark:border-white/25">
        <span className="text-sm font-medium">Choose your CV (PDF, max 5 MB)</span>
        <span className="text-xs text-zinc-500">
          We extract the text on our server, structure it, and show you a preview — nothing is
          saved to your profile until you approve it.
        </span>
        <input type="file" name="cv" accept="application/pdf" required className="text-sm" />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Reading your CV…" : "Upload and parse"}
      </Button>
    </form>
  );
}
