export type Child = {
  id: string;
  /** KACS number from the internal app, shown as the child's reference. */
  kacsNumber?: string | null;
  kacs_number?: string | null;
  kacs?: string | null;
  name: string;
  gender: string;      // "Boy" | "Girl" | ""
  age: number | null;
  grade: string;
  region: string;
  hobbies: string[];
  status: string;
  urgent: boolean;
  blurb: string | null;
  bio: string | null;
  familyInfo: string[];
  familyDuties: string[];
  schooling: string[];
  photo800: string | null;
  photo1600: string | null;
};

export const FEED_URL =
  process.env.NEXT_PUBLIC_CHILDREN_FEED || 'https://uborahomevisit.co.tz/sponsor-feed/children';

/** The child's public reference — KACS number from the internal app, or the id as fallback. */
export function kacsOf(c: Child): string {
  return String(c.kacsNumber ?? c.kacs_number ?? c.kacs ?? c.id ?? '');
}

const slugPart = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** URL slug for a child: "firstname-lastname-kacsnumber" (falls back to id). */
export function childSlug(c: Child): string {
  return [slugPart(c.name), slugPart(kacsOf(c))].filter(Boolean).join('-') || String(c.id);
}

/**
 * Server-side cached fetch of the feed. Hits the (possibly slow) Hub at most once
 * per `revalidateSeconds`, with an 8s timeout so a hanging Hub can't block renders.
 */
export async function fetchChildrenCached(revalidateSeconds = 30): Promise<Child[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(FEED_URL, {
      signal: ctrl.signal,
      next: { revalidate: revalidateSeconds },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as Child[]) : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch the published children. Always fresh (the Hub controls who is public). */
export async function fetchChildren(): Promise<Child[]> {
  try {
    const url = FEED_URL + (FEED_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
    const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as Child[]) : [];
  } catch {
    return [];
  }
}
