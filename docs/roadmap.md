# Colourking Roadmap

## Sprint 0 — Foundation (done)
- Next.js 14 App Router + Supabase + Tailwind
- Admin shell with dark theme, sidebar, i18n (nl/en/tr)
- Auth scaffolding (dev bypass mode)
- Screen registry, ScreenBadge component

## Sprint 1 — Core Data (done)
- Customers CRUD (KL01/KL05/KL02)
- Vehicles CRUD + RDW lookup (VH01/VH05)
- Leads inbox + pipeline (LD01/LD05/LD10)
- API routes with null-stripping, anon RLS policies

## Sprint 2 — Jobs + Photos (done)
- Jobs state machine: 10 stages (intake → closed)
- Job CRUD + events audit trail (JB01/JB05/JB10)
- Workshop board / kanban view (JB15)
- Job photos (before/during/after) via Supabase Storage
- Migration 0008 applied

## Sprint 2.5 — Nav, Settings & Notifications (done)
- Sidebar: flyout submenus, nested items, collapsible sections, role filtering, coming-soon badges
- Header: Quick Create dropdown, notification bell with unread badge, System menu, Cmd-K palette
- Settings page (SY01): theme, accent colour, compact mode, sidebar toggle, company info, locale, notifications
- Monitoring screen (SY05): real-time notification feed, filters, stats, sound alerts, auto-refresh
- Notification system: notifications table (migration 0009), API (GET/POST/PATCH), mark read/all read
- Header bell polls API every 15s, monitoring page polls every 10s
- vercel.json added to fix Vercel build output directory issue

## Sprint 3 — Estimates & Invoicing
- Offer/estimate builder (ES01/ES05)
- Line items, labour hours, paint materials
- PDF generation (offer document)
- Invoice generation from completed jobs (FA05)
- VAT calculation (21% / 0% margin scheme)

## Sprint 4 — Planning & Appointments
- Appointment calendar (AP05)
- Workshop planner / timesheet (TS10)
- Staff assignment per job stage
- Parts ordering tracker (PT05)

## Sprint 5 — Auth & Multi-tenant
- Supabase Auth (email/password for staff)
- Role-based access (eigenaar, planner, spuiter, admin)
- RLS policies per role (replace dev anon policies)
- Invite flow for new staff

## Sprint 6 — Documents & Reports
- Document archive (DO05) — offers, invoices, photos
- Supabase Storage integration
- Reports dashboard (RP10) — revenue, jobs/month, avg cycle time
- VAT period management (BW05)

## Sprint 7 — Public Website (colourking.nl)
- Landing page: hero, services, gallery, contact form
- SEO: metadata, OpenGraph, structured data
- Contact form → creates Lead in admin
- Photo gallery from completed jobs
- Google Maps embed, opening hours
- Mobile-responsive design
- Deploy to Vercel with colourking.nl domain

## Sprint 8 — Polish & Go-live
- Customer portal (track job status by link)
- Email notifications (stage changes, appointment reminders)
- WhatsApp integration (optional)
- Performance audit, Lighthouse score
- Production deploy, DNS cutover
