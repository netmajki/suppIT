import "server-only";
import { headers } from "next/headers";

/**
 * Prosty limiter w pamięci procesu (wystarczający dla jednej instancji na VPS).
 * Zwraca true, jeśli limit został przekroczony.
 */
const buckets = new Map<string, number[]>();

export async function isRateLimited(scope: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) buckets.clear(); // zabezpieczenie przed wyciekiem pamięci
  return false;
}
