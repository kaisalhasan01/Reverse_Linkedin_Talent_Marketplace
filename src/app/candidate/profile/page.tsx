import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ProfileDisplay, fullProfileInclude } from "@/components/profile/profile-display";
import {
  addCertification,
  addEducation,
  addExperience,
  addProject,
  deleteCertification,
  deleteEducation,
  deleteExperience,
  deleteProject,
  toggleStatus,
  updateBasics,
} from "./actions";

const deleteActions = {
  experience: deleteExperience,
  education: deleteEducation,
  project: deleteProject,
  certification: deleteCertification,
} as const;

export default async function ProfilePage() {
  const user = await requireCandidate();
  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: fullProfileInclude,
  });
  const looking = profile.status === "LOOKING";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <ProfileDisplay
        profile={profile}
        headerExtra={
          <div className="flex flex-col items-end gap-2">
            <form action={toggleStatus}>
              <Button type="submit" variant="outline" size="sm">
                {looking ? "Switch to Employed" : "Switch to Looking for work"}
              </Button>
            </form>
            <p className="max-w-48 text-right text-xs text-zinc-400">
              {looking
                ? "Companies can find and message you."
                : "You are hidden from company search."}
            </p>
          </div>
        }
        itemAction={(kind, id) => (
          <form action={deleteActions[kind].bind(null, id)}>
            <Button type="submit" variant="danger" size="sm">
              Remove
            </Button>
          </form>
        )}
        sectionExtras={{
          experience: (
            <AddForm summary="Add experience" action={addExperience}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title"><Input name="title" required placeholder="Fullstack Developer" /></Field>
                <Field label="Company"><Input name="company" required placeholder="Acme AB" /></Field>
                <Field label="Start date"><Input name="startDate" type="date" required /></Field>
                <Field label="End date" hint="Leave empty if current."><Input name="endDate" type="date" /></Field>
              </div>
              <Field label="Description"><Textarea name="description" maxLength={1000} /></Field>
            </AddForm>
          ),
          education: (
            <AddForm summary="Add education" action={addEducation}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="School"><Input name="school" required placeholder="Linköping University" /></Field>
                <Field label="Degree"><Input name="degree" required placeholder="MSc" /></Field>
                <Field label="Field of study"><Input name="field" required placeholder="Mechanical Engineering" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start year"><Input name="startYear" type="number" required min={1950} max={2100} /></Field>
                  <Field label="End year"><Input name="endYear" type="number" min={1950} max={2100} /></Field>
                </div>
              </div>
            </AddForm>
          ),
          project: (
            <AddForm summary="Add project" action={addProject}>
              <Field label="Name"><Input name="name" required /></Field>
              <Field label="URL" hint="Optional — GitHub, demo, article…"><Input name="url" type="url" placeholder="https://…" /></Field>
              <Field label="Description"><Textarea name="description" maxLength={1000} /></Field>
            </AddForm>
          ),
          certification: (
            <AddForm summary="Add certification" action={addCertification}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Name"><Input name="name" required /></Field>
                <Field label="Issuer"><Input name="issuer" required /></Field>
                <Field label="Year"><Input name="year" type="number" required min={1950} max={2100} /></Field>
              </div>
            </AddForm>
          ),
        }}
      />

      {/* Edit basics */}
      <details className="group mt-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <summary className="cursor-pointer text-sm font-semibold">Edit basics</summary>
        <form action={updateBasics} className="mt-4 space-y-4">
          <Field label="Headline" hint="One line that sells you — shown everywhere.">
            <Input name="headline" defaultValue={profile.headline} maxLength={120} />
          </Field>
          <Field label="Location">
            <Input name="location" defaultValue={profile.location} maxLength={80} />
          </Field>
          <Field label="Skills" hint="Comma-separated, e.g. React, TypeScript, PostgreSQL">
            <Input name="skills" defaultValue={profile.skills.join(", ")} maxLength={500} />
          </Field>
          <Field label="About">
            <Textarea name="bio" defaultValue={profile.bio} maxLength={2000} />
          </Field>
          <Button type="submit" size="sm">Save</Button>
        </form>
      </details>
    </div>
  );
}

/** Collapsible add-form wrapper used by each profile section. */
function AddForm({
  summary,
  action,
  children,
}: {
  summary: string;
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <details>
      <summary className="cursor-pointer text-sm font-medium text-sky-600 dark:text-sky-400">
        + {summary}
      </summary>
      <form action={action} className="mt-4 space-y-3">
        {children}
        <Button type="submit" size="sm">Add</Button>
      </form>
    </details>
  );
}
