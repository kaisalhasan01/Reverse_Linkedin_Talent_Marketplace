import { prisma } from "@/lib/db";

/**
 * Messaging helpers shared by the candidate and company apps. Every function
 * takes the acting user's id and enforces participation — never trust the
 * conversation id alone.
 */

export async function listConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: { include: { user: { select: { id: true, name: true, role: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, senderId: true } },
    },
  });

  return conversations.map((c) => {
    const other = c.participants.find((p) => p.userId !== userId)?.user;
    const last = c.messages[0];
    return {
      id: c.id,
      otherName: other?.name ?? "Unknown",
      otherRole: other?.role ?? ("CANDIDATE" as const),
      lastBody: last?.body ?? "",
      lastAt: last?.createdAt ?? c.createdAt,
      lastFromMe: last?.senderId === userId,
    };
  });
}

export async function getConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { userId } } },
    include: {
      participants: { include: { user: { select: { id: true, name: true, role: true } } } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { offer: true, sender: { select: { id: true, name: true } } },
      },
    },
  });
  if (!conversation) return null;

  const other = conversation.participants.find((p) => p.userId !== userId)?.user;
  return { ...conversation, other };
}

/** Reuse the existing 1:1 thread between two users, or start one. */
export async function getOrCreateConversation(userIdA: string, userIdB: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: userIdA } } },
        { participants: { some: { userId: userIdB } } },
      ],
    },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { participants: { create: [{ userId: userIdA }, { userId: userIdB }] } },
  });
}

export async function createMessage(
  conversationId: string,
  senderId: string,
  body: string,
  offer?: { title: string; salaryMin?: number; salaryMax?: number; currency?: string; hoursPerWeek?: number; location?: string },
) {
  // Membership check + updatedAt bump so the thread sorts to the top.
  const member = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: senderId } },
  });
  if (!member) throw new Error("Not a participant of this conversation");

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      body,
      ...(offer ? { offer: { create: offer } } : {}),
    },
  });
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  return message;
}
