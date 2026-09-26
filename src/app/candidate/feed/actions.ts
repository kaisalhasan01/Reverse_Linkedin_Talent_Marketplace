"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/session";

// The feed is the candidates' social layer — company accounts can't post,
// like or comment, even by calling these actions directly.

export async function createPost(formData: FormData) {
  const user = await requireCandidate();
  const parsed = z.string().trim().min(1).max(2000).safeParse(formData.get("content"));
  if (!parsed.success) return;

  await prisma.post.create({ data: { authorId: user.id, content: parsed.data } });
  revalidatePath("/candidate/feed");
}

async function postExists(postId: string) {
  return !!(await prisma.post.findUnique({ where: { id: postId }, select: { id: true } }));
}

export async function toggleLike(postId: string) {
  const user = await requireCandidate();
  if (!(await postExists(postId))) return;

  // Unlike if liked, else like — race-safe for double clicks (no unique-key error).
  const removed = await prisma.like.deleteMany({ where: { userId: user.id, postId } });
  if (removed.count === 0) {
    await prisma.like.createMany({ data: [{ userId: user.id, postId }], skipDuplicates: true });
  }
  revalidatePath("/candidate/feed");
}

export async function addComment(postId: string, formData: FormData) {
  const user = await requireCandidate();
  const parsed = z.string().trim().min(1).max(1000).safeParse(formData.get("content"));
  if (!parsed.success || !(await postExists(postId))) return;

  await prisma.comment.create({ data: { postId, authorId: user.id, content: parsed.data } });
  revalidatePath("/candidate/feed");
}
