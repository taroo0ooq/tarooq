const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const fresh = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);
  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - fresh[0])) / 1000));
    return { ok: false as const, retryAfter };
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return { ok: true as const, retryAfter: 0 };
}

export function resetRateLimit() {
  buckets.clear();
}
