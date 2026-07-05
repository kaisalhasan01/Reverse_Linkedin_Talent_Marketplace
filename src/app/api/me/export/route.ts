import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GDPR Art. 20 data portability: everything we store about the signed-in
 * user, as a JSON download. Password hash intentionally excluded.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const [user, profile, company, posts, comments, likes, connections, messagesSent] =
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
      prisma.message.findMany({ where: { senderId: userId }, include: { offer: true } }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    format: "reverse-data-export/v1",
    account: user,
    candidateProfile: profile,
    company,
    posts,
    comments,
    likes,
    connections,
    messagesSent,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="reverse-data-export.json"',
    },
  });
}
