'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Settings, Palette, Globe, Building2, Bell, Check, Type, Maximize2, Bot } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { useAppLocale } from '@/components/AdminIntlProvider';
import { useSettings } from '@/components/SettingsProvider';

type Tab = 'appearance' | 'general' | 'notifications';

export default function SettingsPage() {
  const tSy = useTranslations('sy');
  const tCommon = useTranslations('common');
  const { locale, setLocale } = useAppLocale();
  const { settings, updateSettings } = useSettings();

  const [tab, setTab] = useState<Tab>('appearance');
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

  const [notifLead, setNotifLead] = useState(true);
  const [notifStage, setNotifStage] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifAppointment, setNotifAppointment] = useState(false);

  const [aiPhotoCheck, setAiPhotoCheck] = useState(false);
  const [aiKeyConfigured, setAiKeyConfigured] = useState(false);

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

  useEffect(() => { fetchAiConfig(); }, [fetchAiConfig]);

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
    });

    fetch('/api/settings/ai', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_check_enabled: aiPhotoCheck }),
    }).catch(() => {});

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const STYLES = [
    { id: 'midnight', label: tSy('styleMidnight'), desc: tSy('styleMidnightDesc'), colors: ['#0f0f12', '#1a1a24', '#E8364E', '#6b7280'] },
    { id: 'flat', label: tSy('styleFlat'), desc: tSy('styleFlatDesc'), colors: ['#111827', '#1f2937', '#3b82f6', '#9ca3af'] },
    { id: 'corporate', label: tSy('styleCorporate'), desc: tSy('styleCorporateDesc'), colors: ['#0c1222', '#162032', '#0ea5e9', '#64748b'] },
    { id: 'soft', label: tSy('styleSoft'), desc: tSy('styleSoftDesc'), colors: ['#18181b', '#27272a', '#a78bfa', '#a1a1aa'] },
    { id: 'polaris', label: tSy('stylePolaris'), desc: tSy('stylePolarisDesc'), colors: ['#1a1f36', '#2d3250', '#6366f1', '#94a3b8'] },
    { id: 'glossy', label: tSy('styleGlossy'), desc: tSy('styleGlossyDesc'), colors: ['#0a0a0f', '#15151e', '#f43f5e', '#71717a'], disabled: true },
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
    { id: 'appearance', label: tSy('appearance'), icon: Palette },
    { id: 'general', label: tSy('general'), icon: Building2 },
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
                      disabled={s.disabled}
                      onClick={() => !s.disabled && setStyle(s.id)}
                      className={`group relative rounded-xl border-2 p-3 transition-all ${
                        style === s.id
                          ? 'border-ck-red'
                          : s.disabled
                          ? 'cursor-not-allowed border-ck-dark-border opacity-40'
                          : 'border-ck-dark-border hover:border-ck-muted/50'
                      }`}
                    >
                      <div className="mb-3 flex h-16 items-end gap-1 overflow-hidden rounded-lg p-2" style={{ backgroundColor: s.colors[0] }}>
                        <div className="h-full w-3 rounded-sm" style={{ backgroundColor: s.colors[1] }} />
                        <div className="flex flex-1 flex-col gap-1 pl-1">
                          <div className="h-2 w-3/4 rounded-sm" style={{ backgroundColor: s.colors[2] }} />
                          <div className="h-1.5 w-full rounded-sm" style={{ backgroundColor: s.colors[3], opacity: 0.4 }} />
                          <div className="h-1.5 w-5/6 rounded-sm" style={{ backgroundColor: s.colors[3], opacity: 0.25 }} />
                          <div className="h-1.5 w-2/3 rounded-sm" style={{ backgroundColor: s.colors[3], opacity: 0.15 }} />
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
                      {s.disabled && (
                        <span className="absolute right-2 top-2 rounded bg-ck-dark-border px-1.5 py-0.5 text-[9px] font-bold uppercase text-ck-muted">
                          {tCommon('soon')}
                        </span>
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
                    <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-ck-dark-border text-sm text-ck-muted transition-colors hover:border-ck-muted/50">
                      {tSy('uploadLogo')}
                    </div>
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

          {/* Save button */}
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
        </div>
      </div>
    </div>
  );
}
