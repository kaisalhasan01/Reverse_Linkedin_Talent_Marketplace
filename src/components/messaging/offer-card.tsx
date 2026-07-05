import type { JobOffer } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { formatSalaryRange } from "@/lib/format";

/** Structured job offer rendered inside a message bubble. */
export function OfferCard({ offer }: { offer: JobOffer }) {
  const salary = formatSalaryRange(offer.salaryMin, offer.salaryMax, offer.currency);

  return (
    <div className="mt-2 rounded-xl border border-emerald-300/60 bg-emerald-50/60 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
      <div className="flex items-center gap-2">
        <Badge tone="green">Job offer</Badge>
        <span className="text-sm font-semibold">{offer.title}</span>
      </div>
      <dl className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
        {salary ? <Row label="Salary" value={salary} /> : null}
        {offer.hoursPerWeek ? <Row label="Hours" value={`${offer.hoursPerWeek} h/week`} /> : null}
        {offer.location ? <Row label="Location" value={offer.location} /> : null}
      </dl>
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
