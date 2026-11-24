import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { NAVFOOTER_TAG } from '@/lib/navfooter';

export const dynamic = 'force-dynamic';

function run(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: 'Invalid or missing secret.' }, { status: 401 });
  }
  revalidateTag(NAVFOOTER_TAG);
  return NextResponse.json({ ok: true, revalidated: NAVFOOTER_TAG, at: new Date().toISOString() });
}

// Webflow sends POST on publish; GET is allowed so you can test the URL in a browser.
export const POST = run;
export const GET = run;
