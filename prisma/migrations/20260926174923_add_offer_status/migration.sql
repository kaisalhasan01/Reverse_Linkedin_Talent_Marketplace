-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "JobOffer" ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "status" "OfferStatus" NOT NULL DEFAULT 'PENDING';
