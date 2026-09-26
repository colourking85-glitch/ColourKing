'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Settings, Palette, Globe, Building2, Bell, Check, Type, Maximize2, Bot, Landmark, CreditCard, FileText, Upload, Trash2, Image as ImageIcon, Mail } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { useAppLocale } from '@/components/AdminIntlProvider';
import { useSettings } from '@/components/SettingsProvider';
import { EmailSettingsTab } from '@/components/settings/EmailSettingsTab';

type Tab = 'company' | 'email' | 'appearance' | 'general' | 'notifications';

type CompanyData = {
  name: string;
  legal_name: string;
  address: string;
  postcode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  kvk: string;
  vat_number: string;
  iban: string;
  bic: string;
  bank_name: string;
  payment_terms_days: number;
  quote_validity_days: number;
  default_invoice_notes: string;
};

const COMPANY_DEFAULTS: CompanyData = {
  name: '', legal_name: '', address: '', postcode: '', city: '', country: 'NL',
  phone: '', email: '', website: '',
  kvk: '', vat_number: '', iban: '', bic: '', bank_name: '',
  payment_terms_days: 14, quote_validity_days: 30, default_invoice_notes: '',
};

export default function SettingsPage() {
  const tSy = useTranslations('sy');
  const tCommon = useTranslations('common');
  const { locale, setLocale } = useAppLocale();
  const { settings, updateSettings } = useSettings();

  const [tab, setTab] = useState<Tab>('company');
  const [style, setStyle] = useState(settings.style);
  const [textSize, setTextSize] = useState(settings.textSize);
  const [density, setDensity] = useState(settings.density);
  const [highContrast, setHighContrast] = useState(settings.highContrast);
  const [navIcons, setNavIcons] = useState(settings.navIcons);
  const [compact, setCompact] = useState(settings.compact);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(settings.sidebarCollapsed);
  const [navGroupsExpanded, setNavGroupsExpanded] = useState(settings.navGroupsExpanded);
  const [language, setLanguage] = useState<'nl' | 'en' | 'tr'>(locale);
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [dateFormat, setDateFormat] = useState(settings.dateFormat);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [currency, setCurrency] = useState(settings.currency);
  const [saved, setSaved] = useState(false);

  const [notifLead, setNotifLead] = useState(settings.notifLead);
  const [notifStage, setNotifStage] = useState(settings.notifStage);
  const [notifEmail, setNotifEmail] = useState(settings.notifEmail);
  const [notifAppointment, setNotifAppointment] = useState(settings.notifAppointment);

  const [aiPhotoCheck, setAiPhotoCheck] = useState(false);
  const [aiKeyConfigured, setAiKeyConfigured] = useState(false);

  const [company, setCompany] = useState<CompanyData>(COMPANY_DEFAULTS);
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/company');
      if (res.ok) {
        const data = await res.json();
        setCompany({ ...COMPANY_DEFAULTS, ...data });
        if (data.logo_url) setLogoUrl(data.logo_url);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchAiConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/public/ai-config');
      if (res.ok) {
        const data = await res.json();
        setAiPhotoCheck(data.photo_check_enabled === true);
        setAiKeyConfigured(data.photo_check_enabled === true);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAiConfig(); fetchCompany(); }, [fetchAiConfig, fetchCompany]);

  async function handleSaveCompany() {
    setCompanySaving(true);
    try {
      await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      });
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 2000);
    } catch { /* ignore */ }
    setCompanySaving(false);
  }

  function updateCompany(field: keyof CompanyData, value: string | number) {
    setCompany(prev => ({ ...prev, [field]: value }));
  }

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/settings/logo', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data.url) {
        setLogoUrl(data.url);
      } else {
        alert(data.error ?? 'Upload failed');
      }
    } catch {
      alert('Upload failed — check connection');
    }
    setLogoUploading(false);
  }

  async function handleLogoDelete() {
    try {
      await fetch('/api/settings/logo', { method: 'DELETE' });
      setLogoUrl(null);
    } catch { /* ignore */ }
  }

  function handleSave() {
    if (language !== locale) {
      setLocale(language as 'nl' | 'en' | 'tr');
    }

    updateSettings({
      style,
      textSize,
      density,
      highContrast,
      navIcons,
      compact,
      sidebarCollapsed,
      navGroupsExpanded,
      companyName,
      dateFormat,
      timezone,
      currency,
      notifLead,
      notifStage,
      notifEmail,
      notifAppointment,
    });

    fetch('/api/settings/ai', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_check_enabled: aiPhotoCheck }),
    }).catch(() => {});

    setSaved(true);
    setTimeout(() => window.location.reload(), 800);
  }

  const STYLES = [
    { id: 'midnight', label: tSy('styleMidnight'), desc: tSy('styleMidnightDesc'), bg: '#101114', surface: '#16171b', surface2: '#1c1e23', border: '#26272c', accent: '#e11d48', textColor: '#e4e4e7' },
    { id: 'flat', label: tSy('styleFlat'), desc: tSy('styleFlatDesc'), bg: '#111827', surface: '#1f2937', surface2: '#283548', border: '#374151', accent: '#3b82f6', textColor: '#e5e7eb' },
    { id: 'corporate', label: tSy('styleCorporate'), desc: tSy('styleCorporateDesc'), bg: '#0c1222', surface: '#162032', surface2: '#1e2d42', border: '#1e3a5f', accent: '#0ea5e9', textColor: '#e0f2fe' },
    { id: 'soft', label: tSy('styleSoft'), desc: tSy('styleSoftDesc'), bg: '#18181b', surface: '#27272a', surface2: '#303035', border: '#3f3f46', accent: '#a78bfa', textColor: '#e4e4e7' },
    { id: 'polaris', label: tSy('stylePolaris'), desc: tSy('stylePolarisDesc'), bg: '#1a1f36', surface: '#2d3250', surface2: '#363c5e', border: '#3d4470', accent: '#6366f1', textColor: '#c7d2fe' },
    { id: 'glossy', label: tSy('styleGlossy'), desc: tSy('styleGlossyDesc'), bg: '#0a0a0f', surface: '#15151e', surface2: '#1c1c28', border: '#2a2a3a', accent: '#f43f5e', textColor: '#e4e4e7' },
    { id: 'clean', label: tSy('styleClean'), desc: tSy('styleCleanDesc'), bg: '#f8f9fa', surface: '#ffffff', surface2: '#f1f3f5', border: '#dee2e6', accent: '#e11d48', textColor: '#343a40' },
    { id: 'daylight', label: tSy('styleDaylight'), desc: tSy('styleDaylightDesc'), bg: '#faf8f5', surface: '#ffffff', surface2: '#f5f0ea', border: '#e0d5c7', accent: '#b45309', textColor: '#292524' },
    { id: 'arctic', label: tSy('styleArctic'), desc: tSy('styleArcticDesc'), bg: '#f0f4f8', surface: '#ffffff', surface2: '#e8eef4', border: '#c8d5e2', accent: '#1d4ed8', textColor: '#1e293b' },
  ];

  const TEXT_SIZES = [
    { id: 'small', label: tSy('textSmall') },
    { id: 'medium', label: tSy('textMedium') },
    { id: 'large', label: tSy('textLarge') },
  ];

  const DENSITIES = [
    { id: 'compact', label: tSy('densityCompact') },
    { id: 'comfortable', label: tSy('densityComfortable') },
    { id: 'spacious', label: tSy('densitySpacious') },
  ];

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'company', label: tSy('companyTab'), icon: Building2 },
    { id: 'email', label: tSy('emailTab'), icon: Mail },
    { id: 'appearance', label: tSy('appearance'), icon: Palette },
    { id: 'general', label: tSy('general'), icon: Globe },
    { id: 'notifications', label: tSy('notifications'), icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="SY01" />
        <h1 className="font-display text-2xl font-bold text-white">{tSy('title')}</h1>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                tab === t.id
                  ? 'bg-ck-red/10 text-ck-red'
                  : 'text-ck-muted-light hover:bg-ck-dark-border/50 hover:text-white'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Company tab */}
          {tab === 'company' && (
            <>
              {/* Identity */}
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Building2 size={16} /> {tSy('companyIdentity')}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('companyName')}</label>
                    <input type="text" value={company.name} onChange={e => updateCompany('name', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('legalName')}</label>
                    <input type="text" value={company.legal_name} onChange={e => updateCompany('legal_name', e.target.value)}
                      placeholder="Autospuitbedrijf Colour King"
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white placeholder:text-ck-muted/50 focus:border-ck-red focus:outline-none" />
                  </div>
                </div>
              </section>

              {/* Address */}
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Globe size={16} /> {tSy('companyAddress')}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('street')}</label>
                    <input type="text" value={company.address} onChange={e => updateCompany('address', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('postcode')}</label>
                    <input type="text" value={company.postcode} onChange={e => updateCompany('postcode', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('cityLabel')}</label>
                    <input type="text" value={company.city} onChange={e => updateCompany('city', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('countryLabel')}</label>
                    <input type="text" value={company.country} onChange={e => updateCompany('country', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('phoneLabel')}</label>
                    <input type="text" value={company.phone} onChange={e => updateCompany('phone', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('emailLabel')}</label>
                    <input type="email" value={company.email} onChange={e => updateCompany('email', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('websiteLabel')}</label>
                    <input type="url" value={company.website} onChange={e => updateCompany('website', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                </div>
              </section>

              {/* Legal & Tax */}
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Landmark size={16} /> {tSy('legalTax')}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('kvkNumber')}</label>
                    <input type="text" value={company.kvk} onChange={e => updateCompany('kvk', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('vatNumber')}</label>
                    <input type="text" value={company.vat_number} onChange={e => updateCompany('vat_number', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                </div>
              </section>

              {/* Banking */}
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <CreditCard size={16} /> {tSy('banking')}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('ibanLabel')}</label>
                    <input type="text" value={company.iban} onChange={e => updateCompany('iban', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('bicLabel')}</label>
                    <input type="text" value={company.bic} onChange={e => updateCompany('bic', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('bankName')}</label>
                    <input type="text" value={company.bank_name} onChange={e => updateCompany('bank_name', e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                </div>
              </section>

              {/* Document defaults */}
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <FileText size={16} /> {tSy('documentDefaults')}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('paymentTermsDays')}</label>
                    <input type="number" min={1} max={90} value={company.payment_terms_days} onChange={e => updateCompany('payment_terms_days', parseInt(e.target.value) || 14)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('quoteValidityDays')}</label>
                    <input type="number" min={1} max={90} value={company.quote_validity_days} onChange={e => updateCompany('quote_validity_days', parseInt(e.target.value) || 30)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('defaultInvoiceNotes')}</label>
                    <textarea value={company.default_invoice_notes} onChange={e => updateCompany('default_invoice_notes', e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none" />
                  </div>
                </div>
              </section>

              {/* Save button for company */}
              <div className="flex items-center gap-3">
                <button onClick={handleSaveCompany} disabled={companySaving}
                  className="flex items-center gap-2 rounded-lg bg-ck-red px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ck-red-hover disabled:opacity-50">
                  <Settings size={14} />
                  {companySaving ? tSy('saving') : tCommon('save')}
                </button>
                {companySaved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-400">
                    <Check size={14} /> {tSy('saved')}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Email tab */}
          {tab === 'email' && <EmailSettingsTab />}

          {/* Appearance tab */}
          {tab === 'appearance' && (
            <>
              {/* Style */}
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Palette size={16} /> {tSy('styleLabel')}
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setStyle(s.id); updateSettings({ ...settings, style: s.id }); }}
                      className={`group relative rounded-xl border-2 p-3 transition-all ${
                        style === s.id
                          ? 'border-ck-red'
                          : 'border-ck-dark-border hover:border-ck-muted/50'
                      }`}
                    >
                      {/* Mini dashboard preview */}
                      <div className="mb-3 flex h-24 overflow-hidden rounded-lg" style={{ backgroundColor: s.bg }}>
                        {/* Sidebar */}
                        <div className="flex w-7 shrink-0 flex-col items-center gap-1.5 py-2" style={{ backgroundColor: s.surface }}>
                          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.accent }} />
                          <div className="h-1.5 w-3 rounded-sm" style={{ backgroundColor: s.border }} />
                          <div className="h-1.5 w-3 rounded-sm" style={{ backgroundColor: s.border }} />
                          <div className="h-1.5 w-3 rounded-sm" style={{ backgroundColor: s.border }} />
                          <div className="h-1.5 w-3 rounded-sm" style={{ backgroundColor: s.border }} />
                        </div>
                        {/* Main area */}
                        <div className="flex flex-1 flex-col gap-1.5 p-2">
                          {/* Header bar */}
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-10 rounded-sm" style={{ backgroundColor: s.accent, opacity: 0.8 }} />
                            <div className="flex-1" />
                            <div className="h-2 w-6 rounded-sm" style={{ backgroundColor: s.accent }} />
                          </div>
                          {/* Stat cards row */}
                          <div className="flex gap-1">
                            {[0.9, 0.7, 0.5].map((o, i) => (
                              <div key={i} className="flex-1 rounded-sm p-1" style={{ backgroundColor: s.surface }}>
                                <div className="mb-0.5 h-1" style={{ backgroundColor: s.accent, opacity: o, width: `${60 + i * 15}%` }} />
                                <div className="h-2.5 w-3/4 rounded-sm" style={{ backgroundColor: s.border, opacity: 0.5 }} />
                              </div>
                            ))}
                          </div>
                          {/* Table rows */}
                          <div className="flex flex-col gap-0.5 rounded-sm p-1" style={{ backgroundColor: s.surface }}>
                            {[1, 0.7, 0.5].map((o, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <div className="h-1 w-1 rounded-full" style={{ backgroundColor: s.accent, opacity: o }} />
                                <div className="h-1 flex-1 rounded-sm" style={{ backgroundColor: s.border, opacity: 0.4 }} />
                                <div className="h-1 w-3 rounded-sm" style={{ backgroundColor: s.surface2 }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{s.label}</div>
                        <div className="text-xs text-ck-muted">{s.desc}</div>
                      </div>
                      {style === s.id && (
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ck-red">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* Display & Accessibility */}
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Maximize2 size={16} /> {tSy('displayAccessibility')}
                </h2>
                <div className="space-y-5">
                  {/* Text size */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Type size={14} className="text-ck-muted" />
                      <span className="text-sm text-white">{tSy('textSizeLabel')}</span>
                    </div>
                    <div className="flex gap-2">
                      {TEXT_SIZES.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setTextSize(s.id)}
                          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                            textSize === s.id
                              ? 'border-ck-red bg-ck-red/10 text-ck-red'
                              : 'border-ck-dark-border text-ck-muted-light hover:border-ck-muted/50 hover:text-white'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Density */}
                  <div>
                    <div className="mb-2">
                      <span className="text-sm text-white">{tSy('densityLabel')}</span>
                      <p className="text-xs text-ck-muted">{tSy('densityDesc')}</p>
                    </div>
                    <div className="flex gap-2">
                      {DENSITIES.map(d => (
                        <button
                          key={d.id}
                          onClick={() => setDensity(d.id)}
                          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                            density === d.id
                              ? 'border-ck-red bg-ck-red/10 text-ck-red'
                              : 'border-ck-dark-border text-ck-muted-light hover:border-ck-muted/50 hover:text-white'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* High contrast */}
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">{tSy('highContrast')}</div>
                      <div className="text-xs text-ck-muted">{tSy('highContrastDesc')}</div>
                    </div>
                    <button
                      onClick={() => setHighContrast(!highContrast)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        highContrast ? 'bg-ck-red' : 'bg-ck-dark-border'
                      }`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${highContrast ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </label>

                  {/* Nav icons */}
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">{tSy('navIconsLabel')}</div>
                      <div className="text-xs text-ck-muted">{tSy('navIconsDesc')}</div>
                    </div>
                    <button
                      onClick={() => setNavIcons(!navIcons)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        navIcons ? 'bg-ck-red' : 'bg-ck-dark-border'
                      }`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${navIcons ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </label>

                  {/* Compact mode */}
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">{tSy('compactMode')}</div>
                      <div className="text-xs text-ck-muted">{tSy('compactDesc')}</div>
                    </div>
                    <button
                      onClick={() => setCompact(!compact)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        compact ? 'bg-ck-red' : 'bg-ck-dark-border'
                      }`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${compact ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </label>

                  {/* Sidebar collapsed */}
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">{tSy('sidebarStartCollapsed')}</div>
                      <div className="text-xs text-ck-muted">{tSy('sidebarDesc')}</div>
                    </div>
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        sidebarCollapsed ? 'bg-ck-red' : 'bg-ck-dark-border'
                      }`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${sidebarCollapsed ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </label>

                  {/* Nav groups expanded */}
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">{tSy('navGroupsExpanded')}</div>
                      <div className="text-xs text-ck-muted">{tSy('navGroupsExpandedDesc')}</div>
                    </div>
                    <button
                      onClick={() => setNavGroupsExpanded(!navGroupsExpanded)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        navGroupsExpanded ? 'bg-ck-red' : 'bg-ck-dark-border'
                      }`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${navGroupsExpanded ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                </div>
              </section>
            </>
          )}

          {/* General tab */}
          {tab === 'general' && (
            <>
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Building2 size={16} /> {tSy('companyInfo')}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('companyName')}</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('companyLogo')}</label>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                        e.target.value = '';
                      }}
                    />
                    {logoUrl ? (
                      <div className="flex items-center gap-4">
                        <div className="flex h-20 w-40 items-center justify-center rounded-lg border border-ck-dark-border bg-ck-dark-surface p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs text-ck-muted-light hover:border-ck-muted/50 hover:text-white transition-colors"
                          >
                            <Upload size={12} /> {tSy('changeLogo')}
                          </button>
                          <button
                            onClick={handleLogoDelete}
                            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={12} /> {tSy('removeLogo')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={logoUploading}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                        className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ck-dark-border text-sm text-ck-muted transition-colors hover:border-ck-muted/50 hover:text-white disabled:opacity-50"
                      >
                        {logoUploading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-ck-dark-border border-t-ck-red" />
                        ) : (
                          <ImageIcon size={16} />
                        )}
                        {logoUploading ? tSy('uploading') : tSy('uploadLogo')}
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Globe size={16} /> {tSy('regionLang')}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('language')}</label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value as 'nl' | 'en' | 'tr')}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
                    >
                      <option value="nl">Nederlands</option>
                      <option value="en">English</option>
                      <option value="tr">Turkce</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('dateFormat')}</label>
                    <select
                      value={dateFormat}
                      onChange={e => setDateFormat(e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
                    >
                      <option value="dd-MM-yyyy">24-08-2026</option>
                      <option value="MM/dd/yyyy">08/24/2026</option>
                      <option value="yyyy-MM-dd">2026-08-24</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('timezone')}</label>
                    <select
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
                    >
                      <option value="Europe/Amsterdam">Europe/Amsterdam (CET)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Europe/Istanbul">Europe/Istanbul (TRT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('currency')}</label>
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
                    >
                      <option value="EUR">EUR (&#8364;)</option>
                      <option value="GBP">GBP (&#163;)</option>
                      <option value="TRY">TRY (&#8378;)</option>
                    </select>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Notifications tab */}
          {tab === 'notifications' && (
            <>
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Bell size={16} /> {tSy('notifPrefs')}
                </h2>
                <p className="mb-4 text-xs text-ck-muted">
                  {tSy('notifPrefsDesc')}
                </p>
                <div className="space-y-4">
                  {[
                    { label: tSy('notifLeadLabel'), desc: tSy('notifLeadDesc'), state: notifLead, set: setNotifLead },
                    { label: tSy('notifStageLabel'), desc: tSy('notifStageDesc'), state: notifStage, set: setNotifStage },
                    { label: tSy('notifEmailLabel'), desc: tSy('notifEmailDesc'), state: notifEmail, set: setNotifEmail },
                    { label: tSy('notifAppointLabel'), desc: tSy('notifAppointDesc'), state: notifAppointment, set: setNotifAppointment },
                  ].map(n => (
                    <label key={n.label} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white">{n.label}</div>
                        <div className="text-xs text-ck-muted">{n.desc}</div>
                      </div>
                      <button
                        onClick={() => n.set(!n.state)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          n.state ? 'bg-ck-red' : 'bg-ck-dark-border'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            n.state ? 'translate-x-[22px]' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Bot size={16} /> {tSy('aiSettings')}
                </h2>
                <p className="mb-4 text-xs text-ck-muted">
                  {tSy('aiSettingsDesc')}
                </p>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">{tSy('aiPhotoCheckLabel')}</div>
                      <div className="text-xs text-ck-muted">{tSy('aiPhotoCheckDesc')}</div>
                    </div>
                    <button
                      onClick={() => setAiPhotoCheck(!aiPhotoCheck)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        aiPhotoCheck ? 'bg-ck-red' : 'bg-ck-dark-border'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          aiPhotoCheck ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </label>
                  {!aiKeyConfigured && (
                    <p className="text-xs text-yellow-400">
                      {tSy('aiKeyMissing')}
                    </p>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Save button (company and email tabs have their own) */}
          {tab !== 'company' && tab !== 'email' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg bg-ck-red px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ck-red-hover"
              >
                <Settings size={14} />
                {tCommon('save')}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-400">
                  <Check size={14} /> {tSy('saved')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
