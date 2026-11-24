import * as cheerio from 'cheerio';
import postcss from 'postcss';
import prefixer from 'postcss-prefix-selector';
import { unstable_cache } from 'next/cache';

export type NavFooter = { ok: boolean; navHtml: string; footerHtml: string; css: string };

const SOURCE = process.env.WEBFLOW_NAVFOOTER_URL || 'https://uboratz.org/navigation-footer-pull';
const ORIGIN = (process.env.WEBFLOW_SITE_ORIGIN || 'https://uboratz.org').replace(/\/$/, '');
const TTL = Number(process.env.NAVFOOTER_TTL || 3600);
export const NAVFOOTER_TAG = 'navfooter';

/** fetch() with an abort timeout so a slow/hanging Webflow origin can't block the render. */
async function fetchT(url: string, init: RequestInit = {}, ms = 6000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Scope one block of CSS so Webflow's global styles only touch our .wf-scope wrappers (Naum step 4). */
async function scopeCss(css: string): Promise<string> {
  if (!css.trim()) return '';
  try {
    const out = await postcss([
      prefixer({
        prefix: '.wf-scope',
        transform(prefix, selector, prefixed) {
          // Map root/document selectors onto the scope itself.
          if (/^(html|body|:root)$/i.test(selector.trim())) return prefix;
          if (/^(\*|from|to|\d+%)$/.test(selector.trim())) return selector; // keyframe steps, universal
          return prefixed;
        },
      }),
    ]).process(css, { from: undefined });
    return out.css;
  } catch {
    return '';
  }
}

/** Fetch the Webflow page, pull #global-nav and #global-footer, clean them, and return scoped CSS. */
async function buildNavFooter(): Promise<NavFooter> {
  const empty: NavFooter = { ok: false, navHtml: '', footerHtml: '', css: '' };
  try {
    const res = await fetchT(SOURCE, { cache: 'no-store', headers: { 'User-Agent': 'UBORA-Sponsor/1.0' } });
    if (!res.ok) return empty;
    const html = await res.text();
    const $ = cheerio.load(html);

    // (3) remove Webflow's current-page marker everywhere
    $('.w--current').removeClass('w--current');

    // (3) rewrite root-relative links/assets to the live site origin
    const fix = (el: any, attr: string) => {
      const v = $(el).attr(attr);
      if (v && v.startsWith('/') && !v.startsWith('//')) $(el).attr(attr, ORIGIN + v);
    };
    $('a[href^="/"]').each((_, el) => fix(el, 'href'));
    $('img[src^="/"], source[src^="/"]').each((_, el) => fix(el, 'src'));

    const nav = $('#global-nav');
    const footer = $('#global-footer');
    if (!nav.length || !footer.length) return empty;

    // (3) drop the page-only effects that live in the nav's utility block; keep nav/button/scaling
    nav.find('.utility_animated-text, .utility_parallax, .s_showreel').remove();

    // (4) collect and scope the stylesheet(s) the page links, read fresh (filename changes per publish)
    const cssParts: string[] = [];
    const links = $('link[rel="stylesheet"]')
      .map((_, el) => $(el).attr('href'))
      .get()
      .filter(Boolean)
      .map((h) => (h!.startsWith('//') ? 'https:' + h : h!.startsWith('/') ? ORIGIN + h! : h!));
    for (const href of links) {
      try {
        const r = await fetchT(href, { cache: 'no-store' }, 5000);
        if (r.ok) cssParts.push(await r.text());
      } catch {
        /* ignore a single stylesheet failure */
      }
    }
    // (4) also scope the inline <style> blocks inside the nav, then remove the originals
    nav.find('style').each((_, el) => {
      cssParts.push($(el).html() || '');
      $(el).remove();
    });

    const css = await scopeCss(cssParts.join('\n'));

    // (7) the footer newsletter form is Cloudflare-Turnstile protected and only works on uboratz.org
    footer.find('form').each((_, el) => {
      $(el).replaceWith(
        `<a class="wf-newsletter-link" href="${ORIGIN}/#global-footer" target="_blank" rel="noopener">Subscribe to our newsletter →</a>`
      );
    });

    return {
      ok: true,
      navHtml: $.html(nav),       // keeps the <script> tags; we re-run them client-side (step 5)
      footerHtml: $.html(footer),
      css,
    };
  } catch {
    return empty;
  }
}

/** Cached accessor. The publish webhook calls revalidateTag(NAVFOOTER_TAG) to refresh instantly. */
export const getNavFooter = unstable_cache(buildNavFooter, ['navfooter-v1'], {
  tags: [NAVFOOTER_TAG],
  revalidate: TTL,
});
