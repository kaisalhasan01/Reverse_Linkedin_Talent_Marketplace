import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/session";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { respondToRequest, sendConnectionRequest } from "./actions";

export default async function ConnectionsPage() {
  const user = await requireCandidate();

  const [incoming, mine, candidates, allAccepted] = await Promise.all([
    // Pending requests waiting for my answer
    prisma.connection.findMany({
      where: { addresseeId: user.id, status: "PENDING" },
      include: { requester: { select: { id: true, name: true, candidateProfile: { select: { headline: true } } } } },
    }),
    // All my connections (any direction, any status) — used for both lists below
    prisma.connection.findMany({
      where: { OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
      include: {
        requester: { select: { id: true, name: true, candidateProfile: { select: { headline: true } } } },
        addressee: { select: { id: true, name: true, candidateProfile: { select: { headline: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { role: "CANDIDATE", id: { not: user.id } },
      select: { id: true, name: true, candidateProfile: { select: { headline: true } } },
      orderBy: { createdAt: "desc" },
    }),
    // Whole accepted graph — small enough to intersect in memory for
    // "N mutual connections" (LinkedIn's strongest social proof).
    prisma.connection.findMany({
      where: { status: "ACCEPTED" },
      select: { requesterId: true, addresseeId: true },
    }),
  ]);

  // adjacency: userId -> set of connected userIds
  const neighbors = new Map<string, Set<string>>();
  for (const { requesterId, addresseeId } of allAccepted) {
    (neighbors.get(requesterId) ?? neighbors.set(requesterId, new Set()).get(requesterId)!).add(addresseeId);
    (neighbors.get(addresseeId) ?? neighbors.set(addresseeId, new Set()).get(addresseeId)!).add(requesterId);
  }
  const myNetwork = neighbors.get(user.id) ?? new Set<string>();
  const mutualCount = (otherId: string) => {
    let n = 0;
    for (const id of neighbors.get(otherId) ?? []) if (myNetwork.has(id)) n++;
    return n;
  };

  const accepted = mine
    .filter((c) => c.status === "ACCEPTED")
    .map((c) => (c.requesterId === user.id ? c.addressee : c.requester));

  // Users I already have any relationship with (accepted/pending/declined)
  const related = new Set(mine.flatMap((c) => [c.requesterId, c.addresseeId]));
  const outgoingPending = new Set(
    mine.filter((c) => c.status === "PENDING" && c.requesterId === user.id).map((c) => c.addresseeId),
  );
  const suggestions = candidates.filter((c) => !related.has(c.id) || outgoingPending.has(c.id));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-8">
      {incoming.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Invitations ({incoming.length})
          </h2>
          <div className="space-y-3">
            {incoming.map((c) => (
              <Card key={c.id} className="flex items-center justify-between gap-4">
                <PersonRow name={c.requester.name} headline={c.requester.candidateProfile?.headline} />
                <div className="flex shrink-0 gap-2">
                  <form action={respondToRequest.bind(null, c.id, true)}>
                    <Button type="submit" size="sm">Accept</Button>
                  </form>
                  <form action={respondToRequest.bind(null, c.id, false)}>
                    <Button type="submit" variant="outline" size="sm">Decline</Button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Your connections ({accepted.length})
        </h2>
        {accepted.length > 0 ? (
          <div className="space-y-3">
            {accepted.map((p) => (
              <Card key={p.id} className="flex items-center justify-between gap-4">
                <PersonRow name={p.name} headline={p.candidateProfile?.headline} />
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No connections yet — start with the suggestions below.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          People you may know
        </h2>
        <div className="space-y-3">
          {suggestions.map((p) => (
            <Card key={p.id} className="flex items-center justify-between gap-4">
              <PersonRow
                name={p.name}
                headline={p.candidateProfile?.headline}
                mutual={mutualCount(p.id)}
              />
              {outgoingPending.has(p.id) ? (
                <span className="shrink-0 text-sm text-zinc-400">Requested</span>
              ) : (
                <form action={sendConnectionRequest.bind(null, p.id)}>
                  <Button type="submit" variant="outline" size="sm">Connect</Button>
                </form>
              )}
            </Card>
          ))}
          {suggestions.length === 0 ? (
            <p className="text-sm text-zinc-500">You&apos;re connected with everyone here already!</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function PersonRow({
  name,
  headline,
  mutual,
}: {
  name: string;
  headline?: string | null;
  mutual?: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        {headline ? <p className="truncate text-xs text-zinc-500">{headline}</p> : null}
        {mutual ? (
          <p className="text-xs text-sky-600 dark:text-sky-400">
            {mutual} mutual connection{mutual === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
