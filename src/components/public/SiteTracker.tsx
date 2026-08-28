'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function generateSessionId(): string {
  return 'ck_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'ck_session_id';
  const ttlKey = 'ck_session_ttl';
  const existing = sessionStorage.getItem(key);
  const ttl = sessionStorage.getItem(ttlKey);
  const now = Date.now();

  if (existing && ttl && now - parseInt(ttl) < 30 * 60 * 1000) {
    sessionStorage.setItem(ttlKey, now.toString());
    return existing;
  }

  const id = generateSessionId();
  sessionStorage.setItem(key, id);
  sessionStorage.setItem(ttlKey, now.toString());
  return id;
}

export function SiteTracker({ locale }: { locale?: string }) {
  const pathname = usePathname();
  const startTime = useRef(Date.now());
  const pageCount = useRef(0);
  const sessionId = useRef('');
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionId.current = getSessionId();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return;
    const sid = getSessionId();
    sessionId.current = sid;
    pageCount.current += 1;

    const payload = {
      action: initialized.current ? 'pageview' : 'start',
      session_id: sid,
      page_path: pathname,
      page_title: document.title,
      referrer: initialized.current ? undefined : document.referrer || undefined,
      locale,
      page_count: pageCount.current,
      duration_seconds: Math.round((Date.now() - startTime.current) / 1000),
    };

    initialized.current = true;

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    const st = startTime.current;
    return () => {
      const duration = Math.round((Date.now() - st) / 1000);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics/track',
          JSON.stringify({
            action: 'end',
            session_id: sid,
            page_path: pathname,
            page_count: pageCount.current,
            duration_seconds: duration,
          })
        );
      }
    };
  }, [pathname, locale]);

  return null;
}
