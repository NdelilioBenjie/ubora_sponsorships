export type Child = {
  id: string;
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
