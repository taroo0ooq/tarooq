import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSupabasePostsDb } from "./supabase-posts.ts";

describe("supabase posts client", () => {
  it("sends the secret key and stores the LinkedIn token through a private RPC", async () => {
    const calls: { url: string; method: string; authorization: string; body: unknown }[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      const authorization = new Headers(init?.headers).get("authorization") ?? "";
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
      calls.push({ url, method, authorization, body });
      if (url.endsWith("/rest/v1/posts?select=id&limit=1")) return Response.json([{ id: "1" }]);
      if (url.includes("/rpc/claim_linkedin_publish")) return Response.json({ claimed: true, state: "posting", urn: "", url: "" });
      if (url.includes("/rpc/linkedin_connection")) return Response.json([]);
      if (url.includes("/rpc/save_linkedin_connection")) return new Response(null, { status: 204 });
      return Response.json([]);
    };
    const db = createSupabasePostsDb({ url: "https://example.supabase.co", key: "sb_secret_test", fetchImpl });
    assert.equal(await db.hasAny(), true);
    const claim = await db.claimLinkedIn("post-id");
    assert.equal(claim.claimed, true);
    await db.saveConnection({
      access_token: "sealed",
      expires_at: "2026-12-01T00:00:00.000Z",
      person_id: "owner",
      person_urn: "urn:li:person:owner",
      name: "Tareq",
      email: "",
    });
    assert.equal(await db.getConnection(), null);
    assert.equal(calls.every((call) => call.authorization === "Bearer sb_secret_test"), true);
    const save = calls.find((call) => call.url.includes("save_linkedin_connection"));
    assert.equal((save?.body as { p_access_token?: string }).p_access_token, "sealed");
    assert.equal(calls.some((call) => call.url.includes("/rest/v1/rpc/")), true);
  });

  it("rejects a publishable key", () => {
    assert.throws(() => createSupabasePostsDb({ url: "https://example.supabase.co", key: "sb_publishable_test", fetchImpl: fetch }), /server secret key/);
  });
});
