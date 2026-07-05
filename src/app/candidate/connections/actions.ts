"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/session";

const PATH = "/candidate/connections";

export async function sendConnectionRequest(addresseeId: string) {
  const user = await requireCandidate();
  if (addresseeId === user.id) return;

  // No duplicates in either direction.
  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId },
        { requesterId: addresseeId, addresseeId: user.id },
      ],
    },
  });
  if (existing) return;

  await prisma.connection.create({ data: { requesterId: user.id, addresseeId } });
  revalidatePath(PATH);
}

export async function respondToRequest(connectionId: string, accept: boolean) {
  const user = await requireCandidate();

  // Only the addressee of a pending request may respond — enforced in the query.
  await prisma.connection.updateMany({
    where: { id: connectionId, addresseeId: user.id, status: "PENDING" },
    data: { status: accept ? "ACCEPTED" : "DECLINED" },
  });
  revalidatePath(PATH);
}
