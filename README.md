# UBORA — Sponsor a Child (Next.js)

The public **Sponsor a Child** site. It pulls the children live from the internal
Sponsorship Hub feed, and pulls the **navigation + footer live from Webflow** so the
header/footer stay in sync with uboratz.org (Naum's method). Deployed on **Netlify**.

## What's inside
- `app/page.tsx` — the children grid (filters, pagination).
- `app/children/[slug]/page.tsx` — a child's profile.
- `components/SponsorGrid.tsx`, `components/GivingModal.tsx` — grid + the Virtuous giving popup.
- `lib/children.ts` — fetches the Hub feed.
- `lib/navfooter.ts` — **the Webflow nav/footer pull** (all 8 steps from the instructions:
  server-side fetch, strip page-only effects, rewrite links, scope the CSS to `.wf-scope`,
  swap the Turnstile newsletter form for a link, cache + on-demand revalidate).
- `components/NavFooterScripts.tsx` — re-runs the nav's GSAP scripts after mount.
- `app/api/webflow-publish/route.ts` — **the publish webhook** that clears the nav/footer cache.

## Run locally
1. `npm install`
2. `cp .env.example .env.local` and fill in the values (see below).
3. `npm run dev` → http://localhost:3000

## Environment variables (set these in Netlify → Site settings → Environment variables)
| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_CHILDREN_FEED` | The Hub feed, `https://uborahomevisit.co.tz/sponsor-feed/children` |
| `WEBFLOW_NAVFOOTER_URL` | `https://uboratz.org/navigation-footer-pull` |
| `WEBFLOW_SITE_ORIGIN` | `https://uboratz.org` (relative links are rewritten to this) |
| `NAVFOOTER_TTL` | Cache seconds for the nav/footer (default 3600) |
| `REVALIDATE_SECRET` | A long random string. Naum puts this in the webhook URL. |
| `NEXT_PUBLIC_VIRTUOUS_*` | The Virtuous giving-form values your boss provided |

## Deploy to Netlify
1. Push this folder to a Git repo (GitHub).
2. In Netlify: **Add new site → Import from Git**, pick the repo.
   Build command `npm run build`, publish `.next` — already set in `netlify.toml`,
   and the official `@netlify/plugin-nextjs` runs Next.js for you.
3. Add all the environment variables above, then **Deploy**.
4. Add the custom domain `sponsor.uboratz.org` under **Domain settings**.

## The two things to send Naum
- **Webhook URL** (he adds it as a Webflow "Site publish" webhook):
  `https://sponsor.uboratz.org/api/webflow-publish?secret=<REVALIDATE_SECRET>`
  (test it in a browser — a GET returns `{"ok":true,...}` with the right secret, `401` without.)
- **DNS:** `sponsor.uboratz.org` is a **CNAME** to your Netlify site's address,
  e.g. `ubora-sponsor.netlify.app` (Netlify shows the exact target when you add the domain).
  A Netlify subdomain needs only that CNAME — no TXT or A records. HTTPS is issued automatically.

## Notes
- If the Webflow nav slightly overlaps the page, adjust `--wf-nav-height` in `app/globals.css`.
- If `uboratz.org/navigation-footer-pull` is ever unreachable, the site shows a simple
  fallback header/footer so it never breaks — the real nav/footer return on the next load.
- The children feed is always fetched fresh; the Hub decides who is public.
