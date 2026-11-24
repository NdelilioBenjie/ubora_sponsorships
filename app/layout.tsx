import type { Metadata } from 'next';
import './globals.css';
import { getNavFooter } from '@/lib/navfooter';
import NavFooterScripts from '@/components/NavFooterScripts';
import GivingModal from '@/components/GivingModal';

export const metadata: Metadata = {
  title: 'Sponsor a Child | UBORA Tanzania Foundation',
  description:
    'Through child sponsorship, you share the hope of the gospel with a child in need. Browse children waiting for a sponsor.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nf = await getNavFooter();

  return (
    <html lang="en">
      <head>{nf.ok && nf.css ? <style id="wf-nav-css" dangerouslySetInnerHTML={{ __html: nf.css }} /> : null}</head>
      <body>
        {nf.ok ? (
          <div className="wf-scope" dangerouslySetInnerHTML={{ __html: nf.navHtml }} />
        ) : (
          <header className="fallback-nav">
            <a href={(process.env.WEBFLOW_SITE_ORIGIN || 'https://uboratz.org')}>UBORA Tanzania</a>
            <a className="fallback-give" href={(process.env.WEBFLOW_SITE_ORIGIN || 'https://uboratz.org') + '/give'}>Give</a>
          </header>
        )}

        {/* Nav is position:fixed on the Webflow side, so the content sits below it */}
        <main className={`app-root ${nf.ok ? 'has-wf-nav' : ''}`}>{children}</main>

        {nf.ok ? (
          <div className="wf-scope" dangerouslySetInnerHTML={{ __html: nf.footerHtml }} />
        ) : (
          <footer className="fallback-footer">
            <p>UBORA Tanzania Foundation &middot; Sponsor a child. Launch a leader.</p>
          </footer>
        )}

        <NavFooterScripts />
        <GivingModal />
      </body>
    </html>
  );
}
