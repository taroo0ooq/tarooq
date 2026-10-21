import { openToken, personUrn, sealToken } from "./linkedin";
import { connectionView, type ConnectionView } from "./post-view";
import type { PostsDb } from "./post-types";
import { postsDbFromEnv } from "./supabase-posts";

export async function storeOwnerLinkedInToken(input: {
  accessToken: string;
  expiresAt: string;
  personId: string;
  name: string;
  email: string;
}) {
  const db = postsDbFromEnv();
  if (!db) throw new Error("Supabase is not configured.");
  await db.saveConnection({
    access_token: sealToken(input.accessToken),
    expires_at: input.expiresAt,
    person_id: input.personId,
    person_urn: personUrn(input.personId),
    name: input.name,
    email: input.email,
  });
}

export async function readConnection(db: PostsDb, now = new Date()): Promise<ConnectionView> {
  const row = await db.getConnection();
  return connectionView(row, Boolean(row && openToken(row.access_token)), now);
}
