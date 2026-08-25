'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Settings, Palette, Globe, Building2, Bell, Check } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { useAppLocale } from '@/components/AdminIntlProvider';

type Tab = 'appearance' | 'general' | 'notifications';

export default function SettingsPage() {
  const tSy = useTranslations('sy');
  const tCommon = useTranslations('common');
  const { locale, setLocale } = useAppLocale();
  const [tab, setTab] = useState<Tab>('appearance');
  const [accent, setAccent] = useState('#E8364E');
  const [theme, setTheme] = useState('dark');
  const [compact, setCompact] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [language, setLanguage] = useState<'nl' | 'en' | 'tr'>(locale);
  const [companyName, setCompanyName] = useState('Colourking');
  const [dateFormat, setDateFormat] = useState('dd-MM-yyyy');
  const [saved, setSaved] = useState(false);

  const [notifLead, setNotifLead] = useState(true);
  const [notifStage, setNotifStage] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifAppointment, setNotifAppointment] = useState(false);

  function handleSave() {
    if (language !== locale) {
      setLocale(language as 'nl' | 'en' | 'tr');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const ACCENT_COLORS = [
    { name: tSy('colorRed'), value: '#E8364E', class: 'bg-[#E8364E]' },
    { name: tSy('colorBlue'), value: '#3B82F6', class: 'bg-blue-500' },
    { name: tSy('colorGreen'), value: '#22C55E', class: 'bg-green-500' },
    { name: tSy('colorOrange'), value: '#F97316', class: 'bg-orange-500' },
    { name: tSy('colorPurple'), value: '#A855F7', class: 'bg-purple-500' },
    { name: tSy('colorCyan'), value: '#06B6D4', class: 'bg-cyan-500' },
  ];

  const THEMES = [
    { id: 'dark', label: tSy('themeDark'), desc: tSy('themeDescDark'), preview: 'bg-[#0f0f12]' },
    { id: 'light', label: tSy('themeLight'), desc: tSy('themeDescLight'), preview: 'bg-gray-100', disabled: true },
    { id: 'system', label: tSy('themeSystem'), desc: tSy('themeDescSystem'), preview: 'bg-gradient-to-r from-[#0f0f12] to-gray-100', disabled: true },
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
              {/* Theme */}
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Palette size={16} /> {tSy('theme')}
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      disabled={t.disabled}
                      onClick={() => !t.disabled && setTheme(t.id)}
                      className={`group relative rounded-xl border-2 p-3 transition-all ${
                        theme === t.id
                          ? 'border-ck-red'
                          : t.disabled
                          ? 'cursor-not-allowed border-ck-dark-border opacity-40'
                          : 'border-ck-dark-border hover:border-ck-muted/50'
                      }`}
                    >
                      <div className={`mb-3 h-16 rounded-lg ${t.preview}`} />
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{t.label}</div>
                        <div className="text-xs text-ck-muted">{t.desc}</div>
                      </div>
                      {theme === t.id && (
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ck-red">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      {t.disabled && (
                        <span className="absolute right-2 top-2 rounded bg-ck-dark-border px-1.5 py-0.5 text-[9px] font-bold uppercase text-ck-muted">
                          {tCommon('soon')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* Accent Color */}
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 text-sm font-semibold text-white">{tSy('accentColor')}</h2>
                <div className="flex gap-3">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setAccent(c.value)}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full ${c.class} transition-transform hover:scale-110 ${
                        accent === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-ck-dark' : ''
                      }`}
                      title={c.name}
                    >
                      {accent === c.value && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ck-muted">
                  {tSy('accentDesc')}
                </p>
              </section>

              {/* Display */}
              <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
                <h2 className="mb-4 text-sm font-semibold text-white">{tSy('displayOptions')}</h2>
                <div className="space-y-4">
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
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          compact ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </label>
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
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          sidebarCollapsed ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                      />
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
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
                      defaultValue="Europe/Amsterdam"
                    >
                      <option value="Europe/Amsterdam">Europe/Amsterdam (CET)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Europe/Istanbul">Europe/Istanbul (TRT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('currency')}</label>
                    <select
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
                      defaultValue="EUR"
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
