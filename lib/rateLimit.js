// Best-effort in-memory rate limiter for API routes. This is NOT a
// strong guarantee — Vercel serverless functions are ephemeral, so a
// cold start or a request landing on a different warm instance resets
// or bypasses this counter. It's a real speed bump against casual
// scripted abuse, not a substitute for an edge-level limiter (e.g.
// Upstash Redis / Vercel KV) if this endpoint ever needs to withstand
// a serious distributed attempt.
const buckets = new Map();

export function isRateLimited(key, { windowMs = 60_000, max = 10 } = {}) {
  const now = Date.now();
  const timestamps = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  buckets.set(key, timestamps);
  return timestamps.length > max;
}

export function requestIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}
