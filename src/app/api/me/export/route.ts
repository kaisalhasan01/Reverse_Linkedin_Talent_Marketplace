import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GDPR Art. 15/20: everything we store about the signed-in user, as a JSON
 * download — including a pending CV-import draft and every conversation
 * they take part in (messages both ways, with any job offers). Password
 * hash intentionally excluded.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const [user, profile, company, posts, comments, likes, connections, conversations, cvImportDraft] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      }),
      prisma.candidateProfile.findUnique({
        where: { userId },
        include: {
          experiences: true,
          educations: true,
          projects: true,
          certifications: true,
        },
      }),
      prisma.company.findUnique({ where: { ownerId: userId } }),
      prisma.post.findMany({ where: { authorId: userId } }),
      prisma.comment.findMany({ where: { authorId: userId } }),
      prisma.like.findMany({ where: { userId } }),
      prisma.connection.findMany({
        where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      }),
      prisma.conversation.findMany({
        where: { participants: { some: { userId } } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          participants: { select: { user: { select: { name: true } } } },
          messages: {
            orderBy: { createdAt: "asc" },
            select: {
              createdAt: true,
              body: true,
              sender: { select: { name: true } },
              senderId: true,
              offer: true,
            },
          },
        },
      }),
      prisma.importDraft.findUnique({ where: { userId } }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    format: "reverse-data-export/v2",
    account: user,
    candidateProfile: profile,
    company,
    posts,
    comments,
    likes,
    connections,
    conversations: conversations.map((c) => ({
      id: c.id,
      startedAt: c.createdAt,
      participants: c.participants.map((p) => p.user.name),
      messages: c.messages.map(({ senderId, sender, ...m }) => ({
        ...m,
        from: sender.name,
        sentByMe: senderId === userId,
      })),
    })),
    cvImportDraft,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="reverse-data-export.json"',
      "Cache-Control": "no-store",
    },
  });
}
