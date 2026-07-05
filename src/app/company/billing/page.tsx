import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/session";
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

const statusCopy = {
  TRIALING: { tone: "amber" as const, label: "Trial", text: "You're on a free trial with full access." },
  ACTIVE: { tone: "green" as const, label: "Active", text: "Your subscription is active." },
  CANCELED: { tone: "neutral" as const, label: "Canceled", text: "Your subscription has ended." },
};

export default async function BillingPage() {
  const user = await requireCompany();
  const company = await prisma.company.findUniqueOrThrow({ where: { ownerId: user.id } });
  const status = statusCopy[company.subscriptionStatus];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your plan and seats.</p>
      </div>

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
