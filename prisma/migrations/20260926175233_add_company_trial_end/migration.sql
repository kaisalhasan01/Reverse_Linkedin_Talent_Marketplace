-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- Existing trials get the standard 14 days from sign-up (no trial is open-ended).
UPDATE "Company" SET "trialEndsAt" = "createdAt" + INTERVAL '14 days'
WHERE "subscriptionStatus" = 'TRIALING' AND "trialEndsAt" IS NULL;
