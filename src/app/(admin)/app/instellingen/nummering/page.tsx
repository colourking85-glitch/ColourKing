'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type NumberRange = {
  id: string;
  doc_type: string;
  year: number;
  prefix: string;
  next_number: number;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  offer: 'doc.offer',
  invoice: 'doc.invoice',
  credit_note: 'doc.credit_note',
  repair_order: 'doc.repair_order',
  handover_note: 'doc.handover_note',
};

export default function NumberingPage() {
  const t = useTranslations('sy');
  const tDoc = useTranslations('doc');
  const tCommon = useTranslations('common');
  const [ranges, setRanges] = useState<NumberRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrefix, setEditPrefix] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRanges();
  }, []);

  async function loadRanges() {
    try {
      const res = await fetch('/api/settings/numbering');
      if (res.ok) {
        const data = await res.json();
        setRanges(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function startEdit(range: NumberRange) {
    setEditing(range.id);
    setEditPrefix(range.prefix);
    setSuccess('');
  }

  async function savePrefix(range: NumberRange) {
    setSaving(true);
    setSuccess('');

    try {
      const res = await fetch('/api/settings/numbering', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: range.id, prefix: editPrefix }),
      });

      if (res.ok) {
        setEditing(null);
        setSuccess(t('saved'));
        await loadRanges();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function getDocTypeLabel(docType: string): string {
    switch (docType) {
      case 'offer':
        return tDoc('offer');
      case 'invoice':
        return tDoc('invoice');
      case 'credit_note':
        return tDoc('credit_note');
      case 'repair_order':
        return tDoc('repair_order');
      case 'handover_note':
        return tDoc('handover_note');
      default:
        return docType;
    }
  }

  function formatNextNumber(range: NumberRange): string {
    return `${range.prefix}-${range.year}-${String(range.next_number).padStart(4, '0')}`;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-lg font-medium text-white">{t('numberingTitle')}</h1>
        <ScreenBadge id="SY03" />
      </div>

      <p className="mb-6 text-sm text-[#6b6b80]">{t('numberingSubtitle')}</p>

      {success && (
        <div className="mb-4 rounded-[10px] border-[0.5px] border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">
          {success}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[#6b6b80]">{tCommon('loading')}</p>
      ) : ranges.length === 0 ? (
        <p className="text-sm text-[#6b6b80]">{t('noRanges')}</p>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border-[0.5px] border-[#1e1e2a]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2a] bg-[#12121a]">
                <th className="px-4 py-3 text-left font-medium text-[#6b6b80]">
                  {t('docType')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#6b6b80]">
                  {t('year')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#6b6b80]">
                  {t('prefix')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#6b6b80]">
                  {t('nextNumber')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#6b6b80]">
                  {t('preview')}
                </th>
                <th className="px-4 py-3 text-right font-medium text-[#6b6b80]">
                  {tCommon('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {ranges.map((range) => (
                <tr
                  key={range.id}
                  className="border-b border-[#1e1e2a] last:border-0"
                >
                  <td className="px-4 py-3 text-white">
                    {getDocTypeLabel(range.doc_type)}
                  </td>
                  <td className="px-4 py-3 text-[#6b6b80]">{range.year}</td>
                  <td className="px-4 py-3">
                    {editing === range.id ? (
                      <input
                        type="text"
                        value={editPrefix}
                        onChange={(e) => setEditPrefix(e.target.value.toUpperCase())}
                        className="w-20 rounded-[10px] border-[0.5px] border-[#1e1e2a] bg-[#0a0a0f] px-2 py-1 text-xs text-white outline-none focus:border-[#E8364E]/50"
                        autoFocus
                      />
                    ) : (
                      <span className="font-mono text-white">{range.prefix}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#6b6b80]">
                    {range.next_number}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#6b6b80]">
                    {editing === range.id
                      ? `${editPrefix}-${range.year}-${String(range.next_number).padStart(4, '0')}`
                      : formatNextNumber(range)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editing === range.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => savePrefix(range)}
                          disabled={saving}
                          className="text-xs text-[#E8364E] transition-opacity hover:opacity-80 disabled:opacity-50"
                        >
                          {saving ? tCommon('saving') : tCommon('save')}
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="text-xs text-[#6b6b80] transition-colors hover:text-white"
                        >
                          {tCommon('cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(range)}
                        className="text-xs text-[#6b6b80] transition-colors hover:text-white"
                      >
                        {tCommon('edit')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
