'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Child } from '@/lib/children';
import { openGiving } from '@/components/giving';

const FEED = process.env.NEXT_PUBLIC_CHILDREN_FEED || 'https://uborahomevisit.co.tz/sponsor-feed/children';
const initials = (n: string) => {
  const p = (n || '').trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
};

export default function ChildProfile({ params }: { params: { slug: string } }) {
  const [state, setState] = useState<{ loading: boolean; child: Child | null }>({ loading: true, child: null });

  useEffect(() => {
    const url = FEED + (FEED.includes('?') ? '&' : '?') + 't=' + Date.now();
    fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Child[]) => {
        const id = decodeURIComponent(params.slug);
        setState({ loading: false, child: (Array.isArray(list) ? list : []).find((c) => c.id === id) || null });
      })
      .catch(() => setState({ loading: false, child: null }));
  }, [params.slug]);

  if (state.loading) return <div className="wrap sec"><p>Loading&hellip;</p></div>;
  const c = state.child;
  if (!c)
    return (
      <div className="wrap sec">
        <p>We could not find that child&rsquo;s profile. <Link href="/">Browse children awaiting sponsorship</Link>.</p>
      </div>
    );

  const first = c.name.split(' ')[0];
  return (
    <div className="wrap sec">
      <Link className="back-link" href="/">&larr; Back to all children</Link>
      <div className="pf-hero">
        {c.photo1600 || c.photo800 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pf-photo" src={c.photo1600 || c.photo800 || ''} alt={c.name} />
        ) : (
          <div className="pf-init">{initials(c.name)}</div>
        )}
        <div className="pf-hero-body">
          <h1>Meet {c.name}</h1>
          {c.blurb && <p className="pf-lead">{c.blurb}</p>}
          <div className="pf-chips">
            {c.age != null && <span className="pf-chip">{c.age} years old</span>}
            {c.grade && <span className="pf-chip">{c.grade}</span>}
            {c.gender && <span className="pf-chip">{c.gender}</span>}
            {c.region && <span className="pf-chip">{c.region}</span>}
          </div>
          <div className="pf-cta">
            <button className="btn btn-yellow" onClick={() => openGiving(c)}>Sponsor {first} &rarr;</button>
            <span className="pf-ref">Child ID: {String(c.id).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="pf-body">
        <div className="card-w">
          <h2>{first}&rsquo;s story</h2>
          <p style={{ lineHeight: 1.7, margin: 0 }}>{c.bio || `${first} is waiting for a sponsor to walk with them through school.`}</p>
          {c.hobbies?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {c.hobbies.map((h) => <span key={h} className="chip">{h}</span>)}
            </div>
          )}
        </div>
        <div className="card-w">
          <h2>Details</h2>
          <dl className="facts">
            <dt>Class</dt><dd>{c.grade || '—'}</dd>
            <dt>Age</dt><dd>{c.age ?? '—'}</dd>
            <dt>Region</dt><dd>{c.region || '—'}</dd>
            {c.schooling?.length > 0 && (<><dt>Schooling</dt><dd>{c.schooling.join(', ')}</dd></>)}
          </dl>
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-yellow" onClick={() => openGiving(c)}>Sponsor {first}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
