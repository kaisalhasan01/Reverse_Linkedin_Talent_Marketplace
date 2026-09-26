import { LOCKED_REASON } from "@/lib/billing";
import { currentCompany } from "@/lib/paid-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "1 990 kr",
    unit: "/seat · month",
    features: ["Full candidate search", "10 outreach messages/month", "1 seat"],
  },
  {
    name: "Growth",
    price: "4 990 kr",
    unit: "/seat · month",
    features: ["Everything in Starter", "Unlimited outreach", "5 seats", "Priority support"],
    highlighted: true,
  },
  {
    name: "Per hire",
    price: "15 %",
    unit: "of first-year salary",
    features: ["Pay only on signed contract", "Unlimited search & outreach", "Success-based"],
  },
];

const longDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ locked?: string }>;
}) {
  const { company, access } = await currentCompany();
  const { locked } = await searchParams;

  const status = access.allowed
    ? access.trialDaysLeft === null
      ? { tone: "green" as const, label: "Active", text: "Your subscription is active." }
      : {
          tone: "amber" as const,
          label: "Trial",
          text: `Free trial with full access — ${access.trialDaysLeft} day${access.trialDaysLeft === 1 ? "" : "s"} left (ends ${longDate(company.trialEndsAt!)}).`,
        }
    : {
        tone: "neutral" as const,
        label: access.reason === "canceled" ? "Canceled" : "Trial ended",
        text:
          access.reason === "trial_ended" && company.trialEndsAt
            ? `Your free trial ended on ${longDate(company.trialEndsAt)}. Search and outreach are paused.`
            : "Search and outreach are paused.",
      };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your plan and seats.</p>
      </div>

      {locked && !access.allowed ? (
        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <span className="font-semibold">{LOCKED_REASON[access.reason]}.</span> Candidate search, profiles
          and new outreach need an active plan. Your existing conversations stay open.
        </div>
      ) : null}

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{company.name}</span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{status.text}</p>
        </div>
        <p className="text-sm text-zinc-500">
          Seats: <span className="font-semibold text-foreground">{company.seats}</span>
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn("flex flex-col", plan.highlighted && "border-foreground")}
          >
            <h2 className="text-sm font-semibold">{plan.name}</h2>
            <p className="mt-2">
              <span className="text-2xl font-semibold tracking-tight">{plan.price}</span>
              <span className="text-xs text-zinc-500"> {plan.unit}</span>
            </p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-300">
              {plan.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <Button
              variant={plan.highlighted ? "primary" : "outline"}
              className="mt-5 w-full"
              disabled
              title="Stripe checkout ships in a later phase"
            >
              Choose {plan.name}
            </Button>
          </Card>
        ))}
      </div>

      <p className="text-xs text-zinc-400">
        Checkout is wired up in a later phase via Stripe subscriptions — the plan and seat
        state above already lives on the Company record so the integration drops straight in.
      </p>
    </div>
  );
}
