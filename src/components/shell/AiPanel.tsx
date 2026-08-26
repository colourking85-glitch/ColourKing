'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X, Send, Sparkles, MessageSquare } from 'lucide-react';
import { getScreen } from '@/lib/codes';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function AiPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useTranslations('aiPanel');
  const pathname = usePathname();
  const screen = getScreen(pathname);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    function onToggle() { setOpen(v => !v); }
    window.addEventListener('toggle-ai-panel', onToggle);
    return () => window.removeEventListener('toggle-ai-panel', onToggle);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: { screen: screen?.id, pathname },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: t('noApiKey') }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t('noApiKey') }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestion(key: string) {
    const text = t(`suggestions.${key}`);
    setInput(text);
    setTimeout(() => handleSend(), 0);
  }

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 z-[90] flex h-full w-96 flex-col border-l border-ck-dark-border bg-ck-dark-surface shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ck-dark-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-ck-red" />
          <span className="text-sm font-semibold text-white">{t('title')}</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="flex h-6 w-6 items-center justify-center rounded text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      {/* Context badge */}
      {screen && (
        <div className="flex items-center gap-2 border-b border-ck-dark-border px-4 py-2">
          <ScreenBadge id={screen.id} />
          <span className="text-[11px] text-white/40">{screen.titleNl}</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ck-red/10">
              <Sparkles size={24} className="text-ck-red" />
            </div>
            <p className="mt-4 text-sm text-white/60">{t('welcome')}</p>
            <div className="mt-6 flex flex-col gap-2 w-full">
              {(['summarize', 'draftEmail', 'nextActions'] as const).map(key => (
                <button
                  key={key}
                  onClick={() => handleSuggestion(key)}
                  className="rounded-md border border-ck-dark-border px-3 py-2 text-left text-xs text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80"
                >
                  {t(`suggestions.${key}`)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-ck-red/90 text-white'
                      : 'bg-white/[0.06] text-white/80'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-white/[0.06] px-3 py-2 text-[13px] text-white/40">
                  <span className="inline-flex gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-ck-dark-border p-3">
        <form
          onSubmit={e => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('placeholder')}
            className="flex-1 rounded-md border border-ck-dark-border bg-ck-dark px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-ck-red/40"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-ck-red text-white transition-colors hover:bg-ck-red-hover disabled:opacity-30"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
