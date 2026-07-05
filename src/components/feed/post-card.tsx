import { toggleLike } from "@/app/candidate/feed/actions";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { CommentForm } from "@/components/feed/comment-form";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export type FeedPost = {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string; headline: string | null };
  likeCount: number;
  likedByMe: boolean;
  comments: { id: string; content: string; createdAt: Date; author: { name: string } }[];
};

export function PostCard({ post }: { post: FeedPost }) {
  const like = toggleLike.bind(null, post.id);

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <Avatar name={post.author.name} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{post.author.name}</p>
          {post.author.headline ? (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{post.author.headline}</p>
          ) : null}
          <p className="text-xs text-zinc-400">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>

      <div className="flex items-center gap-4 border-t border-black/5 pt-3 dark:border-white/10">
        <form action={like}>
          <button
            type="submit"
            className={cn(
              "text-sm transition-colors",
              post.likedByMe ? "font-semibold text-sky-600 dark:text-sky-400" : "text-zinc-500 hover:text-foreground",
            )}
          >
            ▲ {post.likeCount > 0 ? post.likeCount : ""} Like{post.likedByMe ? "d" : ""}
          </button>
        </form>
        <span className="text-sm text-zinc-400">
          {post.comments.length} comment{post.comments.length === 1 ? "" : "s"}
        </span>
      </div>

      {post.comments.length > 0 ? (
        <ul className="space-y-3">
          {post.comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <Avatar name={c.author.name} size="sm" />
              <div className="min-w-0 rounded-xl bg-black/5 px-3 py-2 dark:bg-white/5">
                <p className="text-xs font-semibold">{c.author.name}</p>
                <p className="text-sm">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <CommentForm postId={post.id} />
    </Card>
  );
}
