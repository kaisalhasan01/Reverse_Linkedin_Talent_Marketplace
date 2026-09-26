import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OfferCard } from "@/components/messaging/offer-card";
import { ReplyForm } from "@/components/messaging/reply-form";
import { getConversation, listConversations } from "@/lib/messaging";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Two-pane inbox shared by both apps. The list pane links to
 * `${basePath}?c=<id>`; the thread pane renders the selected conversation.
 * Access control happens in the data layer (participant checks).
 */
export async function Inbox({
  userId,
  viewerRole,
  basePath,
  selectedId,
}: {
  userId: string;
  viewerRole: "CANDIDATE" | "COMPANY";
  basePath: string;
  selectedId?: string;
}) {
  const conversations = await listConversations(userId);
  const activeId = selectedId ?? conversations[0]?.id;
  const active = activeId ? await getConversation(activeId, userId) : null;

  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-4 px-6 py-8 md:grid-cols-[280px_1fr]">
      {/* Conversation list */}
      <aside className="space-y-1">
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-zinc-500">Messages</h2>
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`${basePath}?c=${c.id}`}
            className={cn(
              "flex items-center gap-3 rounded-xl p-3 transition-colors",
              c.id === activeId ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/5",
            )}
          >
            <Avatar name={c.otherName} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{c.otherName}</span>
                <span className="shrink-0 text-[10px] text-zinc-400">{timeAgo(c.lastAt)}</span>
              </span>
              <span className="block truncate text-xs text-zinc-500">
                {c.lastFromMe ? "You: " : ""}
                {c.lastBody}
              </span>
            </span>
          </Link>
        ))}
        {conversations.length === 0 ? (
          <p className="px-1 text-sm text-zinc-500">No conversations yet.</p>
        ) : null}
      </aside>

      {/* Active thread */}
      <section className="flex min-h-[60vh] flex-col rounded-2xl border border-black/10 dark:border-white/10">
        {active ? (
          <>
            <header className="flex items-center gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
              <Avatar name={active.other?.name ?? "?"} size="sm" />
              <span className="text-sm font-semibold">{active.other?.name}</span>
              {active.other?.role === "COMPANY" ? <Badge tone="blue">Company</Badge> : null}
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {active.messages.map((m) => {
                const mine = m.senderId === userId;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5",
                        mine ? "bg-foreground text-background" : "bg-black/5 dark:bg-white/10",
                      )}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                      {m.offer ? <OfferCard offer={m.offer} canRespond={!mine && viewerRole === "CANDIDATE"} /> : null}
                      <p className={cn("mt-1 text-[10px]", mine ? "text-background/60" : "text-zinc-400")}>
                        {timeAgo(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="border-t border-black/10 p-3 dark:border-white/10">
              <ReplyForm conversationId={active.id} />
            </footer>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-400">
            Select a conversation to read it here.
          </div>
        )}
      </section>
    </div>
  );
}
