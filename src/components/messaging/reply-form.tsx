"use client";

import { useRef, useTransition } from "react";
import { sendMessageAction } from "@/components/messaging/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function ReplyForm({ conversationId }: { conversationId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await sendMessageAction(conversationId, formData);
          formRef.current?.reset();
        });
      }}
      className="flex items-end gap-2"
    >
      <Textarea
        name="body"
        required
        maxLength={4000}
        placeholder="Write a message…"
        className="min-h-12 flex-1"
        rows={2}
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
