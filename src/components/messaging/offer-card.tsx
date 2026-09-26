import type { JobOffer } from "@prisma/client";
import { respondToOffer } from "@/components/messaging/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSalaryRange } from "@/lib/format";

const statusBadge = {
  PENDING: { tone: "amber" as const, label: "Awaiting reply" },
  ACCEPTED: { tone: "green" as const, label: "Accepted" },
  DECLINED: { tone: "neutral" as const, label: "Declined" },
};

/**
 * Structured job offer rendered inside a message bubble (opaque, so it stays
 * legible inside the sender's inverted bubble too). The candidate who
 * received it (`canRespond`) gets Accept/Decline; everyone sees the status.
 */
export function OfferCard({ offer, canRespond = false }: { offer: JobOffer; canRespond?: boolean }) {
  const salary = formatSalaryRange(offer.salaryMin, offer.salaryMax, offer.currency);
  const status = statusBadge[offer.status];
  const answerable = canRespond && offer.status === "PENDING";

  return (
    <div className="mt-2 rounded-xl border border-emerald-300/60 bg-emerald-50 p-3 text-foreground dark:border-emerald-500/30 dark:bg-emerald-950">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="green" className="bg-white">Job offer</Badge>
        <span className="text-sm font-semibold">{offer.title}</span>
        {answerable ? null : (
          <Badge tone={status.tone} className="ml-auto">
            {status.label}
          </Badge>
        )}
      </div>
      <dl className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
        {salary ? <Row label="Salary" value={salary} /> : null}
        {offer.hoursPerWeek ? <Row label="Hours" value={`${offer.hoursPerWeek} h/week`} /> : null}
        {offer.location ? <Row label="Location" value={offer.location} /> : null}
      </dl>
      {answerable ? (
        <div className="mt-3 flex gap-2">
          <form action={respondToOffer.bind(null, offer.id, true)}>
            <Button type="submit" size="sm">Accept offer</Button>
          </form>
          <form action={respondToOffer.bind(null, offer.id, false)}>
            <Button type="submit" size="sm" variant="outline">Decline</Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 font-medium">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
