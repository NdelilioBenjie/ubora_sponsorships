'use client';
import { useEffect, useRef, useState } from 'react';
import type { Child } from '@/lib/children';

const V = {
  src: process.env.NEXT_PUBLIC_VIRTUOUS_SRC || 'https://cdn.virtuoussoftware.com/virtuous.embed.min.js',
  vform: process.env.NEXT_PUBLIC_VIRTUOUS_VFORM || '',
  orgId: process.env.NEXT_PUBLIC_VIRTUOUS_ORGID || '',
  isGiving: process.env.NEXT_PUBLIC_VIRTUOUS_ISGIVING || 'true',
  merchantType: process.env.NEXT_PUBLIC_VIRTUOUS_MERCHANTTYPE || 'StripeUnified',
  dependencies: process.env.NEXT_PUBLIC_VIRTUOUS_DEPENDENCIES || '[0]',
};

export default function GivingModal() {
  const [open, setOpen] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const formHost = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    const onGive = (e: Event) => {
      setChild((e as CustomEvent).detail as Child | null);
      setOpen(true);
    };
    window.addEventListener('ubora:give', onGive);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('ubora:give', onGive);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && V.vform && !injected.current && formHost.current) {
      injected.current = true;
      const s = document.createElement('script');
      s.src = V.src;
      s.async = true;
      s.setAttribute('data-vform', V.vform);
      s.setAttribute('data-orgId', V.orgId);
      s.setAttribute('data-isGiving', V.isGiving);
      s.setAttribute('data-merchantType', V.merchantType);
      s.setAttribute('data-dependencies', V.dependencies);
      s.addEventListener('load', () => {
        const l = formHost.current?.parentElement?.querySelector('.ug-loading') as HTMLElement | null;
        if (l) l.style.display = 'none';
      });
      formHost.current.appendChild(s);
    }
  }, [open]);

  if (!open) return null;
  const sub = child
    ? `You’re setting up a sponsorship for ${child.name} · Reference ${String(child.id).toUpperCase()}`
    : 'Thank you for supporting UBORA Tanzania.';

  return (
    <div className="ug-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="ug-modal" role="dialog" aria-modal="true" aria-label="Set up your sponsorship">
        <button className="ug-close" aria-label="Close" onClick={() => setOpen(false)}>
          &times;
        </button>
        <div className="ug-head">
          <h3>Set up your sponsorship</h3>
          <p>{sub}</p>
        </div>
        <div className="ug-body">
          <div className="ug-loading">Loading the secure giving form&hellip;</div>
          <div ref={formHost} />
        </div>
      </div>
    </div>
  );
}
