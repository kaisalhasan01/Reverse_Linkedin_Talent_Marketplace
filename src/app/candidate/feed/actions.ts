"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function createPost(formData: FormData) {
  const user = await requireUser();
  const parsed = z.string().trim().min(1).max(2000).safeParse(formData.get("content"));
  if (!parsed.success) return;

  await prisma.post.create({ data: { authorId: user.id, content: parsed.data } });
  revalidatePath("/candidate/feed");
}

export async function toggleLike(postId: string) {
  const user = await requireUser();
  const key = { userId_postId: { userId: user.id, postId } };

  const existing = await prisma.like.findUnique({ where: key });
  if (existing) {
    await prisma.like.delete({ where: key });
  } else {
    await prisma.like.create({ data: { userId: user.id, postId } });
  }
  revalidatePath("/candidate/feed");
}

export async function addComment(postId: string, formData: FormData) {
  const user = await requireUser();
  const parsed = z.string().trim().min(1).max(1000).safeParse(formData.get("content"));
  if (!parsed.success) return;

  await prisma.comment.create({ data: { postId, authorId: user.id, content: parsed.data } });
  revalidatePath("/candidate/feed");
}
