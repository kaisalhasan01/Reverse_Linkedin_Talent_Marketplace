import { requireCandidate } from "@/lib/session";
import { AccountSettings } from "@/components/settings/account-settings";

export default async function CandidateSettingsPage() {
  const user = await requireCandidate();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Settings</h1>
      <AccountSettings email={user.email ?? ""} />
    </div>
  );
}
