import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Composer } from "@/components/feed/composer";
import { PostCard, type FeedPost } from "@/components/feed/post-card";

export default async function FeedPage() {
  const user = await requireCandidate();

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { name: true, candidateProfile: { select: { headline: true } } } },
      likes: { select: { userId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  const feed: FeedPost[] = posts.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt,
    author: { name: p.author.name, headline: p.author.candidateProfile?.headline ?? null },
    likeCount: p.likes.length,
    likedByMe: p.likes.some((l) => l.userId === user.id),
    comments: p.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: { name: c.author.name },
    })),
  }));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-6 py-8">
      <Card>
        <Composer />
      </Card>

      {feed.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {feed.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          Nothing here yet — write the first post!
        </p>
      ) : null}
    </div>
  );
}
