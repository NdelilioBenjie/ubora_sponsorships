'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Child } from '@/lib/children';
import { childSlug, cdnImg } from '@/lib/children';

const PAGE = 6;
const initials = (n: string) => {
  const p = (n || '').trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
};

export default function SponsorGrid({ feedUrl }: { feedUrl: string }) {
  const [kids, setKids] = useState<Child[] | null>(null);
  const [q, setQ] = useState('');
  const [ageMin, setAgeMin] = useState(1);
  const [ageMax, setAgeMax] = useState(18);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    fetch(feedUrl, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setKids(Array.isArray(d) ? d : []))
      .catch(() => setKids([]))
      .finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [feedUrl]);

  const allHobbies = useMemo(() => {
    const set = new Set<string>();
    (kids || []).forEach((c) => (c.hobbies || []).forEach((h) => set.add(h)));
    return [...set];
  }, [kids]);

  const filtered = useMemo(() => {
    return (kids || []).filter((c) => {
      if (c.age != null && (c.age < ageMin || c.age > ageMax)) return false;
      if (hobbies.length && !hobbies.every((h) => (c.hobbies || []).includes(h))) return false;
      if (q) {
        const hay = (c.name + ' ' + c.grade).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [kids, ageMin, ageMax, hobbies, q]);

  const toggleHobby = (h: string) =>
    setHobbies((hs) => (hs.includes(h) ? hs.filter((x) => x !== h) : [...hs, h]));
  const reset = () => { setQ(''); setAgeMin(1); setAgeMax(18); setHobbies([]); setShown(PAGE); };

  if (kids === null) return <p className="kid-count">Loading children&hellip;</p>;

  return (
    <>
      <div className="filters">
        <div className="fgroup">
          <span>Age {ageMin}&ndash;{ageMax}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="range" min={1} max={18} value={ageMin} onChange={(e) => setAgeMin(Math.min(+e.target.value, ageMax))} />
            <input type="range" min={1} max={18} value={ageMax} onChange={(e) => setAgeMax(Math.max(+e.target.value, ageMin))} />
          </div>
        </div>
        <div className="fgroup" style={{ flex: 1, minWidth: 200 }}>
          <span>Search</span>
          <input className="fb-input" placeholder="Name or class" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {allHobbies.length > 0 && (
          <div className="fgroup" style={{ flexBasis: '100%' }}>
            <span>Hobbies</span>
            <div className="fb-chips">
              {allHobbies.map((h) => (
                <button key={h} className={`fb-chip ${hobbies.includes(h) ? 'on' : ''}`} onClick={() => toggleHobby(h)}>{h}</button>
              ))}
            </div>
          </div>
        )}
        <button className="flink" onClick={reset}>Reset</button>
      </div>

      <div className="kid-count">{filtered.length} {filtered.length === 1 ? 'child' : 'children'} waiting for a sponsor</div>

      {filtered.length === 0 ? (
        <p className="empty-note">No children match these filters right now — try widening your search, or check back soon.</p>
      ) : (
        <>
          <div className="kids-grid">
            {filtered.slice(0, shown).map((c) => (
              <Link key={c.id} className="kid-card" href={`/children/${childSlug(c)}`} prefetch={false}>
                {c.photo800 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="ph" src={cdnImg(c.photo800, 800)} alt={c.name} loading="lazy" decoding="async" />
                ) : (
                  <div className="ph ph-init">{initials(c.name)}</div>
                )}
                <div className="kid-card-info">
                  <h3>{c.name}</h3>
                  <span className="kid-card-date">{c.age != null ? `Age ${c.age} · ` : ''}{c.grade}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="grid-cta">
            {shown < filtered.length && (
              <button className="btn btn-yellow btn-view" onClick={() => setShown((s) => s + PAGE)}>View More</button>
            )}
            {shown > PAGE && (
              <button className="btn btn-yellow btn-view" onClick={() => setShown(PAGE)}>View Less</button>
            )}
          </div>
        </>
      )}
    </>
  );
}
