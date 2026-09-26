"use client";

import { useRef, useTransition } from "react";
import { createPost } from "@/app/candidate/feed/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function Composer() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await createPost(formData);
          formRef.current?.reset();
        });
      }}
      className="space-y-3"
    >
      <Textarea
        name="content"
        required
        maxLength={2000}
        placeholder="Share an update with your network…"
        className="min-h-20"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
