'use client';
import { useEffect, useRef, useState } from 'react';
import type { Child } from '@/lib/children';
import { kacsOf } from '@/lib/children';

// Exact Virtuous embed used on every child's sponsor action. Hardcoded defaults
// so it works even where env vars aren't set; env vars can still override.
const V = {
  src: process.env.NEXT_PUBLIC_VIRTUOUS_SRC || 'https://cdn.virtuoussoftware.com/virtuous.embed.min.js',
  vform: process.env.NEXT_PUBLIC_VIRTUOUS_VFORM || '727c0e0a-c6ea-4fb1-bca2-5e4744a6248d',
  orgId: process.env.NEXT_PUBLIC_VIRTUOUS_ORGID || '7019',
  isGiving: process.env.NEXT_PUBLIC_VIRTUOUS_ISGIVING || 'true',
  merchantType: process.env.NEXT_PUBLIC_VIRTUOUS_MERCHANTTYPE || 'StripeUnified',
  dependencies: process.env.NEXT_PUBLIC_VIRTUOUS_DEPENDENCIES || '',
};

/** Write a value into a form field in a way framework-bound inputs still detect. */
function setFieldValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

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

  // Lock body scroll while open, and inject the Virtuous script ONCE (kept mounted after).
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
      if (V.dependencies) s.setAttribute('data-dependencies', V.dependencies);
      s.addEventListener('load', () => {
        const l = formHost.current?.parentElement?.querySelector('.ug-loading') as HTMLElement | null;
        if (l) l.style.display = 'none';
      });
      formHost.current.appendChild(s);
    }
  }, [open]);

  // Each time the modal opens for a child, write that child's KACS number into the
  // form's "Sole Sponsored KACs" field (name="CustomField"). Polls until the field
  // exists (the embed renders asynchronously) and updates it when the child changes.
  useEffect(() => {
    if (!open || !child) return;
    const kacs = String(kacsOf(child)).toUpperCase();
    let tries = 0;
    const apply = () => {
      const host = formHost.current;
      const el = host?.querySelector(
        'input[name="CustomField"], textarea[name="CustomField"]'
      ) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!el) return false;
      if (el.value !== kacs) setFieldValue(el, kacs);
      return true;
    };
    if (apply()) return;
    const iv = setInterval(() => {
      tries += 1;
      if (apply() || tries > 40) clearInterval(iv); // give the embed ~10s to render
    }, 250);
    return () => clearInterval(iv);
  }, [open, child]);

  const sub = child
    ? `You’re setting up a sponsorship for ${child.name} · Reference ${String(kacsOf(child)).toUpperCase()}`
    : 'Thank you for supporting UBORA Tanzania.';

  // Note: we do NOT unmount on close (that left the loaded form broken on reopen).
  // We hide with CSS so the Virtuous form stays loaded and reopens instantly.
  return (
    <div
      className="ug-overlay"
      style={{ display: open ? undefined : 'none' }}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
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
