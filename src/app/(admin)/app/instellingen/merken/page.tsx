'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type Model = { id: string; name: string; sort_order: number };
type Brand = { id: string; name: string; sort_order: number; models?: Model[] };

function SortOrderInput({
  value,
  onSave,
}: {
  value: number;
  onSave: (val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());

  function commit() {
    setEditing(false);
    const num = parseInt(draft) || 0;
    if (num !== value) onSave(num);
  }

  if (editing) {
    return (
      <input
        type="number"
        min={0}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        autoFocus
        className="w-12 rounded border border-ck-red bg-ck-dark-surface px-1.5 py-0.5 text-center text-xs font-mono text-white focus:outline-none"
        onClick={e => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); setDraft(value > 0 ? value.toString() : ''); setEditing(true); }}
      title="Click to edit order"
      className={`inline-flex min-w-[2rem] items-center justify-center rounded px-1.5 py-0.5 text-xs font-mono transition-colors hover:border-ck-red hover:bg-ck-red/10 ${
        value > 0
          ? 'bg-ck-red/10 text-ck-red border border-ck-red/30'
          : 'bg-ck-dark-surface text-ck-muted border border-transparent'
      }`}
    >
      {value > 0 ? value : '—'}
    </button>
  );
}

export default function BrandModelManagementPage() {
  const t = useTranslations('vh');
  const tCommon = useTranslations('common');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [addingModel, setAddingModel] = useState<string | null>(null);

  async function fetchBrands() {
    const res = await fetch('/api/vehicle-brands');
    if (res.ok) setBrands(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchBrands(); }, []);

  async function toggleBrand(brandId: string) {
    if (expandedBrand === brandId) {
      setExpandedBrand(null);
      return;
    }
    setExpandedBrand(brandId);
    const res = await fetch(`/api/vehicle-brands/${brandId}/models`);
    if (res.ok) {
      const models = await res.json();
      setBrands(prev => prev.map(b => b.id === brandId ? { ...b, models } : b));
    }
  }

  async function updateBrandOrder(brandId: string, sort_order: number) {
    await fetch(`/api/vehicle-brands/${brandId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sort_order }),
    });
    fetchBrands();
  }

  async function updateModelOrder(modelId: string, brandId: string, sort_order: number) {
    await fetch(`/api/vehicle-models/${modelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sort_order }),
    });
    const res = await fetch(`/api/vehicle-brands/${brandId}/models`);
    if (res.ok) {
      const models = await res.json();
      setBrands(prev => prev.map(b => b.id === brandId ? { ...b, models } : b));
    }
  }

  async function addBrand() {
    if (!newBrandName.trim()) return;
    const res = await fetch('/api/vehicle-brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBrandName.trim() }),
    });
    if (res.ok) {
      setNewBrandName('');
      fetchBrands();
    }
  }

  async function deleteBrand(brandId: string) {
    if (!confirm(tCommon('confirm') + '?')) return;
    await fetch(`/api/vehicle-brands/${brandId}`, { method: 'DELETE' });
    fetchBrands();
  }

  async function addModel(brandId: string) {
    if (!newModelName.trim()) return;
    const res = await fetch(`/api/vehicle-brands/${brandId}/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newModelName.trim() }),
    });
    if (res.ok) {
      setNewModelName('');
      setAddingModel(null);
      const modelsRes = await fetch(`/api/vehicle-brands/${brandId}/models`);
      if (modelsRes.ok) {
        const models = await modelsRes.json();
        setBrands(prev => prev.map(b => b.id === brandId ? { ...b, models } : b));
      }
    }
  }

  async function deleteModel(modelId: string, brandId: string) {
    await fetch(`/api/vehicle-models/${modelId}`, { method: 'DELETE' });
    const modelsRes = await fetch(`/api/vehicle-brands/${brandId}/models`);
    if (modelsRes.ok) {
      const models = await modelsRes.json();
      setBrands(prev => prev.map(b => b.id === brandId ? { ...b, models } : b));
    }
  }

  const inputClass = 'rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="SY40" />
        <h1 className="font-display text-2xl font-bold text-white">{t('brandManagement')}</h1>
      </div>

      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
        <p className="mb-3 text-xs text-ck-muted">
          {t('sortOrderHint')}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('newBrand')}
            value={newBrandName}
            onChange={e => setNewBrandName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addBrand()}
            className={`flex-1 ${inputClass}`}
          />
          <button
            onClick={addBrand}
            disabled={!newBrandName.trim()}
            className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
          >
            <Plus size={14} /> {tCommon('add')}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card">
        {loading ? (
          <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>
        ) : brands.length === 0 ? (
          <div className="p-8 text-center text-ck-muted">{t('noBrands')}</div>
        ) : (
          <div className="divide-y divide-ck-dark-border">
            {brands.map(brand => (
              <div key={brand.id}>
                <div className="flex items-center justify-between px-4 py-3 hover:bg-ck-dark-surface">
                  <button
                    onClick={() => toggleBrand(brand.id)}
                    className="flex flex-1 items-center gap-2 text-sm font-medium text-white"
                  >
                    {expandedBrand === brand.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <SortOrderInput
                      value={brand.sort_order}
                      onSave={(val) => updateBrandOrder(brand.id, val)}
                    />
                    {brand.name}
                    {brand.models && (
                      <span className="text-xs text-ck-muted">({brand.models.length} {t('modelsCount')})</span>
                    )}
                  </button>
                  <button
                    onClick={() => deleteBrand(brand.id)}
                    className="p-1 text-ck-muted hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {expandedBrand === brand.id && (
                  <div className="border-t border-ck-dark-border/50 bg-ck-dark-surface/50 px-4 py-3">
                    {brand.models && brand.models.length > 0 ? (
                      <div className="space-y-1 mb-3">
                        {brand.models.map(model => (
                          <div key={model.id} className="flex items-center justify-between rounded px-3 py-1.5 hover:bg-ck-dark-surface">
                            <span className="flex items-center gap-2 text-sm text-ck-muted-light">
                              <SortOrderInput
                                value={model.sort_order}
                                onSave={(val) => updateModelOrder(model.id, brand.id, val)}
                              />
                              {model.name}
                            </span>
                            <button
                              onClick={() => deleteModel(model.id, brand.id)}
                              className="p-1 text-ck-muted hover:text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mb-3 text-xs text-ck-muted">{t('noModels')}</p>
                    )}

                    {addingModel === brand.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={t('newModel')}
                          value={newModelName}
                          onChange={e => setNewModelName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addModel(brand.id)}
                          autoFocus
                          className={`flex-1 ${inputClass}`}
                        />
                        <button
                          onClick={() => addModel(brand.id)}
                          disabled={!newModelName.trim()}
                          className="rounded-lg bg-ck-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
                        >
                          {tCommon('add')}
                        </button>
                        <button
                          onClick={() => { setAddingModel(null); setNewModelName(''); }}
                          className="rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs text-ck-muted hover:text-white"
                        >
                          {tCommon('cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingModel(brand.id)}
                        className="flex items-center gap-1 text-xs text-ck-muted hover:text-white"
                      >
                        <Plus size={12} /> {t('addModel')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
