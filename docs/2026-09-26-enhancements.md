# Enhancements shipped 2026-09-26

All items are live on production and documented in SY10 (manual + per-screen help panel, single source: `src/lib/screen-docs.ts`).

| Area | Screen(s) | What changed | Ops needed |
|---|---|---|---|
| Agenda views | AP05 | Day / 3-day / week / month views | — |
| Company settings + logo | SY01 Company | All company fields, logo upload (`company-assets` bucket) | migrations 0060, 0061 (done) |
| Light themes | SY01 Appearance | Clean, Daylight, Arctic; instant switch | — |
| Customer 360 | KL01/02/03/05 | 11 types, 5 statuses, 9-tab detail | migrations 0058, 0059 (done) |
| Sender identities + BCC | SY01 E-mail | Per-process From address (offer@, invoice@, planning@, customer@, info@), reply-to, BCC, "Send test" | Zoho send-as aliases; verified on prod for invoice@ and info@ |
| Automatic reminders | SY01 E-mail, SY60, SY15 | Invoice due-soon (T-2) / overdue (+2, auto-marks overdue), quote expiring (T-2), appointment (T-1), vehicle-ready catch-up; `reminder_log`; Vercel cron 07:00 UTC | migration 0063 (done); `CRON_SECRET` already set |
| Manual send buttons | ES10, FA10, AP10, DO21, JB10 | Resend offer / invoice / payment reminder / confirmation / appointment reminder / handover sign link / "car ready" — confirm dialog + last-sent | — |
| Outbound email log | SY25 "Verzonden e-mails" | Every sent email (all paths incl. tests) in `email_log`, with status/error | — |
| Reminder moments | SY01 E-mail, SY15, SY60 | Up to 2 moments per event in hours or days (default appointment 24 h + 2 h before); time-based idempotent engine safe every 15 min; SY15 shows last run + trigger; external cron-job.org scheduler documented | cron-job.org job: POST /api/cron/reminders every 15 min with Bearer CRON_SECRET |
| Planning views | TS10 | Day / 3-day / week / month toggle; closed days marked | — |
| Docs | SY10 + help panel | Manual and per-screen help now share src/lib/screen-docs.ts; all 65 screens documented | — |
| Off days | SY06, AP05, AP01, public wizard, website banner, leads | Closures block booking (409), hatch the agenda, auto "we are closed" reply, Won override | migration 0064 (done) |
| Hardening | — | Admin guard on settings PUTs, cron routes fail closed without `CRON_SECRET`, dead approve/cancel email links → `/contact` | — |

## Verified on production
- Sender test: `invoice@colourking.nl` and `info@colourking.nl` accepted by Zoho, rows in `email_log` with Message-IDs.
- Off days e2e (same DB via dev server): closure → 0 slots, public submit 409 with `next_open`, admin create 409 unless `force`, delete restores.

## Known follow-ups
- Public offer approve/reject page (`offers.approval_token`) — email buttons currently go to `/contact?ref=`.
- TS10 utilisation and portfolio "working days" ignore closures.
- `tests/schema.test.ts` › "accepts all customer types" fails (pre-existing, Customer 360 enum).
