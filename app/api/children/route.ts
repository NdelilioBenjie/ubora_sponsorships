import { fetchChildrenCached } from '@/lib/children';

// Served from Netlify's edge; refreshed at most every 30s. Clients hit this
// instead of the Hub directly, so a slow Hub is fetched once per window, not per view.
export const revalidate = 30;

export async function GET() {
  const kids = await fetchChildrenCached(30);
  return Response.json(kids, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
  });
}
