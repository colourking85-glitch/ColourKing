import { describe, it, expect } from 'vitest';
import { leadTag, withLeadTag, extractReply } from '@/modules/email/lead-thread';

describe('lead email tag', () => {
  it('pads the lead number', () => {
    expect(leadTag(18)).toBe('[LD-0018]');
  });

  it('adds the tag once, even when the subject already has one', () => {
    expect(withLeadTag('Uw aanvraag', 18)).toBe('[LD-0018] Uw aanvraag');
    expect(withLeadTag('Re: [LD-0018] Uw aanvraag', 18)).toBe('[LD-0018] Re: Uw aanvraag');
  });

  it('matches the IMAP poller subject pattern', () => {
    const m = withLeadTag('Re: offerte', 7).match(/\[(?:(JB|LD|FA|ES)-)?#?(\d{1,10})\]/i);
    expect(m?.[1]).toBe('LD');
    expect(parseInt(m![2])).toBe(7);
  });
});

describe('extractReply', () => {
  it('drops quoted history after an "On ... wrote:" line', () => {
    const text = 'Dat is goed, tot morgen.\n\nOn Tue, 22 Sep 2026 at 10:00, Colourking <sales@colourking.nl> wrote:\n> Uw afspraak staat gepland';
    expect(extractReply(text)).toBe('Dat is goed, tot morgen.');
  });

  it('handles the Dutch "Op ... schreef:" marker', () => {
    const text = 'Prima!\nOp di 22 sep 2026 om 10:00 schreef Colourking:\n> tekst';
    expect(extractReply(text)).toBe('Prima!');
  });

  it('skips > quoted lines', () => {
    expect(extractReply('> oud\nnieuw')).toBe('nieuw');
  });

  it('keeps a plain message intact', () => {
    expect(extractReply('Hallo,\n\nkan het ook vrijdag?')).toBe('Hallo,\n\nkan het ook vrijdag?');
  });
});
