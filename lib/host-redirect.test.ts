import assert from "node:assert/strict";
import { describe, it } from "node:test";
import config from "../next.config.ts";
import { securityHeaders } from "./content-security.ts";

describe("canonical host redirect", () => {
  it("permanently redirects only the exact tarooq.vercel.app host", async () => {
    const redirects = await config.redirects();
    const canonical = redirects.filter((redirect) =>
      redirect.has?.some((condition) => condition.type === "host" && condition.value === "tarooq.vercel.app"),
    );
    assert.equal(canonical.length, 1);
    assert.equal(canonical[0].source, "/:path*");
    assert.equal(canonical[0].destination, "https://alghazzi.org/:path*");
    assert.equal(canonical[0].permanent, true);
    assert.deepEqual(canonical[0].has, [{ type: "host", value: "tarooq.vercel.app" }]);

    const others = redirects.filter((redirect) => redirect !== canonical[0]);
    assert.equal(others.some((redirect) => redirect.has?.some((condition) => condition.type === "host")), false);
    assert.deepEqual(
      others.map((redirect) => ({ source: redirect.source, destination: redirect.destination, permanent: redirect.permanent })),
      [
        { source: "/experience", destination: "/", permanent: false },
        { source: "/expertise", destination: "/business", permanent: false },
        { source: "/posts/2026-10-12-regional-capability", destination: "/posts", permanent: true },
      ],
    );
  });

  it("keeps the security headers on every path", async () => {
    const headers = await config.headers();
    const site = headers.find((entry) => entry.source === "/(.*)");
    assert.ok(site);
    assert.deepEqual(site.headers, securityHeaders());
  });
});
