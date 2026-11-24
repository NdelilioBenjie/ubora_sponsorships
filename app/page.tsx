import SponsorGrid from '@/components/SponsorGrid';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <section className="wrap sec">
      <div className="hero-spon">
        <h1>Sponsor a Child</h1>
        <p>Through child sponsorship, you share the hope of the gospel with a child in need. Browse the children below and set up your gift in a moment.</p>
      </div>
      <SponsorGrid feedUrl="/api/children" />
    </section>
  );
}
