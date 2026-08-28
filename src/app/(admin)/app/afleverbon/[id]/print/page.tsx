'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { HandoverTemplate } from '@/modules/repair-orders/handover-template';

export default function HandoverPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Parameters<typeof HandoverTemplate>[0]['handover'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/handover-notes/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setDoc(data);
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => window.print(), 500);
      });
  }, [id]);

  if (loading || !doc || !doc.payload) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #ddd', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <HandoverTemplate handover={doc} />;
}
