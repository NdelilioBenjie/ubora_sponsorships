'use client';
import { useEffect } from 'react';

/** Re-runs the nav's inline/GSAP scripts, which don't fire when injected via innerHTML (Naum step 5). */
export default function NavFooterScripts() {
  useEffect(() => {
    const w = window as any;
    if (w.__uboraNavReady) return;
    w.__uboraNavReady = true; // StrictMode runs effects twice
    const g = document.createElement('script');
    g.src = 'https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js';
    g.onload = () => {
      document.querySelectorAll('#global-nav script').forEach((old) => {
        const s = document.createElement('script');
        s.textContent = (old as HTMLScriptElement).textContent;
        document.body.appendChild(s);
      });
      w.initMegaNavDirectionalHover?.();
      w.initDirectionalButtonHover?.();
    };
    document.head.appendChild(g);
  }, []);
  return null;
}
