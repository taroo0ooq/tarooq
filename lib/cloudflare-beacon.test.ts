import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { cloudflareBeaconAttribute, cloudflareBeaconScript, cloudflareBeaconToken } from "./cloudflare-beacon.ts";

const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
const vercelEnv = process.env.VERCEL_ENV;

afterEach(() => {
  if (token === undefined) delete process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  else process.env.NEXT_PUBLIC_CF_BEACON_TOKEN = token;
  if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = vercelEnv;
});

describe("cloudflare beacon", () => {
  it("stays off unless production has a token", () => {
    delete process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
    delete process.env.VERCEL_ENV;
    assert.equal(cloudflareBeaconToken(), "");

    process.env.NEXT_PUBLIC_CF_BEACON_TOKEN = "preview-token";
    process.env.VERCEL_ENV = "preview";
    assert.equal(cloudflareBeaconToken(), "");

    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_CF_BEACON_TOKEN = "   ";
    assert.equal(cloudflareBeaconToken(), "");
  });

  it("returns the production token and the beacon attribute", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_CF_BEACON_TOKEN = "  beacon-token  ";
    assert.equal(cloudflareBeaconToken(), "beacon-token");
    assert.equal(cloudflareBeaconAttribute("beacon-token"), '{"token":"beacon-token"}');
    assert.equal(cloudflareBeaconScript(), "https://static.cloudflareinsights.com/beacon.min.js");
  });
});
