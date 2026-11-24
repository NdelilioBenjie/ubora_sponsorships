'use client';
import type { Child } from '@/lib/children';

/** Open the Virtuous giving popup for a child (or generic when null). */
export function openGiving(child: Child | null) {
  window.dispatchEvent(new CustomEvent('ubora:give', { detail: child }));
}
