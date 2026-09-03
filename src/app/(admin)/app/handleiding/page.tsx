'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpenCheck, Bot, ChevronRight, ChevronDown, GitBranch } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { BusinessFlowChart } from '@/components/ui/BusinessFlowChart';
import { SCREEN_REGISTRY } from '@/lib/codes';

type Tab = 'agent' | 'user' | 'flow';

const MODULES = [
  {
    id: 'leads',
    code: 'LD',
    screens: [
      {
        code: 'LD05',
        agentNotes: 'GET /api/leads — returns array. Filter by status query param. Statuses: new, contacted, quoted, won, lost. Sortable by date, name, status. Supports search by name/email/phone.',
        userFlow: 'The Leads Inbox shows all incoming customer requests in a sortable table. Columns show contact name, source, status badge, preferred date, and created date. Use the status filter tabs at the top (All, New, Contacted, Quoted, Won, Lost) to narrow results. Click column headers to sort. Search by name, email, or phone. Click a row to open the lead detail. Leads can also arrive from the public website booking wizard (/afspraak) and contact form (/contact).',
        inputs: 'Search query, status filter tabs, column sort.',
        outputs: 'Filtered and sorted lead table with inline status badges.',
        crossScreen: 'A lead can be converted to a Customer (KL01) and Vehicle (VH01) from the detail page. When a lead is marked "quoted", an Offer (ES01) can be created from it. The lead ID is stored on the offer for traceability. Public booking wizard (AP) and contact form create leads automatically.',
      },
      {
        code: 'LD01',
        agentNotes: 'POST /api/leads — body: { source, locale, name, email?, phone?, kenteken?, preferred_date?, damage_description? }. Returns created lead.',
        userFlow: 'Fill in the contact form. Only the name is required. Select the source (website, phone, email, walk-in, referral). Submit to create the lead. You are redirected to the Leads Inbox.',
        inputs: 'Source (dropdown), locale, name, email, phone, kenteken, preferred date, damage description.',
        outputs: 'New lead with status "new".',
        crossScreen: 'Created lead appears in Leads Inbox (LD05). If a kenteken is provided, it can later auto-link to a vehicle via RDW lookup.',
      },
      {
        code: 'LD10',
        agentNotes: 'GET /api/leads/[id]. PATCH /api/leads/[id] for status transitions. Allowed transitions: new→contacted|lost, contacted→quoted|lost, quoted→won|lost. Lost requires lost_reason. POST /api/leads/[id]/photos — multipart upload. Photos stored in Supabase Storage.',
        userFlow: 'View full lead details. The header shows the current status with transition buttons. Click "Contacted" to mark follow-up done. Click "Quoted" after sending an offer. Click "Won" when the job is confirmed. Click "Lost" to close — you must enter a reason.\n\nUse the sidebar buttons to create a customer or offer from this lead.\n\nFor Offerte-Web leads: All submitted fields are displayed including service type, location preference, vehicle details (kenteken, make, model, year, colour from RDW lookup or manual VIN/paint code entry), and damage description.\n\nPhoto gallery: Upload damage photos (supports mobile camera capture on Android/iOS). Click a photo to open the zoomable viewer with pan and zoom controls. Photos from the offerte form include AI quality evaluation scores.\n\nEmail reply: Send a direct email reply to the customer from the lead detail page. The reply is logged in the lead timeline.',
        inputs: 'Status transition (button click). Lost reason (text, required when marking lost). Photo upload (camera/file). Email reply (text).',
        outputs: 'Updated lead status. Photo gallery with zoomable viewer and AI scores. Email reply log. Full offerte submission details for Offerte-Web leads. When creating customer/offer from lead, the new records link back to this lead.',
        crossScreen: 'Creates Customer (KL01), Vehicle (VH01), or Offer (ES01). Status changes trigger stage_change notifications (SY05). Lost reason is stored for conversion analytics (RP10). Photos are compatible with Android and iOS mobile browsers. AI photo scores from Offerte page visible here.',
      },
    ],
  },
  {
    id: 'inspections',
    code: 'IN',
    screens: [
      {
        code: 'IN05',
        agentNotes: 'GET /api/inspections — returns array. Filter by status (draft/in_progress/review/locked). Searchable by reference or kenteken. Status cards show counts per status.',
        userFlow: 'Browse all inspections in a searchable table. The top row shows four status cards: Bezig (in progress), Ter akkoord (review), Vergrendeld (locked), and Totaal (total count). Table columns show reference number, vehicle (kenteken, make/model), status badge, finding and photo counts, total hours, inspector name, and date. Search by reference or kenteken. Click a row to open the inspection detail.',
        inputs: 'Search query, status filter dropdown.',
        outputs: 'Filtered inspection list with status counts.',
        crossScreen: 'Each row links to Inspection Detail (IN10). New inspections are created via the 7-step wizard (IN01). Locked inspections have a report available at IN15.',
      },
      {
        code: 'IN01',
        agentNotes: 'POST /api/inspections — multi-step wizard with 7 steps: vehicle selection, RDW lookup, incident details, guided photo capture (12 positions), findings entry (catalog-driven), summary review, and lock/sign. Creates inspection with findings, photos, and optional approval in one flow.',
        userFlow: 'Seven-step inspection creation wizard:\n1. Vehicle: Select existing vehicle or enter kenteken for RDW lookup.\n2. RDW Data: Review and confirm auto-filled vehicle data (make, model, VIN, fuel, first registration).\n3. Incident: Enter event date, description, insurer name, claim number, and purpose.\n4. Photos: Guided photo capture with 12 fixed positions (front, rear, sides, dashboard, VIN plate, etc.). Each position shows an example overlay.\n5. Findings: Add damage findings using the component and damage type catalogs. Set severity, disposition, repair technique, hours, parts, and flags (hidden damage, ADAS).\n6. Summary: Review all entered data. Auto-calculated totals for repair hours, paint hours, and indicative amount.\n7. Lock & Sign: Inspector signs electronically. Optional customer signature. Creates snapshot hash and locks the inspection.\n\nThe wizard supports standalone use at ins.colourking.nl for field inspections.',
        inputs: 'Vehicle selection or kenteken, RDW data confirmation, incident details, guided photos (12 positions), findings (component, damage, severity, disposition, hours, parts, flags), inspector signature, optional customer signature.',
        outputs: 'Complete inspection record with findings, photos, approvals, and snapshot hash. Redirects to Inspection Detail (IN10).',
        crossScreen: 'Uses component catalog and damage type catalog from /api/inspections/catalog/*. Vehicle data from RDW API. Photos stored in Supabase Storage. Locked inspection accessible as report at IN15. Standalone mode at ins.colourking.nl.',
      },
      {
        code: 'IN10',
        agentNotes: 'GET /api/inspections/[id] — returns full inspection with findings, photos, approvals, snapshots. POST /api/inspections/[id]/transition — advance status (draft→in_progress→review→locked). POST /api/inspections/[id]/findings — add finding. DELETE /api/inspections/[id]/findings/[findingId]. POST /api/inspections/[id]/photos — upload photo. 3-panel layout.',
        userFlow: 'Full inspection detail view with three-panel layout. The header shows status (draft/in progress/review/locked) with transition buttons and the inspection reference number.\n\nLeft panel: Vehicle information (kenteken, make, model, VIN, mileage, fuel), incident details (date, description), and insurer/claim data.\n\nCenter panel: Findings list — each finding shows component, damage types, severity (1–4 dots), disposition (repair/replace/investigate), repair and paint hours, parts, hidden damage and ADAS flags. Add new findings with the catalog-driven form.\n\nRight panel: Photo gallery with guided shots (12 fixed positions around the vehicle) and per-finding damage photos. Upload via camera or file picker.\n\nStatus transitions: draft → in_progress (start inspection), in_progress → review (ready for QC), review → locked (finalise — creates snapshot hash). Locked inspections are immutable.',
        inputs: 'Status transitions. Finding creation (component, damage types, severity, disposition, hours, parts, flags). Photo upload (guided or per-finding). Approval signatures.',
        outputs: 'Complete inspection record with findings, photos, approvals. Snapshot hash on lock. Navigates to Report (IN15) for print output.',
        crossScreen: 'Findings use component and damage type catalogs. Photos stored in Supabase Storage. Locked inspection generates report accessible at IN15. Approval signatures use eIDAS-compliant electronic signature flow.',
      },
      {
        code: 'IN15',
        agentNotes: 'GET /api/inspections/[id] — renders the full inspection data as a print-ready A4 report using the InspectionReportTemplate. Toolbar with back link, print button, and PDF download. Uses Neutral Base design system: Archivo (headings), Literata (prose), JetBrains Mono (data/references). Warm copper accent palette.',
        userFlow: 'Print-ready inspection report in A4 format. Opens from the inspection detail page (IN10). The report is structured across multiple pages:\n\n1. Summary page: Vehicle details grid, KPI strip (findings count, photos, repair hours, paint hours), disposition breakdown bars, hours and indicative total, caveats (hidden damage, ADAS, pre-existing), and dual signature blocks (inspector + customer).\n2. Guided photos page: 4-column grid of all guided shots with references and captions.\n3. Findings detail pages: Each finding as a card with reference (copper accent), component name, severity indicator (colour-coded dots), and detail rows for zone, damage, repair method, paint work, hours, parts, and flags.\n4. Pre-existing damage page: Separate listing of out-of-scope findings.\n5. Findings table: Summary table with all findings, hours totals, and flag indicators.\n6. Verification page: Report metadata, snapshot and PDF hashes, approval signatures with eIDAS statement.\n\nEach page carries the ColourKing footer (address, KvK, BTW). Use the toolbar buttons to print or download as PDF.',
        inputs: 'Print button, PDF download button, back to inspection link.',
        outputs: 'A4 print-ready report with professional typography and layout. PDF via browser print dialog.',
        crossScreen: 'Data loaded from inspection (IN10). Report is view-only — all editing happens on IN10. Snapshot hash on verification page proves document integrity. Accessible from IN10 via the Rapport button.',
      },
    ],
  },
  {
    id: 'customers',
    code: 'KL',
    screens: [
      {
        code: 'KL05',
        agentNotes: 'GET /api/customers — returns array. Searchable by name/email/phone. Customer types: private, company, fleet, dealer.',
        userFlow: 'Browse all customers in a searchable table. Columns show type icon (person/building/truck/store), name, email, phone, and city. Click a row to open the customer detail. Use "New customer" button to add one.',
        inputs: 'Search query (filters name, email, phone).',
        outputs: 'Filtered customer list with links to detail pages.',
        crossScreen: 'Customer records are linked to Vehicles (VH05), Offers (ES05), Jobs (JB05), and Invoices (FA05). Deleting a customer requires no linked active jobs or unpaid invoices.',
      },
      {
        code: 'KL01',
        agentNotes: 'POST /api/customers — body: { type, locale, name, email?, phone?, address?, postcode?, city?, btw_number?, notes? }.',
        userFlow: 'Fill in the customer form. Select type (private/company/fleet/dealer). Name is required. Add contact and address details. For companies, enter the VAT number (BTW nummer). Submit to create.',
        inputs: 'Type, locale, name (required), email, phone, address, postcode, city, VAT number, notes.',
        outputs: 'New customer record.',
        crossScreen: 'New customer appears in Customer List (KL05). Can be linked to vehicles and offers immediately after creation.',
      },
      {
        code: 'KL02',
        agentNotes: 'GET /api/customers/[id]. PATCH /api/customers/[id]. DELETE /api/customers/[id]. Includes linked vehicles array.',
        userFlow: 'View and edit customer details. Left panel shows all data fields. Right panel lists linked vehicles with a button to add a new vehicle pre-linked to this customer. Use Edit to modify details, Delete to remove (only if no active links).',
        inputs: 'Editable fields: all customer fields. Delete action.',
        outputs: 'Updated customer record. Linked vehicle list.',
        crossScreen: 'Linked vehicles (VH05), offers, jobs, and invoices are accessible from here. Adding a vehicle navigates to VH01 with customer pre-selected.',
      },
      {
        code: 'KL03',
        agentNotes: 'GET /api/customers/[id] — load existing data. PATCH /api/customers/[id] — update fields. Same field set as KL01. Redirects to KL02 on save.',
        userFlow: 'Edit an existing customer record. The form loads pre-filled with current data. All fields from customer creation are editable: type (private/company/fleet/dealer), locale, name (required), email, phone, address, postcode, city, VAT number, and notes. Save to apply changes and return to the customer detail page. Cancel to discard.',
        inputs: 'Type, locale, name (required), email, phone, address, postcode, city, VAT number, notes. Save and Cancel buttons.',
        outputs: 'Updated customer record. Redirects to Customer Detail (KL02) on success.',
        crossScreen: 'Accessed from Customer Detail (KL02) via the Edit button. Returns to KL02 on save or cancel. Changes are reflected in Customer List (KL05) and all linked records.',
      },
    ],
  },
  {
    id: 'vehicles',
    code: 'VH',
    screens: [
      {
        code: 'VH05',
        agentNotes: 'GET /api/vehicles — returns array with joined customer name. Search by kenteken/make/model. WOK flag indicates total loss.',
        userFlow: 'Browse all vehicles. Table shows kenteken (license plate), make/model/year, colour, owner name, and WOK status. WOK (Wettelijk Onherstelbaar Kriterium) means the vehicle is a total loss — shown as an amber warning. Search by kenteken or vehicle details.',
        inputs: 'Search query.',
        outputs: 'Filtered vehicle list.',
        crossScreen: 'Vehicles link to their owner (KL02), and appear on Offers (ES), Jobs (JB), and Invoices (FA).',
      },
      {
        code: 'VH01',
        agentNotes: 'POST /api/vehicles — body: { customer_id (required), kenteken?, vin?, make?, model?, year?, colour?, paint_code?, fuel?, body_type?, wok? }. RDW lookup: GET /api/rdw?kenteken=XX-XXX-X.',
        userFlow: 'Enter a kenteken and click the search button to auto-fill vehicle data from the RDW (Dutch vehicle registry). Select the owner customer (required). Review and adjust the auto-filled fields. Check WOK if applicable. If arriving from a customer page, the owner is pre-selected.',
        inputs: 'Owner (required), kenteken, VIN, make, model, year, colour, paint code, fuel, body type, WOK checkbox.',
        outputs: 'New vehicle record linked to the selected customer.',
        crossScreen: 'RDW API provides auto-fill data. Vehicle appears in Vehicle List (VH05) and on the owner\'s Customer Detail (KL02).',
      },
      {
        code: 'VH10',
        agentNotes: 'GET /api/vehicles/[id] — returns vehicle with joined customer. PATCH /api/vehicles/[id] — update individual fields, status, or notes. DELETE /api/vehicles/[id]. Statuses: created, in_progress, done, archived. Inline editing via per-field PATCH calls. RDW snapshot data displayed read-only.',
        userFlow: 'Full detail view for a single vehicle. The header shows make, model, year, license plate badge, and WOK indicator (total loss). A status bar with four clickable buttons (created, in progress, done, archived) allows status changes.\n\nTwo-column layout: the left panel shows all vehicle properties with inline editing — hover over any field to reveal a pencil icon, click to edit in place (kenteken, VIN, make, model, year, colour, paint code, fuel, body type, WOK toggle). The right panel shows the owner card (clickable link to customer detail) and a notes section.\n\nAt the bottom, the RDW Data section displays a 3-column grid of read-only registry snapshot fields (type, variant, APK date, dimensions, weight, etc.). A delete button with confirmation dialog removes the vehicle.',
        inputs: 'Inline field editing (click pencil icon, edit, blur/Enter to save). Status buttons. Notes. Delete with confirmation.',
        outputs: 'Updated vehicle fields (saved per-field on blur). Status changes. Delete redirects to Vehicle List (VH05).',
        crossScreen: 'Owner card links to Customer Detail (KL02). Back arrow returns to Vehicle List (VH05). RDW data populated by the RDW lookup performed during vehicle creation (VH01). Vehicle appears on Offers (ES), Jobs (JB), and Invoices (FA).',
      },
    ],
  },
  {
    id: 'offers',
    code: 'ES',
    screens: [
      {
        code: 'ES05',
        agentNotes: 'GET /api/offers — returns array. Filters: search, type (offer/supplement), status (draft/sent/approved/rejected/superseded).',
        userFlow: 'Browse all offers. Table shows offer number (or "CONCEPT" for drafts), type, customer, vehicle, total amount, status badge, and date. Filter by type and status. Click a row to open details.',
        inputs: 'Search query, type filter, status filter.',
        outputs: 'Filtered offer list.',
        crossScreen: 'Offers originate from Leads (LD10). Approved offers can generate Invoices (FA01) and Jobs (JB01).',
      },
      {
        code: 'ES01',
        agentNotes: 'POST /api/offers — body: { customer_id (required), vehicle_id?, origin?, valid_until?, estimated_delivery?, locale?, notes?, lines: [{ kind, description, quantity, unit_price_cents, discount_pct, unit, tax_code, part_number }] }. Tax codes: H21=21%, L9=9%, N0=0%. Origins include Offerte-Web for website submissions.',
        userFlow: 'Select a customer (required) and optionally a vehicle. Set validity date, estimated delivery date, and origin (telefoon, e-mail, website, balie, verwijzing, Offerte-Web). Add line items: choose type (labour/part/material/other), enter description, quantity, unit price in euros (stored as cents), discount %, and tax code (21%/9%/0%). The running total updates live. Submit to create as draft.\n\nWhen creating from a lead, customer, vehicle, and notes fields are auto-filled.',
        inputs: 'Customer (required), vehicle, origin, valid until, estimated delivery date, locale, notes, line items with kind/description/quantity/price/discount/tax.',
        outputs: 'Draft offer with auto-calculated totals. Money stored in integer cents. Estimated delivery date shown on offer.',
        crossScreen: 'Created offer links to Customer (KL) and Vehicle (VH). Can be sent, then approved/rejected. Approved offers feed into Invoice creation (FA01) and Job creation (JB01). Auto-fill from Lead (LD10). Estimated delivery visible in Offer List (ES05) and Preview.',
      },
      {
        code: 'ES10',
        agentNotes: 'GET /api/offers/[id]. PATCH /api/offers/[id]/status — transitions: draft→sent (guard: has_lines), sent→approved (requires approved_by_name), sent→rejected (requires reason), sent→superseded (creates copy). Lines editable only in draft. Preview at /app/offertes/[id]/preview renders QuoteTemplate with print and send-from-preview.',
        userFlow: 'View offer details with line items and totals. Actions depend on status:\n- Draft: Edit lines (add/remove), then "Send" to customer (requires at least one line item). Delete available.\n- Sent: "Approve" (enter approver name), "Reject" (enter reason), or "Supersede" (creates a new copy for revision).\n- Approved/Rejected/Superseded: View-only.\n\nThe version chain shows all related offers. Use the Preview button to open a full-page QuoteTemplate view with print functionality and the option to send the offer directly from the preview.',
        inputs: 'Status transitions with required data (approver name, rejection reason). Line item add/remove in draft. Preview button.',
        outputs: 'Updated offer status. Supersede creates a new draft offer linked to the original. Preview page for print-ready output.',
        crossScreen: 'Approval triggers availability for Invoice (FA01) and Job (JB01) creation. Rejection/supersede records are visible in Reports (RP10). Version chain links all related offers. Preview uses QuoteTemplate module.',
      },
    ],
  },
  {
    id: 'jobs',
    code: 'JB',
    screens: [
      {
        code: 'JB01',
        agentNotes: 'POST /api/jobs — body: { customer_id (required), vehicle_id (required), offer_id?, job_type, priority, payer_type, assigned_to?, estimated_hours?, target_date?, intake_km?, notes? }. Selecting an offer auto-fills customer, vehicle, and notes. GET /api/offers?status=approved for offer dropdown. GET /api/staff for technician dropdown. POST /api/jobs/[id]/photos — multipart upload with phase tag.',
        userFlow: 'Create a new repair job. Optionally link to an approved offer — selecting one auto-fills the customer, vehicle, and notes fields. Select customer (required) and vehicle (required, filtered by selected customer). Choose job type (bodywork/mechanical/paint/electrical/diagnostics/apk/maintenance), priority (normal/urgent/rush), and payer type (casco/wa/particulier/lease). Assign a technician, set estimated hours, target date, and intake mileage.\n\nPhoto upload: Attach intake photos directly during job creation. Supports camera capture on mobile devices.\n\nThe Processes section lets you define sub-tasks. Click preset buttons (bodywork, paint, assembly, disassembly, mechanical, diagnostics, polish, prep) to add common processes, or add custom entries. Each process becomes a Task (TS) record after creation.\n\nQuick actions: Link to an existing work order, shortcut to create a handover note (DO21) directly from job creation.',
        inputs: 'Offer (optional, approved only), customer (required), vehicle (required), job type, priority, payer type, assigned technician, estimated hours, target date, intake km, notes, photos. Process rows: title and estimated hours.',
        outputs: 'New job record plus one Task (TS) per process row, with attached photos. Redirects to Job Detail (JB10).',
        crossScreen: 'Offer dropdown shows approved offers from ES10. Customer/vehicle from KL/VH. Technician from Staff (SY02). Created tasks appear in My Tasks (TS05). Job appears in Job List (JB05) and Board (JB15). Handover shortcut links to DO21.',
      },
      {
        code: 'JB05',
        agentNotes: 'GET /api/jobs — returns array. Filter by stage. 10 stages: intake, quoted, approved, scheduled, checked_in, in_progress, qc, ready, delivered, closed.',
        userFlow: 'Browse all jobs. Table shows job number, stage badge (colour-coded), customer, vehicle, and date. Filter by stage using the dropdown. Click a row for details, or switch to the Board view for a visual Kanban.',
        inputs: 'Search query, stage filter.',
        outputs: 'Filtered job list.',
        crossScreen: 'Jobs originate from approved Offers (ES10). Parts (PT05) and Tasks (TS05) are linked to jobs. Job completion triggers Handover Note (DO21) and final Invoice (FA01).',
      },
      {
        code: 'JB15',
        agentNotes: 'GET /api/jobs?view=board — returns jobs grouped by stage. Visual Kanban. No drag-and-drop yet — stage changes happen on detail page.',
        userFlow: 'The Workshop Board shows all active jobs as a Kanban board. Each column is a stage (intake through delivered — closed is hidden). Cards show job number, date, customer, and vehicle kenteken. Click any card to open its detail page where you can advance the stage.',
        inputs: 'None (displays all non-closed jobs).',
        outputs: 'Visual board with job counts per stage.',
        crossScreen: 'Each card links to Job Detail (JB10). Provides a quick overview for workshop managers.',
      },
      {
        code: 'JB10',
        agentNotes: 'GET /api/jobs/[id]. PATCH /api/jobs/[id]/stage — transitions follow linear pipeline with QC rework loop. POST /api/jobs/[id]/photos — multipart upload with phase tag. POST /api/jobs/[id]/events — add note. Shortcut to create handover note (DO21) at ready/delivered stage.',
        userFlow: 'Full job management view. The stage progress bar shows all 10 stages with the current one highlighted. Stage transition buttons appear based on allowed next stages:\n\nintake → quoted → approved → scheduled → checked_in → in_progress → qc → ready → delivered → closed\n\nAt QC, the job can loop back to in_progress for rework.\n\nUpload photos tagged by phase (before/during/after). Add notes to the audit trail. The event timeline on the right tracks all changes with timestamps.\n\nAt the ready or delivered stage, a "Create Handover Note" shortcut button appears, allowing quick creation of a handover note (afleverbon) directly from the job detail.',
        inputs: 'Stage transitions (button clicks). Photo uploads with phase tags. Notes (text). Handover note shortcut (at ready/delivered).',
        outputs: 'Updated job stage. Photo gallery. Event timeline. Handover note creation shortcut.',
        crossScreen: 'Stage changes trigger notifications (SY05). Photos are stored and visible in Documents (DO05). Parts (PT05) blocking flags can prevent stage advancement. Tasks (TS05) are linked for labour tracking. Handover shortcut creates DO21 linked to this job.',
      },
    ],
  },
  {
    id: 'parts',
    code: 'PT',
    screens: [
      {
        code: 'PT05',
        agentNotes: 'GET /api/parts — returns array with joined job data. Filters: search, status (needed/ordered/shipped/received/returned), blocking flag.',
        userFlow: 'Track all parts across jobs. Table shows description, part number, supplier, quantity, unit price, total, status badge, and blocking indicator. A blocking part (amber triangle) prevents the linked job from advancing past certain stages. Filter by status and blocking flag.',
        inputs: 'Search query, status filter, blocking filter.',
        outputs: 'Filtered parts list with costs and blocking indicators.',
        crossScreen: 'Parts are linked to Jobs (JB10). Blocking parts affect job stage transitions. Part costs feed into Offer line items (ES01) and Purchase records (PU05). Part received triggers notification (SY05).',
      },
      {
        code: 'PT01',
        agentNotes: 'POST /api/parts — body: { job_id, description (required), part_number?, supplier?, quantity?, unit_price_cents?, blocking?, notes? }. Price entered in euros, stored in cents.',
        userFlow: 'Add a new part to a job. Select the job, enter the part description (required), part number, supplier, quantity, and unit price in euros. Check "Blocking" if the job cannot proceed without this part. The total is auto-calculated.',
        inputs: 'Job (required), description (required), part number, supplier, quantity, unit price, blocking checkbox, notes.',
        outputs: 'New part record with status "needed" and calculated total in cents.',
        crossScreen: 'Part appears in Parts List (PT05) and on the linked Job Detail (JB10). If blocking, it affects the job\'s stage advancement.',
      },
    ],
  },
  {
    id: 'invoices',
    code: 'FA',
    screens: [
      {
        code: 'FA05',
        agentNotes: 'GET /api/invoices — returns array. Filters: search, status (draft/sent/paid/overdue/cancelled/credited). Overdue auto-calculated from due_date.',
        userFlow: 'Browse all invoices. Table shows invoice number (or "Concept"), customer, date, due date (red if overdue), total in EUR, and status badge. Filter by status. Click to open detail with the full invoice template.',
        inputs: 'Search query, status filter.',
        outputs: 'Filtered invoice list.',
        crossScreen: 'Invoices are created from approved Offers (ES10). Payments link to Mollie (payment gateway). Credit notes are separate invoices that reference the original. VAT amounts feed into VAT Dashboard (BW05).',
      },
      {
        code: 'FA01',
        agentNotes: 'POST /api/invoices — body: { offer_id (approved offers only), due_date?, payment_terms? }. Lines copied from offer. Due date defaults to +30 days.',
        userFlow: 'Create an invoice from an approved offer. Select the offer — only approved offers appear. The line items are copied automatically. Set the due date (defaults to 30 days from now) and payment terms text. Submit to create as draft.',
        inputs: 'Offer (approved only), due date, payment terms text.',
        outputs: 'Draft invoice with lines copied from the selected offer.',
        crossScreen: 'Links to the source Offer (ES10). Once issued, triggers document_issued notification (SY05). Appears in Invoice List (FA05) and Document Archive (DO05).',
      },
      {
        code: 'FA10',
        agentNotes: 'GET /api/invoices/[id]. Actions: POST /api/invoices/[id]/issue (draft→sent, assigns number), POST /api/invoices/[id]/payments (amount_cents, method, reference), POST /api/invoices/[id]/credit-note (reason). Payment link uses payment_token — public page at /s/{token}. Preview at /app/facturen/[id]/preview renders InvoiceTemplate with print, payment link copy, and issue-from-preview. Never edit issued invoices — use credit notes.',
        userFlow: 'View the full professional invoice (A4, print-ready, locale-aware). Actions by status:\n- Draft: "Issue" assigns a number and marks as sent. Delete available. Preview page available.\n- Sent/Overdue: "Record Payment" (enter amount, method, reference), "Credit Note" (creates negative mirror with reason), "Payment Link" (copies a public URL for online payment via Mollie).\n- Paid/Credited/Cancelled: View-only.\n\nThe Preview button opens a dedicated preview page with a toolbar offering print, payment link copy, and issue-from-preview. Use the Print button for a clean A4 print. The sidebar shows links to related records and any recorded payments.',
        inputs: 'Issue action. Payment recording (amount, method: bank_transfer/ideal/card/cash, reference). Credit note creation (reason). Payment link generation. Preview button. Print button.',
        outputs: 'Updated invoice status. Payment records. Credit note (separate invoice). Public payment URL via Mollie. Preview page for print-ready output.',
        crossScreen: 'Payments update the outstanding amount in Reports (RP10) and Dashboard (RP01). Credit notes appear as separate invoices linked to the original. VAT amounts feed into VAT Dashboard (BW05). Payment link uses Mollie API integration. Preview uses InvoiceTemplate module.',
      },
    ],
  },
  {
    id: 'documents',
    code: 'DO',
    screens: [
      {
        code: 'DO05',
        agentNotes: 'GET /api/documents — returns array. Filters: search, doc_type (offer/repair_order/handover_note/invoice/credit_note), status (draft/issued/cancelled).',
        userFlow: 'Central archive of all system documents. Filter by document type and status. Each row shows document number, type badge, customer, vehicle, status, and date. Click to view the document detail with its frozen payload and integrity hash.',
        inputs: 'Search query, document type filter, status filter.',
        outputs: 'Filtered document list.',
        crossScreen: 'Documents are generated by Offers (ES), Jobs (JB), and Invoices (FA). Each document stores a SHA-256 hash of its payload for integrity verification.',
      },
      {
        code: 'DO03',
        agentNotes: 'GET /api/documents/[id] — returns document with frozen payload, integrity hash, and linked records.',
        userFlow: 'View the full details of a single document. Shows the document number, type, status, issue date, and the frozen payload (the exact data captured at time of issue). An integrity hash (SHA-256) verifies the document has not been tampered with. Links to the related customer, vehicle, offer, or invoice are shown in the sidebar.',
        inputs: 'None (read-only view).',
        outputs: 'Complete document with frozen payload and integrity verification.',
        crossScreen: 'Links back to source records: Offer (ES10), Invoice (FA10), Job (JB10). Accessible from Document Archive (DO05).',
      },
      {
        code: 'DO20',
        agentNotes: 'GET /api/repair-order/[id] — returns repair order document. POST /api/repair-order — creates from job_id. Document is auto-numbered via SY03 number ranges.',
        userFlow: 'View or print the Repair Order (Reparatieopdracht). This is the formal document that authorises the repair work. It includes customer details, vehicle information, damage description, approved offer lines, and terms. Generated from a Job once it reaches the approved stage. Print-ready A4 layout with company branding.',
        inputs: 'Generated from Job (no manual input).',
        outputs: 'Numbered repair order document (print-ready A4).',
        crossScreen: 'Created from Job Detail (JB10). Number prefix set in Number Ranges (SY03). Stored in Document Archive (DO05).',
      },
      {
        code: 'DO22',
        agentNotes: 'GET /api/handover-notes?search= — returns array of handover note summaries. Searchable by doc number, customer name, vehicle kenteken.',
        userFlow: 'Browse all handover notes (afleverbonnen) in a searchable table. Columns show document number, status badge (draft/issued/cancelled/signed with distinct icons), customer name, vehicle, and date. Use the search field to filter by document number, customer, or vehicle. Click any row to open the handover note detail.',
        inputs: 'Search query.',
        outputs: 'Filtered handover notes list.',
        crossScreen: 'Each row links to Handover Note detail (DO21). Handover notes are created from Job Detail (JB10) at the ready/delivered stage. Documents are also accessible from Document Archive (DO05).',
      },
      {
        code: 'DO21',
        agentNotes: 'GET /api/handover-notes/[id] — returns handover note with payload, signatures, and share_token. PATCH /api/handover-notes/[id] — actions: { action: "issue", payload } (draft→issued), { action: "share" } (generates share_token), { action: "gallery_consent", consent: boolean }. Public view: GET /api/public/handover/[token]. Public sign: POST /api/public/handover/[token] { action: "sign", signer_name, signature_data }.',
        userFlow: 'View and manage a handover note (afleverbon). The main area shows work summary, mileage at handover, warranty text, returned items checklist, and any existing signatures.\n\nActions depend on status:\n- Draft: Edit payload fields (work summary, mileage, warranty text, returned items, gallery consent). Click "Issue" to finalise.\n- Issued: "Share" generates a public link for customer signature — the URL is auto-copied to clipboard. "Print" opens the print template in a new tab. Admin-side signature: enter a signer name and draw on the canvas.\n- Signed: View-only with signature images displayed.\n\nThe public customer view (accessed via share link at /s/handover/{token}) shows the document with Colourking branding. The customer can enter their name, draw a signature on a touch/mouse canvas, optionally grant gallery consent, and submit. Supports Dutch, English, and Turkish.',
        inputs: 'Draft: work summary, mileage, warranty text, returned items, gallery consent toggle, Issue button. Issued: Share button, Print button, signature canvas with signer name. Public: signer name, signature canvas, gallery consent checkbox.',
        outputs: 'Issued handover note. Share token and public URL. Signature records (base64). Gallery consent flag. Print-ready document.',
        crossScreen: 'Created from Job Detail (JB10) at ready/delivered stage. Accessible from Handover Notes list (DO22) and Document Archive (DO05). Number prefix set in Number Ranges (SY03). Public share link at /s/handover/{token} for customer signature.',
      },
    ],
  },
  {
    id: 'appointments',
    code: 'AP',
    screens: [
      {
        code: 'AP05',
        agentNotes: 'GET /api/appointments — returns array. Filters: date range, type, resource. Types: inspection, drop_off, collection, repair_slot. Statuses: requested, confirmed, cancelled, completed. Resources: bay, booth, staff.',
        userFlow: 'Weekly calendar view (07:00-18:00). Appointments are colour-coded by type: inspection (green), drop-off (blue), collection (purple), repair slot (amber). Border style indicates status: dashed for requested, solid for confirmed, strikethrough for cancelled. Navigate weeks with arrows, jump to today. Filter by type and resource.',
        inputs: 'Week navigation, type filter, resource filter.',
        outputs: 'Visual weekly calendar with appointment blocks.',
        crossScreen: 'Appointments link to Customers (KL) and Vehicles (VH). Confirmations and cancellations trigger notifications (SY05). Inspection appointments can initiate Lead creation (LD01).',
      },
      {
        code: 'AP01',
        agentNotes: 'POST /api/appointments — body: { type (required), contact_name (required), phone?, email?, date, time_slot, duration_minutes, resource_id?, customer_id?, vehicle_id?, notes? }. Available slots: GET /api/appointments/slots?date=YYYY-MM-DD. Public booking wizard at /afspraak creates leads (not direct appointments) that flow through staff review.',
        userFlow: 'Create a new appointment. Select the type (inspection/drop-off/collection/repair slot). Enter contact name (required) and optional phone/email. Pick a date — the available time slots load automatically. Choose duration (15min to 4 hours) and optionally assign a resource (bay/booth/staff). Link to an existing customer and vehicle if applicable.\n\nNote: The public website has a separate 3-step booking wizard at /afspraak. Bookings from the public site create leads (not appointments directly) so staff can review before confirming. The wizard includes a location picker and supports Dutch, English, and Turkish via a flag-based language switcher.',
        inputs: 'Type (required), contact name (required), phone, email, date, time slot, duration, resource, customer/vehicle IDs, notes.',
        outputs: 'New appointment. Inspections auto-confirm; others start as "requested". Public bookings create leads for staff review.',
        crossScreen: 'Appointment appears in Calendar (AP05). Confirmation triggers notification (SY05) and can send email to customer via Resend. Linked customer/vehicle records are accessible from the appointment. Public booking wizard feeds into Leads Inbox (LD05).',
      },
      {
        code: 'AP10',
        agentNotes: 'GET /api/appointments/[id] — returns appointment with joined customer, vehicle, resource, and staff data. PATCH /api/appointments/[id] — status transitions: { action: "confirm" | "complete" | "cancel" }. DELETE /api/appointments/[id].',
        userFlow: 'Detail view for a single appointment. The header shows the contact name with a colour-coded status badge (requested/confirmed/cancelled/completed) and type badge (inspection = green, drop-off = blue, collection = purple, repair slot = amber).\n\nThe main card displays date, time and duration, contact details (name/phone/email), and resource/location. Sections below show the linked customer (clickable), linked vehicle (clickable), and notes.\n\nA timeline card shows the appointment lifecycle: created date, confirmed date, cancelled/completed date.\n\nAction buttons depend on status:\n- Requested: Confirm, Cancel, Delete\n- Confirmed: Complete, Cancel, Delete\n- Cancelled/Completed: Delete only',
        inputs: 'Status transition buttons (Confirm, Complete, Cancel). Delete with confirmation dialog.',
        outputs: 'Updated appointment status. Delete redirects to Appointment Calendar (AP05).',
        crossScreen: 'Links to Customer Detail (KL02) and Vehicle Detail (VH10). Back arrow returns to Appointment Calendar (AP05). Status changes trigger notifications (SY05).',
      },
    ],
  },
  {
    id: 'tasks',
    code: 'TS',
    screens: [
      {
        code: 'TS05',
        agentNotes: 'GET /api/tasks — returns array. Filters: status (todo/in_progress/done/blocked), assigned_to. Includes time entries. PATCH /api/tasks/[id] for status and clock in/out.',
        userFlow: 'View your assigned tasks grouped by status. Each task card shows the linked job number, title, assigned staff, and estimated vs actual minutes. Clock in/out buttons track active work time. Status transitions: todo → in_progress → done. Any task can be marked "blocked" with a reason, and unblocked back to "todo".',
        inputs: 'Status transitions, clock in/out actions.',
        outputs: 'Updated task status and time tracking entries.',
        crossScreen: 'Tasks are linked to Jobs (JB10) and can reference specific Offer lines (ES10). Time entries feed into Timesheet (TS10) and Reports (RP10). Task completion updates job progress.',
      },
      {
        code: 'TS01',
        agentNotes: 'POST /api/tasks — body: { job_id (required), title (required), description?, assigned_to?, estimated_minutes? }.',
        userFlow: 'Create a new task linked to a job. Select the job (required), enter a title (required), optional description, assign to a staff member, and set the estimated time in minutes. The task starts with status "todo".',
        inputs: 'Job (required), title (required), description, assigned staff, estimated minutes.',
        outputs: 'New task with status "todo".',
        crossScreen: 'Task appears in My Tasks (TS05) for the assigned staff member. Linked to the Job Detail (JB10). Time tracking feeds into Timesheet (TS10).',
      },
    ],
  },
  {
    id: 'planning',
    code: 'TS',
    screens: [
      {
        code: 'TS10',
        agentNotes: 'GET /api/planning — returns time entries grouped by staff and day. Week view with totals.',
        userFlow: 'Week-view grid showing all staff hours. Rows are staff members, columns are days (Mon-Sun). Each cell shows logged hours from clock in/out on tasks. Navigate between weeks. Totals are shown per staff member (row) and per day (column).',
        inputs: 'Week navigation.',
        outputs: 'Time entry grid with duration, linked job and task for each entry.',
        crossScreen: 'Time data comes from Task clock in/out (TS05). Hours feed into Reports (RP10) for workload and labour cost analysis.',
      },
    ],
  },
  {
    id: 'reports',
    code: 'RP',
    screens: [
      {
        code: 'RP01',
        agentNotes: 'GET /api/dashboard — returns summary stats: open_leads, active_jobs, pending_invoices, revenue_this_month, upcoming_appointments, recent_activity.',
        userFlow: 'The main dashboard gives a quick overview of your bodyshop. Cards show key metrics: open leads count, active jobs count, pending (unpaid) invoices, and revenue this month. Below are sections for upcoming appointments, recent activity feed, and quick-action buttons to create leads, jobs, or invoices. The dashboard is the default landing page after login.',
        inputs: 'None (auto-loaded).',
        outputs: 'Summary statistics, upcoming appointments, recent activity feed.',
        crossScreen: 'Aggregates data from Leads (LD), Jobs (JB), Invoices (FA), Appointments (AP). Quick-action buttons navigate to creation screens.',
      },
      {
        code: 'RP10',
        agentNotes: 'GET /api/reports?type=revenue|jobs|workload|customers&from=YYYY-MM-DD&to=YYYY-MM-DD. Returns aggregated data.',
        userFlow: 'Four report tabs: Revenue (by period/customer/line type, outstanding total, average invoice value), Jobs (completed count, average cycle days, stages snapshot), Workload (hours by staff, task completion rate), Customers (new by month, lead conversion rate, repeat customers). Select a date range using presets or custom dates.',
        inputs: 'Report type tab, date range (presets: this month, last month, this quarter, this year, custom).',
        outputs: 'Aggregated charts and figures. CSS-only charts (no external library).',
        crossScreen: 'Pulls data from all modules: Invoices (FA), Jobs (JB), Tasks (TS), Customers (KL), Leads (LD).',
      },
    ],
  },
  {
    id: 'vat',
    code: 'BW',
    screens: [
      {
        code: 'BW05',
        agentNotes: 'GET /api/vat-returns — returns array by year and period. Statuses: open, draft, filed (locked), corrected. Filed returns cannot be edited — use correction only. NEVER edit a locked VAT period.',
        userFlow: 'Manage Dutch BTW aangifte returns. Select year and period type (quarter/month). Each return shows all Dutch VAT boxes (1a through 5f). Status flow: open → draft → filed (locked) → corrected. Once filed, a return is permanently locked — edits are only possible via correction (creates a new adjustment return).',
        inputs: 'Year selector, period type toggle, filing action.',
        outputs: 'VAT return data with Dutch tax authority box numbers. Filed returns are immutable.',
        crossScreen: 'VAT amounts come from Invoices (FA05) and Purchases (PU05). Filed returns affect Bookkeeping Export (BK10). Corrections create new return records.',
      },
      {
        code: 'BW40',
        agentNotes: 'Client-side only, no API calls. Pure calculation in integer cents.',
        userFlow: 'Quick calculator tool. Enter an amount (inclusive or exclusive of VAT) and instantly see the breakdown for all three Dutch VAT rates (21%, 9%, 0%). All calculations use integer cents to avoid floating-point errors. Useful for quick price checks.',
        inputs: 'Amount in euros, direction (inclusive/exclusive).',
        outputs: 'VAT breakdown table for all three rates.',
        crossScreen: 'Standalone tool, no cross-screen effects.',
      },
    ],
  },
  {
    id: 'purchases',
    code: 'PU',
    screens: [
      {
        code: 'PU05',
        agentNotes: 'GET /api/purchases — returns array. Filters: search, category (general/parts/paint/materials/tools/rent/utilities/insurance/other), paid status.',
        userFlow: 'Register incoming purchase invoices from suppliers. Table shows supplier name, invoice date, amounts, tax code, category badge, and paid/unpaid status. Filter by category and payment status. Used for cost tracking and VAT input declarations.',
        inputs: 'Search query, category filter, paid filter.',
        outputs: 'Filtered purchase list with totals.',
        crossScreen: 'Purchase VAT amounts feed into VAT Dashboard (BW05). Categories feed into Profit/Loss in Bookkeeping Export (BK10). Parts purchases can link to Parts (PT05).',
      },
      {
        code: 'PU01',
        agentNotes: 'POST /api/purchases — body: { supplier_name (required), supplier_vat?, invoice_date, due_date?, subtotal_cents, tax_code (H21/L9/N0/V0/M0/ICP/EX), category, description?, reference?, job_id? }. VAT auto-calculated.',
        userFlow: 'Register a new purchase invoice. Enter supplier name (required), optional supplier VAT number, dates, subtotal in euros (stored as cents), tax code, and category. The system auto-calculates VAT and total based on the selected tax code. Optionally link to a job for job costing.',
        inputs: 'Supplier name (required), VAT number, dates, subtotal, tax code, category, description, reference, job ID.',
        outputs: 'New purchase record with auto-calculated VAT and total in cents.',
        crossScreen: 'Feeds into VAT Dashboard (BW05), Bookkeeping Export (BK10), and optionally Job costing (JB10).',
      },
    ],
  },
  {
    id: 'bookkeeping',
    code: 'BK',
    screens: [
      {
        code: 'BK10',
        agentNotes: 'GET /api/bookkeeping/export?type=invoices|purchases|vat|pnl&period=YYYY-MM. Returns CSV or summary data.',
        userFlow: 'Export financial data for your accountant. Select a period (month/quarter/year). Four export options: Invoices CSV, Purchases CSV, VAT Returns CSV, and Profit/Loss summary. Each triggers a download. The P&L summary shows revenue by category, costs by category, and net profit.',
        inputs: 'Period selector, export type button.',
        outputs: 'CSV file downloads. P&L summary view.',
        crossScreen: 'Aggregates data from Invoices (FA05), Purchases (PU05), and VAT Returns (BW05).',
      },
    ],
  },
  {
    id: 'publicWebsite',
    code: 'PU',
    screens: [
      {
        code: 'PU01',
        agentNotes: 'Server-rendered pages at colourking.nl. No auth required. Routes: / (home), /diensten, /gallerij, /over-ons, /contact, /offerte, /afspraak. Locale via [locale] segment, default nl. Flag-based language switcher (NL/EN/TR).',
        userFlow: 'The public website at colourking.nl is the customer-facing site. It features:\n\n- Hero section with auto-cycling slideshow (4 photos, 6s interval, crossfade transitions) and dark gradient overlay.\n- Shield logo in navbar and footer.\n- Navigation: Diensten, Galerij, Over Ons, Contact, Afspraak, Offerte Aanvragen.\n- Light/dark theme switcher (sun/moon icon) — isolated from the admin app theme, with separate localStorage persistence.\n- Flag-based language switcher (NL/EN/TR) with Instagram shortcut button.\n- Footer with company info: Autospuitbedrijf Colour King, KvK 82199884, BTW NL620220430B03, Satijnbloem 6, Rotterdam.\n- Social links: Instagram and Facebook buttons in footer.',
        inputs: 'Language selection via flag icons (Dutch, English, Turkish). Theme toggle (light/dark).',
        outputs: 'Locale-aware, theme-aware public pages. All text via next-intl translations.',
        crossScreen: 'Contact form (/contact) and Offerte form (/offerte) create Leads (LD05). Booking wizard (/afspraak) creates Leads for staff review. Theme choice persisted separately from admin app.',
      },
      {
        code: 'PU02',
        agentNotes: 'POST /api/leads — source: "website". 3-step wizard: Step 1 (contact info + location), Step 2 (date/time), Step 3 (vehicle + damage). Creates lead with source "website".',
        userFlow: 'The public booking wizard at /afspraak is a 3-step form:\n1. Contact: Name, email, phone, preferred location (map picker).\n2. Date & Time: Select a preferred date and time slot.\n3. Vehicle & Damage: Kenteken, damage description, optional photo upload.\n\nSubmission creates a lead (not a direct appointment) with source "website" so staff can review and confirm. Supports Dutch, English, and Turkish.',
        inputs: 'Name (required), email, phone, location, date, time, kenteken, damage description, photos.',
        outputs: 'New lead with source "website" and all booking details in the damage description. Appears in Leads Inbox (LD05) for staff review.',
        crossScreen: 'Creates leads visible in Leads Inbox (LD05). Staff convert approved bookings into Appointments (AP01) and Customers (KL01).',
      },
      {
        code: 'PU03',
        agentNotes: 'Separate /contact and /offerte pages. Both POST to /api/leads with different source identifiers. Offerte uses Offerte-Web origin.',
        userFlow: 'Two distinct public forms:\n\n- Contact (/contact): Redesigned with a professional layout featuring a verification badge ("Gecertificeerd Autoschadebedrijf"), subject dropdown (e.g. Schadeherstel, Spuitwerk, APK, Onderhoud, Overig), Google Maps embed of the workshop location, and direct phone/email/WhatsApp contact cards. Creates a lead with source "website".\n\n- Offerte (/offerte): Full-width quote request form with:\n  • Contact fields (name, email, phone)\n  • Dutch plate toggle with RDW lookup (auto-fills make/model/year/colour) or foreign plate with VIN and paint code — all three identifier fields displayed in one compact row\n  • Service type selection (Schadeherstel, Spuitwerk, Lakwerk, Deukherstel, Overig)\n  • Location picker\n  • Damage description (mandatory, minimum 10 characters)\n  • Expandable photo guide with 6 example images (3 good, 3 bad) based on the 5 AI evaluation criteria: lighting, angle, focus, distance, and damage visibility\n  • Photo upload with AI-powered quality evaluation — each uploaded photo is scored by AI on 5 criteria with pass/fail feedback and improvement suggestions\n  • Privacy consent checkbox (required) — prominent card-style UI that turns green when checked\n  • Creates a lead with source "Offerte-Web"\n\nBoth forms are locale-aware (Dutch, English, Turkish) and create leads for staff review.',
        inputs: 'Contact: name, email, phone, subject, message. Offerte: name, email, phone, kenteken or VIN/paint code, service type, location, damage description (min 10 chars), photos (AI-evaluated), privacy consent checkbox.',
        outputs: 'New lead in Leads Inbox (LD05) with source "Offerte-Web" for offerte submissions.',
        crossScreen: 'Feeds into Leads (LD05). Staff can create Offers (ES01) from offerte-sourced leads. AI photo evaluation uses configured AI provider from AI Settings (SY20).',
      },
    ],
  },
  {
    id: 'settings',
    code: 'SY',
    screens: [
      {
        code: 'SY01',
        agentNotes: 'Client-side settings stored in localStorage/cookies. Three tabs: appearance, general, notifications. Nav group collapse state persisted.',
        userFlow: 'Configure the application. Three tabs:\n- Appearance: Choose accent colour (6 presets), theme (dark only for now), compact mode toggle, sidebar collapsed default, navigation groups expanded/collapsed state (persisted per group).\n- General: Company name, language (Dutch/English/Turkish), date format.\n- Notifications: Toggle which notifications you receive (new lead, stage change, email, appointment).',
        inputs: 'All settings fields, save button. Sidebar nav group expand/collapse toggles.',
        outputs: 'Updated application settings. Language change reloads the interface. Nav group state persists across sessions.',
        crossScreen: 'Language setting affects all screens. Notification toggles affect Monitoring (SY05). Accent colour changes button and badge colours throughout. Nav group state applies to sidebar navigation.',
      },
      {
        code: 'SY02',
        agentNotes: 'GET /api/staff — returns array. POST /api/staff/invite — { email, name, role }. PATCH /api/staff/[id] — toggle active, change role. Roles: admin, office, tech.',
        userFlow: 'Manage staff members. View all staff with email, name, role, and active status. Invite new staff by entering email, name, and role (admin/office/tech). Toggle active/inactive to disable access without deleting. Change roles as needed.',
        inputs: 'Invite: email, name, role. Toggle: active/inactive. Edit: role change.',
        outputs: 'Staff records. Invited users receive an email to set up their account.',
        crossScreen: 'Staff roles affect permissions across all screens. Tech role users appear in Task assignment (TS05) and Timesheet (TS10). Admin role has full access.',
      },
      {
        code: 'SY03',
        agentNotes: 'GET /api/number-ranges — returns ranges by doc_type and year. PATCH /api/number-ranges/[id] — update prefix.',
        userFlow: 'Configure document number prefixes. Each document type (offer, invoice, credit note, repair order, handover note) has a number range per year. Edit the prefix to customise numbering (e.g., "INV-2026-" for invoices). Preview shows the next number to be allocated.',
        inputs: 'Prefix text per document type.',
        outputs: 'Updated number range with next-number preview.',
        crossScreen: 'Number prefixes affect all document creation screens (ES01, FA01, DO20, DO21). Changes apply to new documents only — existing numbers are never changed.',
      },
      {
        code: 'SY05',
        agentNotes: 'GET /api/notifications — returns array with type, message, read status, created_at. PATCH /api/notifications/[id] — mark read. Types: new_lead, stage_change, document_issued, part_received, appointment.',
        userFlow: 'Notification centre showing system events. View statistics at the top: unread count, today\'s notifications, leads count, total. Use filter pills to narrow by type (new lead, stage change, document issued, part received, appointment). Notifications are grouped by date (today vs earlier). Click the bell icon to mark individual ones as read, or use "Mark all read". Toggle sound alerts and auto-refresh.',
        inputs: 'Filter pills (notification type), mark read actions, sound toggle, auto-refresh toggle.',
        outputs: 'Filtered notification list with read/unread status.',
        crossScreen: 'Receives events from Leads (LD), Jobs (JB), Invoices (FA), Parts (PT), Appointments (AP). Notification preferences are configured in Settings (SY01).',
      },
      {
        code: 'SY15',
        agentNotes: 'Client-side display of configured cron jobs. No API — reads from static config.',
        userFlow: 'View all scheduled background tasks (cron jobs). Each card shows: job name, schedule (cron expression), frequency in human-readable form, endpoint URL, and enabled/disabled status. Useful for monitoring automated processes like the IMAP email poller.',
        inputs: 'None (read-only display).',
        outputs: 'List of scheduled tasks with their configurations.',
        crossScreen: 'Cron jobs trigger API endpoints like the IMAP Poller (SY25). Related to Infrastructure status (SY35).',
      },
      {
        code: 'SY20',
        agentNotes: 'GET /api/ai/chat — streaming chat endpoint. Multi-provider: supports OpenAI (GPT-4o), Anthropic (Claude), and Google (Gemini). Provider configured via ai_settings table (primary_provider, secondary_provider, photo_eval_provider). Each provider has its own API key env var. Photo evaluation uses dedicated provider setting. GET /api/ai/settings — read settings. PATCH /api/ai/settings — update provider config.',
        userFlow: 'AI assistant panel and configuration. Two functions:\n\n1. Chat Assistant: Open from the "AI" button in the header. The assistant has context about the current screen and can help with data interpretation, suggest next steps, and answer how-to questions. Type your question and press Enter.\n\n2. AI Settings: Configure which AI providers to use. Three provider slots:\n   - Primary provider (for chat): OpenAI GPT-4o, Anthropic Claude, or Google Gemini\n   - Secondary/fallback provider: used if primary fails\n   - Photo evaluation provider: dedicated provider for the AI photo quality scoring on the Offerte page\n\nEach provider requires its own API key configured in Environment Secrets (SY50). The photo evaluation AI scores uploaded damage photos on 5 criteria: lighting, angle, focus, distance, and damage visibility.',
        inputs: 'Chat: text prompt. Settings: provider selection dropdowns, temperature, max tokens.',
        outputs: 'Chat: AI-generated response with screen context. Settings: updated AI provider configuration. Photo eval: per-photo quality scores with pass/fail and improvement tips.',
        crossScreen: 'Chat available from any screen via header button. Photo evaluation used on public Offerte page (PU03). API keys managed in Environment Secrets (SY50). Settings stored in ai_settings table.',
      },
      {
        code: 'SY25',
        agentNotes: 'POST /api/email/imap-poll — triggers IMAP poll (auth: IMAP_POLL_SECRET). GET /api/email/imap-log — returns recent email_log entries. Matches [JB-ID], [LD-ID], [FA-ID], [ES-ID] in subject lines.',
        userFlow: 'Monitor incoming email replies from customers via the Zoho IMAP inbox (info@colourking.nl). The screen shows:\n- Cron job configuration card: job name, schedule, frequency, inbox address, IMAP host, and connection status.\n- Countdown timer to the next scheduled poll.\n- "Poll Now" button to trigger an immediate check.\n- Poll log showing the results of the last run.\n- Captured replies panel listing emails that matched a job or lead ID in their subject line (e.g. [JB-1234]).',
        inputs: 'Poll Now button (triggers immediate IMAP check).',
        outputs: 'Poll results: number of emails processed, matched entities. Captured replies with sender, subject, snippet, and linked entity.',
        crossScreen: 'Matches emails to Jobs (JB), Leads (LD), Invoices (FA), and Offers (ES) by subject line patterns. Email log records are stored in the email_log table. Cron schedule visible in Cron Jobs (SY15).',
      },
      {
        code: 'SY30',
        agentNotes: 'GET /api/drive?folderId= — list files. GET /api/drive?search= — search. POST /api/drive (multipart) — upload. POST /api/drive (JSON, action:create_folder) — create folder. DELETE /api/drive?fileId= — delete. PATCH /api/drive (action:rename) — rename.',
        userFlow: 'Browse and manage files on the company Google Drive (colourking85@gmail.com). Features:\n- Folder navigation with breadcrumb trail (click to navigate back).\n- Search bar to find files by name across the Drive.\n- Upload button to add files to the current folder (files are auto-shared as public).\n- New Folder button to create subfolders.\n- File list showing icon (by type), name, size, date, and external link icon.\n- Click folders to navigate into them, click files to open in Google Drive.\n- Delete button (trash icon, appears on hover) with confirmation dialog.',
        inputs: 'Folder navigation, search query, file upload, folder creation, file deletion.',
        outputs: 'File listing with metadata. Uploaded files are public-readable.',
        crossScreen: 'Standalone file management. Files can be referenced from Jobs (JB) or Invoices (FA) by sharing the Drive link.',
      },
      {
        code: 'SY35',
        agentNotes: 'GET /api/infra/status — returns platform info and services array with status (connected/configured/missing) and masked details.',
        userFlow: 'Infrastructure overview showing all system integrations and their connection status. Displays:\n- Platform card: framework (Next.js 14), Node runtime version, hosting (Vercel/Local), region, environment, git commit, and domain.\n- Services summary bar: count of active vs total, with colour-coded breakdown (green=connected, amber=configured, red=not configured).\n- Service cards for each integration: Supabase (database), IMAP/Zoho (email polling), Google Drive (file storage), Mollie (payments), Resend (transactional email), RDW (vehicle registry). Each card shows connection details with secrets properly masked.',
        inputs: 'None (read-only status display).',
        outputs: 'Platform information and service connection statuses.',
        crossScreen: 'Shows status of integrations used by: IMAP Monitor (SY25), Google Drive (SY30), Invoices/Mollie (FA), Email/Resend, Vehicles/RDW (VH).',
      },
      {
        code: 'SY40',
        agentNotes: 'GET /api/vehicle-brands — list all brands. POST /api/vehicle-brands — create brand { name }. PATCH /api/vehicle-brands/[id] — update sort_order. DELETE /api/vehicle-brands/[id]. GET /api/vehicle-brands/[id]/models — list models. POST /api/vehicle-brands/[id]/models — create model { name }. DELETE /api/vehicle-models/[id].',
        userFlow: 'Manage the vehicle brand and model reference data used throughout the system. Add a brand by typing a name and clicking Add. Brands appear as expandable accordion rows — click to expand and see the models underneath.\n\nEach brand shows its name, model count badge, and a sort order number (click to edit inline). Expand a brand to see its models, each with an editable sort order and delete button. Use "Add model" to create a new model under the expanded brand.\n\nSort order controls the display sequence in dropdowns across the system.',
        inputs: 'New brand name. New model name (inline under expanded brand). Sort order (inline number edit). Delete actions with confirmation.',
        outputs: 'Created, reordered, or deleted brand and model records.',
        crossScreen: 'Brands and models populate the make/model fields in Vehicle creation (VH01) and Vehicle Detail (VH10). Sort order determines dropdown display sequence.',
      },
      {
        code: 'SY45',
        agentNotes: 'GET /api/labour-rates?active=false — fetch all rates including inactive. POST /api/labour-rates — create rate. PATCH /api/labour-rates/[id] — update individual fields. DELETE /api/labour-rates/[id]. All prices in integer cents. Fields: name, kind (labour/part/material/other), payer_type, unit, unit_price_cents, tax_code (H21/L9/N0), is_default, active.',
        userFlow: 'Manage labour and material rates used in offers and invoices. All rates are displayed in an editable data grid — every field is directly editable inline. Each row has a coloured left border by kind: blue for labour, orange for part, purple for material, grey for other.\n\nColumns: name, kind, payer type (or "All"), unit (e.g. "uur"), unit price (displayed in euros, stored as cents), tax code (21%/9%/0%), default checkbox, active checkbox, and delete button.\n\nAdd a new rate using the bottom row. Changes auto-save on blur or toggle.',
        inputs: 'All fields editable inline: name, kind, payer type, unit, unit price (euros), tax code, is_default, active. New rate row at bottom. Delete button per row.',
        outputs: 'Created, updated, or deleted rate records. Prices stored in integer cents.',
        crossScreen: 'Rates are consumed by Offer line items (ES01) as defaults when adding lines. Kind and tax code determine VAT treatment in Invoices (FA) and VAT Dashboard (BW05).',
      },
      {
        code: 'SY50',
        agentNotes: 'GET /api/infra/secrets — returns grouped env vars with masked values, isSet status, scope (server/public), and summary counts. POST /api/infra/secrets { action: "test", service?: string } — tests connectivity to Supabase, Mollie, and/or Resend APIs. Returns latency and status per service.',
        userFlow: 'Environment secrets vault showing all API keys, webhook secrets, and service credentials grouped by integration (Supabase, Mollie, Resend, IMAP, Google Drive, Vercel, Application). Summary bar shows total variables, configured count, and missing required count.\n\nEach group shows its service name, icon, status badge (all set / N missing / optional), and description. Expand the eye icon to reveal masked values (first 4 + dots + last 4 characters). Testable services (Supabase, Mollie, Resend) have a Test button that checks live connectivity and reports latency. "Test All" runs all service tests at once.\n\nThe secrets table per group shows: environment variable name, label, scope (server/public badge), status (set/not set/optional), and masked value.',
        inputs: 'Eye toggle to show/hide masked values. Test button per service. Test All button.',
        outputs: 'Service connectivity status with latency. Masked secret values. Summary statistics.',
        crossScreen: 'Shows configuration status of all integrations used by other screens: Supabase (database), IMAP (SY25), Google Drive (SY30), Mollie (FA), Resend (email). Related to Infrastructure overview (SY35).',
      },
      {
        code: 'AN05',
        agentNotes: 'GET /api/analytics?period=3d&channel=all — returns summary (totalSessions, bounceRate, avgPages, avgDuration), channels[], entryPages[], exitPages[], countries[], devices[], browsers[], daily[], sessions[]. POST /api/analytics/track — public endpoint, no auth. Actions: start (creates session + first pageview), pageview (adds pageview + updates session counts), end (updates duration/exit page). Session tracking uses sessionStorage with 30-min TTL, no cookies. Geo from Vercel headers (x-vercel-ip-country, x-vercel-ip-city). Bot detection via user-agent patterns.',
        userFlow: 'Website analytics dashboard showing visitor sessions on colourking.nl. Summary cards at top: Total Sessions, Bounce Rate, Avg Pages/Session, Avg Duration. Use the period filter (24h, 3d, 7d, 30d, 90d) and channel dropdown (all, direct, referral, organic search, social, AI, email) to narrow data.\n\nSessions Over Time bar chart shows daily session counts for the selected period. Five breakdown panels show: Channels (traffic sources), Top Entry Pages (where visitors land), Top Exit Pages (where they leave), Top Countries (with flag emoji), Top Devices (desktop/mobile/tablet).\n\nThe sessions table lists individual visits with: start time, session ID (first 8 chars), duration, page count, entry page, exit page, location (country flag + name + city), device icon, and channel badge. Filter sessions by ID using the search field. Bot traffic is automatically excluded.',
        inputs: 'Period selector (24h/3d/7d/30d/90d), channel dropdown, session ID filter, refresh button.',
        outputs: 'Summary statistics, sessions over time chart, breakdown panels (channels, entry/exit pages, countries, devices), sessions table.',
        crossScreen: 'Tracking is embedded in the public layout via SiteTracker component. Sessions are recorded passively as visitors browse. Data comes from site_sessions and site_pageviews tables. No relation to internal user actions.',
      },
    ],
  },
];

function getScreenTitle(code: string): string {
  const entry = Object.values(SCREEN_REGISTRY).find((s) => s.id === code);
  return entry ? `${entry.title} (${entry.titleNl})` : code;
}

export default function ManualPage() {
  const t = useTranslations('nav');
  const tSy = useTranslations('sy');
  const [tab, setTab] = useState<Tab>('user');
  const [expandedModule, setExpandedModule] = useState<string | null>('leads');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'user', label: 'End User Manual', icon: <BookOpenCheck className="h-4 w-4" /> },
    { key: 'agent', label: 'AI Agent Guide', icon: <Bot className="h-4 w-4" /> },
    { key: 'flow', label: 'Business Flow', icon: <GitBranch className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-white">
              {tab === 'user' ? 'End User Manual' : tab === 'agent' ? 'AI Agent Quick Reference' : 'Business Flow Chart'}
            </h1>
            <ScreenBadge code="SY10" />
          </div>
          <p className="mt-1 text-sm text-[#6b6b80]">
            {tab === 'user'
              ? 'Complete guide to every screen: what it does, how to use it, and how it connects to other parts of the system.'
              : tab === 'agent'
              ? 'Machine-readable reference for AI agents to understand, navigate, and test the Colourking system.'
              : 'Visual end-to-end overview of all modules, screens, state machines, and how data flows through the system.'}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-[#E8364E] text-white'
                : 'border border-[#1e1e2a] bg-[#12121a] text-[#6b6b80] hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* AI Agent Tab */}
      {tab === 'agent' && (
        <div className="space-y-4">
          {/* System overview card */}
          <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
            <h2 className="text-base font-medium text-white">System Overview</h2>
            <div className="mt-4 space-y-3 text-sm text-[#6b6b80]">
              <p><span className="text-white">Stack:</span> Next.js 14 App Router + Supabase + Vercel + Tailwind CSS</p>
              <p><span className="text-white">Auth:</span> Supabase Auth with 3 roles (admin, office, tech). Session checked in middleware for /app/* routes.</p>
              <p><span className="text-white">API pattern:</span> All data via /api/* routes. RESTful. JSON request/response. Auth via Supabase session cookie.</p>
              <p><span className="text-white">Money:</span> All monetary values stored as integer cents. Never use floats. Display via formatCurrency(cents, locale).</p>
              <p><span className="text-white">i18n:</span> 3 locales (nl, en, tr) via next-intl. All strings in src/messages/*.json. Screen codes (JB10, ES20...) are never translated.</p>
              <p><span className="text-white">Domains:</span> colourking.nl (public), admin.colourking.nl (admin app), monitor.colourking.nl (monitoring)</p>
              <p><span className="text-white">Database:</span> Supabase PostgreSQL. All schema changes via migration files in supabase/migrations/. RLS enabled on all tables.</p>
            </div>
          </div>

          {/* Business flow */}
          <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
            <h2 className="text-base font-medium text-white">Core Business Flow</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {['Lead', 'Offer', 'Approval', 'Repair Order', 'Job', 'Parts', 'Tasks', 'Handover', 'Invoice', 'Paid', 'Delivered'].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="rounded-md bg-[#0a0a0f] px-3 py-1.5 text-white">{step}</span>
                  {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-[#6b6b80]" />}
                </span>
              ))}
            </div>
          </div>

          {/* State machines */}
          <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
            <h2 className="text-base font-medium text-white">State Machines</h2>
            <div className="mt-4 space-y-4">
              {[
                { name: 'Lead Status', flow: 'new → contacted → quoted → won | lost (terminal from any non-terminal state)' },
                { name: 'Inspection Status', flow: 'draft → in_progress → review → locked (immutable after lock, snapshot hash created)' },
                { name: 'Offer Status', flow: 'draft → sent (guard: has_lines) → approved | rejected | superseded' },
                { name: 'Job Stage', flow: 'intake → quoted → approved → scheduled → checked_in → in_progress → qc → ready → delivered → closed (qc can loop back to in_progress)' },
                { name: 'Invoice Status', flow: 'draft → sent (guard: has_lines) → paid | overdue | credited | cancelled (only draft can be cancelled; sent uses credit notes)' },
                { name: 'Part Status', flow: 'needed → ordered → shipped → received | returned' },
                { name: 'Task Status', flow: 'todo → in_progress → done (any → blocked, blocked → todo)' },
                { name: 'Document Status', flow: 'draft → issued → cancelled (invoices cannot be cancelled — use credit notes)' },
                { name: 'VAT Return', flow: 'open → draft → filed (LOCKED) → corrected (filed returns are immutable)' },
                { name: 'Appointment', flow: 'requested → confirmed → completed | cancelled (inspections auto-confirm)' },
              ].map((sm) => (
                <div key={sm.name}>
                  <p className="text-sm font-medium text-white">{sm.name}</p>
                  <p className="mt-1 text-xs text-[#6b6b80] font-mono">{sm.flow}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-screen API reference */}
          <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
            <h2 className="text-base font-medium text-white">Screen API Reference</h2>
            <div className="mt-4 space-y-3">
              {MODULES.flatMap((m) =>
                m.screens.map((s) => (
                  <div key={s.code} className="border-b border-[#1e1e2a] pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-white">
                      <span className="mr-2 rounded bg-[#0a0a0f] px-1.5 py-0.5 text-xs font-mono text-[#E8364E]">{s.code}</span>
                      {getScreenTitle(s.code)}
                    </p>
                    <p className="mt-1 text-xs text-[#6b6b80] font-mono leading-relaxed">{s.agentNotes}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Hard rules */}
          <div className="rounded-[10px] border border-[#E8364E]/20 bg-[#E8364E]/5 p-6">
            <h2 className="text-base font-medium text-[#E8364E]">Hard Rules (Never Violate)</h2>
            <ul className="mt-4 space-y-2 text-sm text-[#6b6b80]">
              <li>1. All schema changes via migration files in supabase/migrations/. Never use the Supabase dashboard.</li>
              <li>2. Regenerate src/types/database.ts after every migration, same commit.</li>
              <li>3. Never use SUPABASE_SERVICE_ROLE_KEY in client components or app/(public).</li>
              <li>4. Never edit an issued document or locked VAT period. Supersede or correct instead.</li>
              <li>5. Money is stored in cents as integers. Never floats.</li>
              <li>6. All user-facing strings go through next-intl. No hardcoded Dutch.</li>
              <li>7. Screen codes (JB10, ES20...) are never translated and never renamed.</li>
              <li>8. New tables must have RLS enabled and a policy.</li>
              <li>9. New screens must be registered in lib/codes.ts.</li>
              <li>10. New strings must exist in all three locales (en, nl, tr).</li>
            </ul>
          </div>
        </div>
      )}

      {/* User Manual Tab */}
      {tab === 'user' && (
        <div className="space-y-2">
          {/* Overview card */}
          <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
            <h2 className="text-base font-medium text-white">Welcome to Colourking</h2>
            <p className="mt-2 text-sm text-[#6b6b80]">
              Colourking is a complete bodyshop management system. It handles the full workflow from receiving a customer enquiry (lead), through quoting, repair, and final delivery with invoicing. Use the sections below to learn how each part of the system works and how they connect to each other.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Lead', 'Offer', 'Approval', 'Repair Order', 'Job', 'Parts', 'Tasks', 'QC', 'Handover', 'Invoice', 'Payment', 'Delivered'].map((step, i) => (
                <span key={step} className="flex items-center gap-1 text-xs">
                  <span className="rounded-md bg-[#0a0a0f] px-2 py-1 text-white">{i + 1}. {step}</span>
                </span>
              ))}
            </div>
          </div>

          {MODULES.map((mod) => (
            <div key={mod.id} className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a]">
              <button
                onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded bg-[#0a0a0f] px-2 py-1 text-xs font-mono text-[#E8364E]">{mod.code}</span>
                  <span className="text-sm font-medium capitalize text-white">{mod.id}</span>
                  <span className="text-xs text-[#6b6b80]">{mod.screens.length} screen{mod.screens.length > 1 ? 's' : ''}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#6b6b80] transition-transform ${expandedModule === mod.id ? 'rotate-180' : ''}`} />
              </button>

              {expandedModule === mod.id && (
                <div className="border-t border-[#1e1e2a] p-4 space-y-6">
                  {mod.screens.map((s) => (
                    <div key={s.code} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#0a0a0f] px-1.5 py-0.5 text-xs font-mono text-[#E8364E]">{s.code}</span>
                        <h3 className="text-sm font-medium text-white">{getScreenTitle(s.code)}</h3>
                      </div>

                      <div className="space-y-2 pl-4 border-l-2 border-[#1e1e2a]">
                        <div>
                          <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">How it works</p>
                          <p className="mt-1 text-sm text-[#6b6b80] leading-relaxed whitespace-pre-line">{s.userFlow}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">Inputs</p>
                          <p className="mt-1 text-sm text-[#6b6b80]">{s.inputs}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">Outputs</p>
                          <p className="mt-1 text-sm text-[#6b6b80]">{s.outputs}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">Cross-screen effects</p>
                          <p className="mt-1 text-sm text-[#6b6b80]">{s.crossScreen}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Business Flow Tab */}
      {tab === 'flow' && <BusinessFlowChart />}
    </div>
  );
}
