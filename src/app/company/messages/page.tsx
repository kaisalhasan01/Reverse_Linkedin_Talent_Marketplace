import { requireCompany } from "@/lib/session";
import { Inbox } from "@/components/messaging/inbox";

export default async function CompanyMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const user = await requireCompany();
  const { c } = await searchParams;

  return <Inbox userId={user.id} viewerRole="COMPANY" basePath="/company/messages" selectedId={c} />;
}
