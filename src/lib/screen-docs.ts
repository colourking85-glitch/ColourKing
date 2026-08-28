export type ScreenDoc = {
  code: string;
  agentNotes: string;
  userFlow: string;
  inputs: string;
  outputs: string;
  crossScreen: string;
};

export type ModuleDoc = {
  id: string;
  code: string;
  screens: ScreenDoc[];
};

export const MODULES: ModuleDoc[] = [
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
        userFlow: 'View full lead details. The header shows the current status with transition buttons. Click "Contacted" to mark follow-up done. Click "Quoted" after sending an offer. Click "Won" when the job is confirmed. Click "Lost" to close — you must enter a reason.\n\nUse the sidebar buttons to create a customer or offer from this lead.\n\nPhoto gallery: Upload damage photos (supports mobile camera capture on Android/iOS). Click a photo to open the zoomable viewer with pan and zoom controls.\n\nEmail reply: Send a direct email reply to the customer from the lead detail page. The reply is logged in the lead timeline.',
        inputs: 'Status transition (button click). Lost reason (text, required when marking lost). Photo upload (camera/file). Email reply (text).',
        outputs: 'Updated lead status. Photo gallery with zoomable viewer. Email reply log. When creating customer/offer from lead, the new records link back to this lead.',
        crossScreen: 'Creates Customer (KL01), Vehicle (VH01), or Offer (ES01). Status changes trigger stage_change notifications (SY05). Lost reason is stored for conversion analytics (RP10). Photos are compatible with Android and iOS mobile browsers.',
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
        userFlow: 'Edit an existing customer record. The form loads pre-filled with current data. All fields from customer creation are editable. Save to apply changes and return to the customer detail page.',
        inputs: 'Type, locale, name (required), email, phone, address, postcode, city, VAT number, notes. Save and Cancel buttons.',
        outputs: 'Updated customer record. Redirects to Customer Detail (KL02) on success.',
        crossScreen: 'Accessed from Customer Detail (KL02) via the Edit button. Returns to KL02 on save or cancel.',
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
        userFlow: 'Browse all vehicles. Table shows kenteken (license plate), make/model/year, colour, owner name, and WOK status. WOK means the vehicle is a total loss — shown as an amber warning. Search by kenteken or vehicle details.',
        inputs: 'Search query.',
        outputs: 'Filtered vehicle list.',
        crossScreen: 'Vehicles link to their owner (KL02), and appear on Offers (ES), Jobs (JB), and Invoices (FA).',
      },
      {
        code: 'VH01',
        agentNotes: 'POST /api/vehicles — body: { customer_id (required), kenteken?, vin?, make?, model?, year?, colour?, paint_code?, fuel?, body_type?, wok? }. RDW lookup: GET /api/rdw?kenteken=XX-XXX-X.',
        userFlow: 'Enter a kenteken and click the search button to auto-fill vehicle data from the RDW (Dutch vehicle registry). Select the owner customer (required). Review and adjust the auto-filled fields.',
        inputs: 'Owner (required), kenteken, VIN, make, model, year, colour, paint code, fuel, body type, WOK checkbox.',
        outputs: 'New vehicle record linked to the selected customer.',
        crossScreen: 'RDW API provides auto-fill data. Vehicle appears in Vehicle List (VH05) and on the owner\'s Customer Detail (KL02).',
      },
      {
        code: 'VH10',
        agentNotes: 'GET /api/vehicles/[id] — returns vehicle with joined customer. PATCH /api/vehicles/[id] — update individual fields. DELETE /api/vehicles/[id]. Inline editing via per-field PATCH calls.',
        userFlow: 'Full detail view for a single vehicle. Inline editing for all fields. Status bar with four clickable buttons. RDW Data section displays read-only registry snapshot fields.',
        inputs: 'Inline field editing (click pencil icon, edit, blur/Enter to save). Status buttons. Notes. Delete with confirmation.',
        outputs: 'Updated vehicle fields (saved per-field on blur). Status changes.',
        crossScreen: 'Owner card links to Customer Detail (KL02). Vehicle appears on Offers (ES), Jobs (JB), and Invoices (FA).',
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
        userFlow: 'Browse all offers. Table shows offer number, type, customer, vehicle, total amount, status badge, and date. Filter by type and status. Click a row to open details.',
        inputs: 'Search query, type filter, status filter.',
        outputs: 'Filtered offer list.',
        crossScreen: 'Offers originate from Leads (LD10). Approved offers can generate Invoices (FA01) and Jobs (JB01).',
      },
      {
        code: 'ES01',
        agentNotes: 'POST /api/offers — body: { customer_id (required), vehicle_id?, origin?, valid_until?, locale?, notes?, lines: [{ kind, description, quantity, unit_price_cents, discount_pct, unit, tax_code, part_number }] }. Tax codes: H21=21%, L9=9%, N0=0%.',
        userFlow: 'Select a customer (required) and optionally a vehicle. Add line items with kind, description, quantity, unit price, discount %, and tax code. The running total updates live. Submit to create as draft.',
        inputs: 'Customer (required), vehicle, origin, valid until, locale, notes, line items.',
        outputs: 'Draft offer with auto-calculated totals. Money stored in integer cents.',
        crossScreen: 'Created offer links to Customer (KL) and Vehicle (VH). Approved offers feed into Invoice creation (FA01) and Job creation (JB01).',
      },
      {
        code: 'ES10',
        agentNotes: 'GET /api/offers/[id]. PATCH /api/offers/[id]/status — transitions: draft→sent, sent→approved|rejected|superseded. Lines editable only in draft. Preview at /app/offertes/[id]/preview.',
        userFlow: 'View offer details with line items and totals. Actions depend on status: Draft (edit lines, send), Sent (approve/reject/supersede), Approved/Rejected/Superseded (view-only). Preview button for print-ready output.',
        inputs: 'Status transitions with required data. Line item add/remove in draft. Preview button.',
        outputs: 'Updated offer status. Supersede creates a new draft linked to the original.',
        crossScreen: 'Approval triggers availability for Invoice (FA01) and Job (JB01) creation. Preview uses QuoteTemplate module.',
      },
    ],
  },
  {
    id: 'jobs',
    code: 'JB',
    screens: [
      {
        code: 'JB01',
        agentNotes: 'POST /api/jobs — body: { customer_id (required), vehicle_id (required), offer_id?, job_type, priority, payer_type, assigned_to?, estimated_hours?, target_date?, estimated_delivery_at?, intake_km?, notes? }. Selecting an offer auto-fills customer, vehicle, and notes.',
        userFlow: 'Create a new repair job. Optionally link to an approved offer. Select customer and vehicle (both required). Choose job type, priority, payer type. Assign a technician, set estimated hours, target date, estimated delivery, and intake mileage. Add processes as sub-tasks. Upload intake photos.',
        inputs: 'Offer (optional), customer (required), vehicle (required), job type, priority, payer type, technician, estimated hours, target date, estimated delivery, intake km, notes, photos, process rows.',
        outputs: 'New job record plus one Task (TS) per process row. Photos uploaded after creation. Redirects to Job Detail (JB10).',
        crossScreen: 'Offer dropdown shows approved offers from ES10. Created tasks appear in My Tasks (TS05). Job appears in Job List (JB05) and Board (JB15).',
      },
      {
        code: 'JB05',
        agentNotes: 'GET /api/jobs — returns array. Filter by stage. 10 stages: intake, quoted, approved, scheduled, checked_in, in_progress, qc, ready, delivered, closed.',
        userFlow: 'Browse all jobs. Table shows job number, stage badge, customer, vehicle, and date. Filter by stage. Click a row for details, or switch to Board view for visual Kanban.',
        inputs: 'Search query, stage filter.',
        outputs: 'Filtered job list.',
        crossScreen: 'Jobs originate from approved Offers (ES10). Parts (PT05) and Tasks (TS05) are linked to jobs.',
      },
      {
        code: 'JB15',
        agentNotes: 'GET /api/jobs — visual Kanban grouped by stage. No drag-and-drop yet.',
        userFlow: 'Workshop Board shows all active jobs as a Kanban board. Each column is a stage. Cards show job number, date, customer, and vehicle. Click any card to open its detail page.',
        inputs: 'None (displays all non-closed jobs).',
        outputs: 'Visual board with job counts per stage.',
        crossScreen: 'Each card links to Job Detail (JB10).',
      },
      {
        code: 'JB10',
        agentNotes: 'GET /api/jobs/[id]. PATCH /api/jobs/[id] — stage transitions follow linear pipeline with QC rework loop. POST /api/jobs/[id]/photos — multipart upload with phase tag. POST /api/jobs/[id]/events — add note.',
        userFlow: 'Full job management view. Stage progress bar with transition buttons. Upload photos tagged by phase (before/during/after). Add notes to the audit trail. Event timeline tracks all changes. Estimated delivery date displayed when set.',
        inputs: 'Stage transitions. Photo uploads with phase tags. Notes.',
        outputs: 'Updated job stage. Photo gallery. Event timeline.',
        crossScreen: 'Stage changes trigger notifications (SY05). Parts (PT05) blocking flags can prevent stage advancement. Tasks (TS05) linked for labour tracking. Handover note (DO21) at ready stage.',
      },
    ],
  },
  {
    id: 'parts',
    code: 'PT',
    screens: [
      {
        code: 'PT05',
        agentNotes: 'GET /api/parts — returns array with joined job data. Filters: search, status, blocking flag.',
        userFlow: 'Track all parts across jobs. Table shows description, part number, supplier, quantity, unit price, total, status badge, and blocking indicator. A blocking part prevents the linked job from advancing past certain stages.',
        inputs: 'Search query, status filter, blocking filter.',
        outputs: 'Filtered parts list with costs and blocking indicators.',
        crossScreen: 'Parts are linked to Jobs (JB10). Blocking parts affect job stage transitions. Part costs feed into Offer line items (ES01).',
      },
      {
        code: 'PT01',
        agentNotes: 'POST /api/parts — body: { job_id, description (required), part_number?, supplier?, quantity?, unit_price_cents?, blocking?, notes? }.',
        userFlow: 'Add a new part to a job. Select the job, enter description (required), part number, supplier, quantity, and unit price. Check "Blocking" if the job cannot proceed without this part.',
        inputs: 'Job (required), description (required), part number, supplier, quantity, unit price, blocking, notes.',
        outputs: 'New part record with status "needed" and calculated total in cents.',
        crossScreen: 'Part appears in Parts List (PT05) and on the linked Job Detail (JB10).',
      },
    ],
  },
  {
    id: 'invoices',
    code: 'FA',
    screens: [
      {
        code: 'FA05',
        agentNotes: 'GET /api/invoices — returns array. Filters: search, status. Overdue auto-calculated from due_date.',
        userFlow: 'Browse all invoices. Table shows invoice number, customer, date, due date (red if overdue), total, and status badge. Filter by status.',
        inputs: 'Search query, status filter.',
        outputs: 'Filtered invoice list.',
        crossScreen: 'Invoices are created from approved Offers (ES10). Payments link to Mollie. VAT amounts feed into VAT Dashboard (BW05).',
      },
      {
        code: 'FA01',
        agentNotes: 'POST /api/invoices — body: { offer_id (approved only), due_date?, payment_terms? }. Lines copied from offer. Due date defaults to +30 days.',
        userFlow: 'Create an invoice from an approved offer. Line items are copied automatically. Set the due date and payment terms.',
        inputs: 'Offer (approved only), due date, payment terms.',
        outputs: 'Draft invoice with lines from the selected offer.',
        crossScreen: 'Links to the source Offer (ES10). Appears in Invoice List (FA05) and Document Archive (DO05).',
      },
      {
        code: 'FA10',
        agentNotes: 'GET /api/invoices/[id]. Actions: issue (draft→sent), record payment, credit note. Payment link uses public URL via Mollie. Preview at /app/facturen/[id]/preview.',
        userFlow: 'View the full professional invoice. Actions by status: Draft (issue, delete, preview), Sent/Overdue (record payment, credit note, payment link), Paid/Credited/Cancelled (view-only). Preview for print-ready output.',
        inputs: 'Issue, payment recording, credit note, payment link, preview, print.',
        outputs: 'Updated invoice status. Payment records. Credit notes. Public payment URL via Mollie.',
        crossScreen: 'Payments update Reports (RP10) and Dashboard (RP01). VAT amounts feed into BW05. Preview uses InvoiceTemplate module.',
      },
    ],
  },
  {
    id: 'documents',
    code: 'DO',
    screens: [
      {
        code: 'DO05',
        agentNotes: 'GET /api/documents — returns array. Filters: search, doc_type, status.',
        userFlow: 'Central archive of all system documents. Filter by document type and status. Each row shows document number, type badge, customer, vehicle, status, and date.',
        inputs: 'Search query, document type filter, status filter.',
        outputs: 'Filtered document list.',
        crossScreen: 'Documents are generated by Offers (ES), Jobs (JB), and Invoices (FA).',
      },
      {
        code: 'DO03',
        agentNotes: 'GET /api/documents/[id] — returns document with frozen payload and integrity hash.',
        userFlow: 'View document details. Shows document number, type, status, issue date, frozen payload, and SHA-256 integrity hash.',
        inputs: 'None (read-only view).',
        outputs: 'Complete document with frozen payload and integrity verification.',
        crossScreen: 'Links back to source records: Offer (ES10), Invoice (FA10), Job (JB10).',
      },
      {
        code: 'DO20',
        agentNotes: 'GET /api/repair-order/[id]. POST /api/repair-order — creates from job_id. Auto-numbered via SY03.',
        userFlow: 'View or print the Repair Order. Generated from a Job once it reaches the approved stage. Print-ready A4 layout.',
        inputs: 'Generated from Job (no manual input).',
        outputs: 'Numbered repair order document (print-ready A4).',
        crossScreen: 'Created from Job Detail (JB10). Number prefix set in Number Ranges (SY03). Stored in Document Archive (DO05).',
      },
      {
        code: 'DO22',
        agentNotes: 'GET /api/handover-notes?search= — returns array of handover note summaries.',
        userFlow: 'Browse all handover notes in a searchable table. Columns show document number, status badge, customer name, vehicle, and date.',
        inputs: 'Search query.',
        outputs: 'Filtered handover notes list.',
        crossScreen: 'Each row links to Handover Note detail (DO21). Created from Job Detail (JB10).',
      },
      {
        code: 'DO21',
        agentNotes: 'GET /api/handover-notes/[id]. PATCH for issue/share/gallery_consent. Public view and sign via share_token.',
        userFlow: 'View and manage a handover note. Draft: edit payload, issue. Issued: share for customer signature, print. Public view supports signature canvas and gallery consent.',
        inputs: 'Draft fields, issue, share, print, signature canvas.',
        outputs: 'Issued handover note. Share token. Signature records. Print-ready document.',
        crossScreen: 'Created from Job Detail (JB10). Accessible from Handover Notes list (DO22) and Document Archive (DO05).',
      },
    ],
  },
  {
    id: 'appointments',
    code: 'AP',
    screens: [
      {
        code: 'AP05',
        agentNotes: 'GET /api/appointments — returns array. Filters: date range, type, resource.',
        userFlow: 'Weekly calendar view (07:00-18:00). Appointments colour-coded by type. Border style indicates status. Navigate weeks, filter by type and resource.',
        inputs: 'Week navigation, type filter, resource filter.',
        outputs: 'Visual weekly calendar with appointment blocks.',
        crossScreen: 'Appointments link to Customers (KL) and Vehicles (VH). Status changes trigger notifications (SY05).',
      },
      {
        code: 'AP01',
        agentNotes: 'POST /api/appointments — body: { type, contact_name, phone?, email?, date, time_slot, duration_minutes, resource_id?, customer_id?, vehicle_id?, notes? }. Available slots: GET /api/appointments/slots?date=.',
        userFlow: 'Create a new appointment. Select type, enter contact name, pick a date and available time slot. Choose duration and optionally assign a resource.',
        inputs: 'Type (required), contact name (required), phone, email, date, time slot, duration, resource, customer/vehicle, notes.',
        outputs: 'New appointment. Inspections auto-confirm; others start as "requested".',
        crossScreen: 'Appointment appears in Calendar (AP05). Confirmation triggers notification (SY05).',
      },
      {
        code: 'AP10',
        agentNotes: 'GET /api/appointments/[id]. PATCH — status transitions: confirm, complete, cancel. DELETE.',
        userFlow: 'Detail view for a single appointment. Shows date, time, contact details, resource. Action buttons depend on status.',
        inputs: 'Status transition buttons (Confirm, Complete, Cancel). Delete.',
        outputs: 'Updated appointment status.',
        crossScreen: 'Links to Customer Detail (KL02) and Vehicle Detail (VH10). Status changes trigger notifications (SY05).',
      },
    ],
  },
  {
    id: 'tasks',
    code: 'TS',
    screens: [
      {
        code: 'TS05',
        agentNotes: 'GET /api/tasks — returns array. Filters: status, assigned_to. Includes time entries. PATCH /api/tasks/[id] for status and clock in/out.',
        userFlow: 'View your assigned tasks grouped by status. Each card shows job number, title, assigned staff, and estimated vs actual minutes. Clock in/out buttons track active work time.',
        inputs: 'Status transitions, clock in/out actions.',
        outputs: 'Updated task status and time tracking entries.',
        crossScreen: 'Tasks linked to Jobs (JB10). Time entries feed into Timesheet (TS10) and Reports (RP10).',
      },
      {
        code: 'TS01',
        agentNotes: 'POST /api/tasks — body: { job_id, title, description?, assigned_to?, estimated_minutes? }.',
        userFlow: 'Create a new task linked to a job. Enter title, description, assign to a staff member, and set estimated time.',
        inputs: 'Job (required), title (required), description, assigned staff, estimated minutes.',
        outputs: 'New task with status "todo".',
        crossScreen: 'Task appears in My Tasks (TS05). Linked to Job Detail (JB10).',
      },
      {
        code: 'TS10',
        agentNotes: 'GET /api/planning — returns time entries grouped by staff and day. Week view with totals.',
        userFlow: 'Week-view grid showing all staff hours. Rows are staff, columns are days. Totals per staff member and per day.',
        inputs: 'Week navigation.',
        outputs: 'Time entry grid with duration, linked job and task.',
        crossScreen: 'Time data comes from Task clock in/out (TS05). Hours feed into Reports (RP10).',
      },
    ],
  },
  {
    id: 'reports',
    code: 'RP',
    screens: [
      {
        code: 'RP01',
        agentNotes: 'GET /api/dashboard — returns summary stats.',
        userFlow: 'Main dashboard with key metrics: open leads, active jobs, pending invoices, revenue this month. Upcoming appointments and recent activity feed.',
        inputs: 'None (auto-loaded).',
        outputs: 'Summary statistics, upcoming appointments, recent activity.',
        crossScreen: 'Aggregates data from Leads (LD), Jobs (JB), Invoices (FA), Appointments (AP).',
      },
      {
        code: 'RP10',
        agentNotes: 'GET /api/reports?type=revenue|jobs|workload|customers&from=&to=. Returns aggregated data.',
        userFlow: 'Four report tabs: Revenue, Jobs, Workload, Customers. Select a date range using presets or custom dates.',
        inputs: 'Report type tab, date range.',
        outputs: 'Aggregated charts and figures.',
        crossScreen: 'Pulls data from all modules: Invoices, Jobs, Tasks, Customers, Leads.',
      },
    ],
  },
  {
    id: 'vat',
    code: 'BW',
    screens: [
      {
        code: 'BW05',
        agentNotes: 'GET /api/vat-returns — returns array by year and period. Statuses: open, draft, filed (locked), corrected. NEVER edit a locked VAT period.',
        userFlow: 'Manage Dutch BTW aangifte returns. Each return shows all Dutch VAT boxes. Once filed, a return is permanently locked.',
        inputs: 'Year selector, period type toggle, filing action.',
        outputs: 'VAT return data with Dutch tax authority box numbers.',
        crossScreen: 'VAT amounts come from Invoices (FA05) and Purchases (PU05). Filed returns affect Bookkeeping Export (BK10).',
      },
      {
        code: 'BW40',
        agentNotes: 'Client-side only, no API calls. Pure calculation in integer cents.',
        userFlow: 'Quick calculator. Enter an amount and see the breakdown for all three Dutch VAT rates (21%, 9%, 0%).',
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
        agentNotes: 'GET /api/purchases — returns array. Filters: search, category, paid status.',
        userFlow: 'Register incoming purchase invoices from suppliers. Table shows supplier, date, amounts, tax code, category, and paid/unpaid status.',
        inputs: 'Search query, category filter, paid filter.',
        outputs: 'Filtered purchase list with totals.',
        crossScreen: 'Purchase VAT amounts feed into VAT Dashboard (BW05). Categories feed into Bookkeeping Export (BK10).',
      },
      {
        code: 'PU01',
        agentNotes: 'POST /api/purchases — body: { supplier_name, supplier_vat?, invoice_date, due_date?, subtotal_cents, tax_code, category, description?, reference?, job_id? }. VAT auto-calculated.',
        userFlow: 'Register a new purchase invoice. Enter supplier name, dates, subtotal, tax code, and category. The system auto-calculates VAT and total.',
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
        agentNotes: 'GET /api/bookkeeping/export?type=invoices|purchases|vat|pnl&period=. Returns CSV or summary data.',
        userFlow: 'Export financial data for your accountant. Select a period. Four export options: Invoices CSV, Purchases CSV, VAT Returns CSV, and Profit/Loss summary.',
        inputs: 'Period selector, export type button.',
        outputs: 'CSV file downloads. P&L summary view.',
        crossScreen: 'Aggregates data from Invoices (FA05), Purchases (PU05), and VAT Returns (BW05).',
      },
    ],
  },
  {
    id: 'settings',
    code: 'SY',
    screens: [
      {
        code: 'SY01',
        agentNotes: 'Client-side settings stored in localStorage/cookies.',
        userFlow: 'Configure the application: appearance (accent colour, theme, compact mode), general (company name, language, date format), notifications.',
        inputs: 'All settings fields, save button.',
        outputs: 'Updated application settings.',
        crossScreen: 'Language setting affects all screens. Notification toggles affect Monitoring (SY05).',
      },
      {
        code: 'SY02',
        agentNotes: 'GET /api/staff. POST /api/staff/invite. PATCH /api/staff/[id]. Roles: admin, office, tech.',
        userFlow: 'Manage staff members. View, invite, toggle active/inactive, change roles.',
        inputs: 'Invite: email, name, role. Toggle active/inactive. Edit role.',
        outputs: 'Staff records.',
        crossScreen: 'Staff roles affect permissions. Tech users appear in Task assignment (TS05).',
      },
      {
        code: 'SY03',
        agentNotes: 'GET /api/number-ranges. PATCH /api/number-ranges/[id] — update prefix.',
        userFlow: 'Configure document number prefixes per document type per year.',
        inputs: 'Prefix text per document type.',
        outputs: 'Updated number range with next-number preview.',
        crossScreen: 'Number prefixes affect all document creation screens.',
      },
      {
        code: 'SY05',
        agentNotes: 'GET /api/notifications. PATCH /api/notifications/[id] — mark read.',
        userFlow: 'Notification centre showing system events. Filter by type, mark as read, toggle sound and auto-refresh.',
        inputs: 'Filter pills, mark read actions, sound toggle, auto-refresh toggle.',
        outputs: 'Filtered notification list.',
        crossScreen: 'Receives events from Leads, Jobs, Invoices, Parts, Appointments.',
      },
      {
        code: 'SY10',
        agentNotes: 'Manual page with complete documentation for every screen.',
        userFlow: 'End User Manual and AI Agent Quick Reference. Browse documentation by module.',
        inputs: 'Tab selection (user/agent), module expand/collapse.',
        outputs: 'Documentation for every screen in the system.',
        crossScreen: 'Reference for all screens.',
      },
      {
        code: 'SY20',
        agentNotes: 'AI assistant panel. GET /api/ai/chat — streaming chat endpoint.',
        userFlow: 'AI assistant panel that answers questions about the system. Context-aware based on current screen.',
        inputs: 'Text prompt.',
        outputs: 'AI-generated response.',
        crossScreen: 'Available from any screen via the header button.',
      },
      {
        code: 'SY25',
        agentNotes: 'POST /api/email/imap-poll — triggers IMAP poll (auth: IMAP_POLL_SECRET). GET /api/email/imap-log — returns recent email_log entries. Matches [JB-ID], [LD-ID], [FA-ID], [ES-ID] in subject lines.',
        userFlow: 'Monitor incoming email replies from customers via the Zoho IMAP inbox (info@colourking.nl). Shows cron job configuration, countdown timer, "Poll Now" button, poll log, and captured replies panel listing emails matched to entities.',
        inputs: 'Poll Now button (triggers immediate IMAP check).',
        outputs: 'Poll results: number of emails processed, matched entities. Captured replies with sender, subject, snippet, and linked entity.',
        crossScreen: 'Matches emails to Jobs (JB), Leads (LD), Invoices (FA), and Offers (ES) by subject line patterns. Cron schedule visible in Cron Jobs (SY15).',
      },
      {
        code: 'SY30',
        agentNotes: 'GET /api/drive?folderId= — list files. GET /api/drive?search= — search. POST /api/drive (multipart) — upload. POST /api/drive (JSON, action:create_folder) — create folder. DELETE /api/drive?fileId= — delete. PATCH /api/drive (action:rename) — rename.',
        userFlow: 'Browse and manage files on the company Google Drive. Features: folder navigation with breadcrumb trail, search, upload, new folder, file list with metadata, and delete with confirmation.',
        inputs: 'Folder navigation, search query, file upload, folder creation, file deletion.',
        outputs: 'File listing with metadata. Uploaded files are public-readable.',
        crossScreen: 'Standalone file management. Files can be referenced from Jobs (JB) or Invoices (FA) by sharing the Drive link.',
      },
      {
        code: 'SY35',
        agentNotes: 'GET /api/infra/status — returns platform info and services array with status (connected/configured/missing) and masked details.',
        userFlow: 'Infrastructure overview showing all system integrations and their connection status. Displays platform card, services summary bar, and service cards for each integration.',
        inputs: 'None (read-only status display).',
        outputs: 'Platform information and service connection statuses.',
        crossScreen: 'Shows status of integrations used by: IMAP Monitor (SY25), Google Drive (SY30), Invoices/Mollie (FA), Email/Resend, Vehicles/RDW (VH).',
      },
      {
        code: 'SY40',
        agentNotes: 'GET /api/vehicle-brands — list all brands. POST /api/vehicle-brands — create brand { name }. PATCH /api/vehicle-brands/[id] — update sort_order. DELETE /api/vehicle-brands/[id]. GET /api/vehicle-brands/[id]/models — list models. POST /api/vehicle-brands/[id]/models — create model { name }. DELETE /api/vehicle-models/[id].',
        userFlow: 'Manage the vehicle brand and model reference data. Add brands, expand to see models. Each brand shows name, model count, and sort order. Sort order controls dropdown display sequence system-wide.',
        inputs: 'New brand name. New model name. Sort order (inline edit). Delete actions.',
        outputs: 'Created, reordered, or deleted brand and model records.',
        crossScreen: 'Brands and models populate make/model fields in Vehicle creation (VH01) and Vehicle Detail (VH10).',
      },
      {
        code: 'SY45',
        agentNotes: 'GET /api/labour-rates. All prices in integer cents.',
        userFlow: 'Manage labour and material rates. Editable data grid with inline editing. Rates grouped by kind with coloured borders.',
        inputs: 'All fields editable inline. New rate row at bottom. Delete per row.',
        outputs: 'Created, updated, or deleted rate records.',
        crossScreen: 'Rates consumed by Offer line items (ES01). Tax code determines VAT treatment.',
      },
      {
        code: 'SY50',
        agentNotes: 'GET /api/infra/secrets — returns grouped env vars with masked values. POST /api/infra/secrets for connectivity testing.',
        userFlow: 'Environment secrets vault showing all API keys grouped by integration. Test button checks live connectivity.',
        inputs: 'Eye toggle to show/hide values. Test button per service. Test All.',
        outputs: 'Service connectivity status with latency. Masked values.',
        crossScreen: 'Shows configuration status of all integrations.',
      },
    ],
  },
];

const DOC_INDEX = new Map<string, ScreenDoc>();
for (const mod of MODULES) {
  for (const s of mod.screens) {
    DOC_INDEX.set(s.code, s);
  }
}

export function getScreenDoc(code: string): ScreenDoc | undefined {
  return DOC_INDEX.get(code);
}
