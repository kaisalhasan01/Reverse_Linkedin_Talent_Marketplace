"use client";

import { useRef, useTransition } from "react";
import { addComment } from "@/app/candidate/feed/actions";
import { Input } from "@/components/ui/input";

export function CommentForm({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await addComment(postId, formData);
          formRef.current?.reset();
        });
      }}
    >
      <Input
        name="content"
        required
        maxLength={1000}
        disabled={pending}
        placeholder="Write a comment…"
        className="h-9 text-sm"
      />
    </form>
  );
}
