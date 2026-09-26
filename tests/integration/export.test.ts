import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ user: null as { id: string } | null }));
vi.mock("@/lib/auth", () => ({ auth: async () => (session.user ? { user: session.user } : null) }));

import { prisma } from "@/lib/db";
import { GET } from "@/app/api/me/export/route";

let annaId = "";
beforeAll(async () => {
  annaId = (await prisma.user.findUniqueOrThrow({ where: { email: "anna@demo.se" } })).id;
});
afterAll(() => prisma.$disconnect());

describe("GDPR data export", () => {
  it("requires a session", async () => {
    session.user = null;
    expect((await GET()).status).toBe(401);
  });

  it("contains received messages and offers, the CV draft — and never the password hash", async () => {
    session.user = { id: annaId };
    await prisma.importDraft.create({
      data: { userId: annaId, payload: { engine: "heuristic", cv: { headline: "Draft headline" } } },
    });
    try {
      const res = await GET();
      expect(res.headers.get("Content-Disposition")).toContain("attachment");
      const text = await res.text();
      const data = JSON.parse(text);

      expect(data.format).toBe("reverse-data-export/v2");
      expect(data.account.email).toBe("anna@demo.se");
      expect(text).not.toMatch(/passwordHash|\$2[aby]\$/); // no hash, in any shape

      const messages = data.conversations.flatMap((c: { messages: unknown[] }) => c.messages);
      const offer = messages.find((m: { offer: unknown }) => m.offer);
      expect(offer).toMatchObject({ from: "Acme Talent Team", sentByMe: false, offer: { title: expect.stringContaining("Fullstack") } });
      expect(messages).toContainEqual(expect.objectContaining({ from: "Erik Johansson", sentByMe: false }));
      expect(messages).toContainEqual(expect.objectContaining({ from: "Anna Lindqvist", sentByMe: true }));

      expect(data.cvImportDraft.payload.cv.headline).toBe("Draft headline");
    } finally {
      await prisma.importDraft.deleteMany({ where: { userId: annaId } });
    }
  });
});
