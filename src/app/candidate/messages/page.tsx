import { requireCandidate } from "@/lib/session";
import { Inbox } from "@/components/messaging/inbox";

export default async function CandidateMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const user = await requireCandidate();
  const { c } = await searchParams;

  return <Inbox userId={user.id} viewerRole="CANDIDATE" basePath="/candidate/messages" selectedId={c} />;
}
