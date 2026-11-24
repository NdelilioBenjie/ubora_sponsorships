'use client';
import { useEffect } from 'react';
const ORIGIN = 'https://uboratz.org';
export default function NewsletterEmbed() {
  useEffect(() => {
    const footer = document.querySelector('#global-footer');
    const oldTop = footer?.querySelector('.footer-top');
    if (!footer || !oldTop) return;
    const controller = new AbortController();
    const frame = document.createElement('iframe');
    frame.title = 'Subscribe to our newsletter';
    frame.style.cssText =
      'display:block;width:100vw;max-width:none;height:0;border:0;' +
      'background:transparent;position:relative;z-index:2;color-scheme:normal';
    // Webflow reports the form's height when it's ready, and when it changes.
    window.addEventListener('message', (event) => {
      if (event.origin !== ORIGIN || event.source !== frame.contentWindow) return;
      const height = Number(event.data?.height);
      if (event.data?.type !== 'ubora-newsletter' || !(height > 0)) return;
      frame.style.height = `${height}px`;
      oldTop.setAttribute('style', 'display:none');
    }, { signal: controller.signal });
    // Load it only when the visitor gets close to the footer.
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      frame.src = `${ORIGIN}/navigation-footer-pull?embed=newsletter&sb=${scrollbar}`;
      footer.prepend(frame);
    }, { rootMargin: '800px' });
    observer.observe(footer);
    return () => {
      controller.abort();
      observer.disconnect();
      frame.remove();
      oldTop.removeAttribute('style');
    };
  }, []);
  return null;
}
