# ColourKing End-to-End Test Scenarios

Production URLs:
- Public site: https://colourking.nl
- Admin panel: https://admin.colourking.nl
- Monitor: https://monitor.colourking.nl

---

## Scenario 1: Public Site Visitor Journey (Homepage to Lead in Admin)

**Description:** A potential customer visits the public website, browses services, and submits a quote request via the contact form. The resulting lead should appear in the admin panel's lead inbox.

**Preconditions:**
- Public site at colourking.nl is live and accessible
- Admin panel at admin.colourking.nl is accessible with a valid staff login (admin or office role)
- The leads inbox (/app/leads) is accessible and the current lead count is noted

**Steps:**

1. Navigate to https://colourking.nl/nl (Dutch homepage).
   - **Expected:** Homepage loads with hero section, stats section, services overview, and testimonials. Page is in Dutch. Navigation bar shows links to Diensten, Gallerij, Over Ons, Contact.

2. Click the "Diensten" (Services) link in the navigation.
   - **Expected:** Navigates to /nl/diensten. Page shows 8 service categories relevant to a bodyshop (e.g., paint repair, dent removal). All text is in Dutch.

3. Click the "Gallerij" (Gallery) link in the navigation.
   - **Expected:** Navigates to /nl/gallerij. Page displays a before/after photo grid.

4. Click the "Contact" link in the navigation.
   - **Expected:** Navigates to /nl/contact. A quote request form is visible with fields for name, email, phone, and message/description.

5. Fill in the contact form with test data:
   - Name: "Test Klant E2E"
   - Email: "test-e2e@example.com"
   - Phone: "0612345678"
   - Message: "Ik wil graag een offerte voor het spuiten van mijn auto. Test scenario."
   Submit the form.
   - **Expected:** Form submits successfully. A success message is shown confirming the request was received. No error toasts or console errors.

6. Log in to admin.colourking.nl with staff credentials.
   - **Expected:** Login page loads at /login. After entering valid credentials, redirect to /app (dashboard).

7. Navigate to the Leads inbox (/app/leads).
   - **Expected:** The lead from step 5 appears in the list with:
     - Name: "Test Klant E2E"
     - Email: "test-e2e@example.com"
     - Origin: "website"
     - Status: "new" (nieuw)

8. Click on the new lead to view its detail page.
   - **Expected:** Lead detail page (/app/leads/[id]) shows all submitted data: name, email, phone, message. The origin field shows "website". Status badge shows "new".

**Edge cases to check:**
- Submit the contact form with missing required fields (e.g., no email) and verify client-side validation prevents submission
- Submit with an invalid email format and verify validation catches it
- Submit a duplicate request with the same email and verify a second lead is created (no deduplication)
- Check that the public site returns proper SEO metadata (title, description) on each page
- Verify the quote request API at /api/public/quote-request rejects requests with missing fields (return 400)

---

## Scenario 2: Customer and Vehicle Onboarding with Quote

**Description:** An admin creates a new customer record, adds a vehicle using the RDW license plate lookup, and creates a quote (offer) linked to the customer and vehicle.

**Preconditions:**
- Logged into admin.colourking.nl with admin or office role
- A valid Dutch license plate number is known for the RDW lookup test (e.g., a common plate like "1-ABC-23" or use a plate you know returns data from the RDW open-data API)

**Steps:**

1. Navigate to Customers (/app/klanten) and click "New" or navigate to /app/klanten/nieuw.
   - **Expected:** Customer creation form (KL01) loads with fields for customer type (private/company/fleet/dealer), name, email, phone, address fields.

2. Fill in a new private customer:
   - Type: Particulier (Private)
   - Name: "Jan de Vries"
   - Email: "jan.devries@example.com"
   - Phone: "0687654321"
   - Street: "Keizersgracht 100"
   - City: "Amsterdam"
   - Postal code: "1015 AA"
   Save the customer.
   - **Expected:** Customer is created successfully. Redirect to customer detail page (/app/klanten/[id]) or customer list. Success toast/notification shown.

3. Navigate to Vehicles (/app/voertuigen) and click "New" or navigate to /app/voertuigen/nieuw.
   - **Expected:** Vehicle creation form (VH01) loads with a license plate field and an RDW lookup button.

4. Enter a Dutch license plate number and trigger the RDW lookup.
   - **Expected:** The RDW API is called (/api/rdw). Vehicle details are populated from the RDW response: make (merk), model (handelsbenaming), color (eerste_kleur), fuel type (brandstof), year of manufacture. The form fields auto-fill with this data.

5. Link the vehicle to the customer created in step 2 (select "Jan de Vries" from the customer dropdown/search).
   Save the vehicle.
   - **Expected:** Vehicle is created and linked to the customer. Redirect to vehicle list or detail page. The customer detail page (/app/klanten/[id]) should now show this vehicle in the customer's vehicles section.

6. Navigate to Quotes/Offers (/app/offertes) and click "New" or navigate to /app/offertes/nieuw.
   - **Expected:** Offer creation form (ES01) loads with customer and vehicle selectors.

7. Select customer "Jan de Vries" and the vehicle created in step 5. Save the draft offer.
   - **Expected:** A new offer is created in "draft" status with an auto-assigned offer number (from the number_ranges system). Redirect to offer detail page (/app/offertes/[id]).

8. Add line items to the offer:
   - Line 1: Kind = Labour, Description = "Spuitwerk motorkap", Quantity = 3, Unit price = 7500 (EUR 75.00 in cents), VAT = 21%
   - Line 2: Kind = Part, Description = "Lakset rood", Quantity = 1, Unit price = 12500, VAT = 21%
   - Line 3: Kind = Material, Description = "Schuurpapier P800", Quantity = 5, Unit price = 350, VAT = 21%
   - **Expected:** Each line is saved via the API (/api/offers/[id]/lines). Totals recalculate: subtotal = (3x75 + 125 + 5x3.50) = EUR 367.50. VAT at 21% = EUR 77.18. Grand total = EUR 444.68. All amounts display correctly formatted in EUR. Money is stored as integer cents in the database.

9. Verify the offer detail page shows the correct status badge ("draft") and all line items.
   - **Expected:** All 3 lines visible with correct descriptions, quantities, unit prices. Footer shows subtotal, VAT amount, and total inclusive of VAT.

**Edge cases to check:**
- Enter an invalid/nonexistent license plate in step 4 and verify a clear error message is shown (not a crash)
- Create a company customer (type = Bedrijf) and verify KvK number and BTW-id fields appear
- Try to create a customer with a duplicate email and observe behavior (should it warn or allow?)
- Add a line item with quantity 0 or negative price and verify validation rejects it
- Verify the offer number follows the configured number range format (check SY03 settings)
- Create a second version of the offer using supersede and verify the original is marked "superseded" and a new draft is created with the same lines copied

---

## Scenario 3: Invoice Workflow (Create, Send, Pay, Verify)

**Description:** Create an invoice from an approved offer (or manually), issue it, send it to the customer via email, have the customer access the payment page, and verify the payment flow through Mollie.

**Preconditions:**
- Logged into admin.colourking.nl with admin or office role
- An approved offer exists with at least one line item, linked to a customer with a valid email address
- Mollie API keys are configured (test mode keys are acceptable for testing)
- Resend API key is configured (or dry-run mode is active)

**Steps:**

1. Navigate to Invoices (/app/facturen) and click "New" or navigate to /app/facturen/nieuw.
   - **Expected:** Invoice creation form (FA01) loads. If creating from an offer, lines are pre-populated from the approved offer.

2. Create a new invoice linked to an existing customer. Add line items:
   - Line 1: Description = "Spuitwerk compleet", Quantity = 1, Unit price = 35000 (EUR 350.00), VAT = 21%
   - Line 2: Description = "Materiaalkosten", Quantity = 1, Unit price = 8500 (EUR 85.00), VAT = 21%
   Save as draft.
   - **Expected:** Invoice is saved in "draft" status with auto-assigned invoice number. Detail page (/app/facturen/[id]) shows: subtotal EUR 435.00, VAT EUR 91.35, total EUR 526.35. All amounts use integer cents internally.

3. Issue the invoice by clicking the "Issue" button/action.
   - **Expected:** API call to /api/invoices/[id]/issue succeeds. Status changes from "draft" to "sent" (or "issued"). The payload is frozen with a SHA-256 hash. The invoice can no longer be edited (fields become read-only). Issue date is set to today.

4. Send the invoice to the customer via email.
   - **Expected:** Email is sent via Resend API (or logged in dry-run mode). The email uses the invoice HTML template with company letterhead. The email contains a payment link.

5. Open the public payment page using the token link: /s/[token].
   - **Expected:** The public payment page loads (no login required). It displays the invoice summary: invoice number, customer name, line items, total amount. A "Pay now" / "Betaal nu" button is visible.

6. Click the payment button to initiate a Mollie payment.
   - **Expected:** Redirect to Mollie payment page (in test mode, this goes to a Mollie test environment). Payment methods are shown (iDEAL, card, bank transfer). In test mode, you can simulate a successful payment.

7. Complete the test payment in Mollie's test environment (select "Paid" status).
   - **Expected:** Mollie sends a webhook callback to /api/webhooks/mollie. The webhook updates the payment status.

8. Return to the invoice detail page in the admin panel (/app/facturen/[id]).
   - **Expected:** Invoice status has changed to "paid" (betaald). A payment record is visible in the payments section showing the amount, date, and Mollie payment ID.

9. Verify the invoice appears correctly in the invoice list (/app/facturen) with status "paid".
   - **Expected:** The invoice row shows the correct invoice number, customer name, total amount, and a "paid" status badge.

10. Attempt to create a credit note for this invoice.
    - **Expected:** A credit note can be created via /api/invoices/[id]/credit-note. It creates a new invoice with negative amounts mirroring the original. Direct cancellation/deletion of an issued invoice is NOT possible (system should prevent this per CLAUDE.md rule 4).

**Edge cases to check:**
- Try to edit an issued invoice and verify the system blocks changes (fields read-only, API rejects PATCH)
- Try to delete an issued invoice and verify it is rejected
- Create an invoice with mixed VAT rates (21% and 9%) and verify each VAT group is calculated separately
- Verify the Mollie webhook handles duplicate calls idempotently (same payment ID processed twice should not create duplicate payment records)
- Test the payment page with an expired or already-paid token and verify appropriate error messages
- Verify amounts never show floating-point rounding errors (all math uses integer cents)
- Send invoice email and verify the email preview endpoint (/api/email/preview) renders the correct template

---

## Scenario 4: VAT/BTW Return Cycle

**Description:** Calculate a quarterly VAT return from invoice and purchase data, file it, verify the period is locked, and test the correction flow.

**Preconditions:**
- Logged into admin.colourking.nl with admin or office role
- At least 2-3 invoices exist in "paid" or "sent" status with different VAT rates, dated within the target quarter
- At least 1-2 purchases exist in the purchase register with deductible input VAT, dated within the target quarter
- The target quarter has not been previously filed

**Steps:**

1. Navigate to the Purchase Register (/app/inkoop) and verify existing purchases.
   - **Expected:** Purchase list (PU05) loads showing existing purchases with columns for date, supplier, description, amount, VAT, category, and paid status.

2. If needed, create a test purchase via /app/inkoop/nieuw:
   - Supplier: "Verfgroothandel BV"
   - Description: "Autolak RAL 9005"
   - Category: Paint (verf)
   - Amount excl. VAT: 25000 (EUR 250.00)
   - VAT rate: 21%
   - VAT amount: 5250 (EUR 52.50)
   - Date: within the target quarter
   Save.
   - **Expected:** Purchase is saved. Total incl. VAT shows EUR 302.50. Category is set to "paint".

3. Navigate to the VAT Dashboard (/app/btw).
   - **Expected:** BW05 loads showing a year view with quarters (Q1-Q4) or months. Each period shows its status: open, draft, filed, or corrected.

4. Select the target quarter (e.g., Q2 2026) and click "Calculate" or "Berekenen".
   - **Expected:** API call to /api/vat/calculate triggers. The system calculates Dutch BTW aangifte boxes:
     - Box 1a: Supplies at 21% (leveringen belast met 21%)
     - Box 1b: Supplies at 9% (leveringen belast met 9%)
     - Box 1c: Supplies at other rates
     - Box 1d: Supplies private use
     - Box 1e: Supplies at 0% / reverse charge
     - Box 2a: Intra-community acquisitions
     - Box 3: Total turnover
     - Box 4: Total VAT owed (omzetbelasting)
     - Box 5a: Input VAT (voorbelasting) from purchases
     - Box 5b: Other deductions
     - Box 5c: Total deductible VAT
     - Box 5d: Balance (box 4 minus box 5c, positive = amount to pay)
   Amounts should match the invoices and purchases in the period.

5. Review the calculated amounts. Verify that:
   - Output VAT (box 4) sums the VAT from all invoices in the period grouped by rate
   - Input VAT (box 5a) sums the deductible VAT from all purchases in the period
   - The balance (box 5d) is the correct difference
   - **Expected:** All amounts are correct integers (cents). The return status is "draft".

6. File the VAT return by clicking "File" / "Indienen".
   - **Expected:** API call to /api/vat/[id]/file. Status changes from "draft" to "filed" (ingediend). The period is now LOCKED.

7. Verify the period is locked:
   a. Try to edit the filed VAT return.
   - **Expected:** The system prevents editing. Fields are read-only. API rejects PATCH requests to /api/vat/[id] when status is "filed".
   
   b. Try to edit or delete an invoice dated within the filed period.
   - **Expected:** The system should warn or prevent changes to invoices in a locked VAT period (per CLAUDE.md rule 4: never edit a locked VAT period).

8. Create a correction for the filed return by clicking "Correct" / "Corrigeren".
   - **Expected:** API call to /api/vat/[id]/correct. A new VAT return is created with status "corrected" referencing the original. The new return pre-fills with the filed amounts, allowing adjustments. The original filed return remains locked and unchanged.

9. Modify the correction amounts (e.g., adjust box 5a by adding a forgotten purchase) and file the correction.
   - **Expected:** The correction is filed. Both the original and correction appear in the year view with appropriate status badges.

**Edge cases to check:**
- Try to file a VAT return for a period that has no invoices or purchases and verify it handles the zero case gracefully
- Calculate VAT for a month period instead of a quarter and verify the toggle works correctly
- Verify that a credit note's negative amounts are correctly subtracted from the VAT calculation
- Try to file the same period twice without correcting first and verify it is rejected
- Check that amounts in the BTW Calculator (/app/btw-calculator, BW40) match manual calculations: input EUR 100.00 and verify ex-VAT/VAT/incl-VAT for 21%, 9%, and 0% rates
- Verify all VAT amounts use integer cents with no floating-point errors (e.g., EUR 99.99 at 21% = 2099 cents VAT, not 2099.79)

---

## Scenario 5: Multi-Language Verification (NL / EN / TR)

**Description:** Verify that all three supported languages (Dutch, English, Turkish) work correctly on both the public site and admin panel. All user-facing strings should be translated with no hardcoded text or missing translation keys visible.

**Preconditions:**
- Public site at colourking.nl is accessible
- Admin panel at admin.colourking.nl is accessible with a valid staff login
- All three locale files (src/messages/nl.json, en.json, tr.json) have been reconciled to 1078 keys each

**Steps:**

### Public Site

1. Navigate to https://colourking.nl/nl (Dutch).
   - **Expected:** Page loads in Dutch. Navigation shows "Diensten", "Gallerij", "Over Ons", "Contact". Hero text, stats, service descriptions, testimonials, and footer are all in Dutch. No raw translation keys (e.g., "nav.services") or English fallback text visible.

2. Navigate to https://colourking.nl/en (English).
   - **Expected:** Page loads in English. Navigation shows "Services", "Gallery", "About", "Contact". All content is translated to English. No Dutch text remains except proper nouns (company name "Colourking", screen codes).

3. Navigate to https://colourking.nl/tr (Turkish).
   - **Expected:** Page loads in Turkish. Navigation shows Turkish equivalents. All content is translated to Turkish. No Dutch or English text remains except proper nouns and screen codes.

4. On each language version, visit the Services page (/[locale]/diensten).
   - **Expected:** All 8 service categories have translated titles and descriptions in the active language. No placeholder text or translation keys visible.

5. On each language version, visit the Contact page (/[locale]/contact).
   - **Expected:** Form labels (name, email, phone, message) are translated. Submit button text is translated. Validation error messages appear in the active language.

### Admin Panel

6. Log in to admin.colourking.nl.
   - **Expected:** Login page text ("Log in", "Email", "Password", "Forgot password") is shown in the default locale.

7. Navigate to Settings (/app/instellingen) and change the locale/language to English.
   - **Expected:** The admin panel UI reloads in English. Sidebar navigation labels change: "Dashboard", "Leads", "Customers", "Vehicles", "Quotes", "Workshop", "Parts", "Invoices", "Documents", "Appointments", "Tasks", "Planning", "Reports", "VAT", "Purchases", "Bookkeeping", "Settings".

8. Navigate through key admin pages in English and verify translations:
   a. Dashboard (/app) - KPI cards, section headings
   b. Leads (/app/leads) - column headers, status badges, action buttons
   c. Customers (/app/klanten) - form labels, table headers
   d. Invoices (/app/facturen) - status labels (draft, sent, paid, overdue, credited)
   e. VAT Dashboard (/app/btw) - box labels, period labels, action buttons
   - **Expected:** All UI text is in English. Screen codes (RP01, LD05, KL05, FA05, BW05) remain untranslated as per system rules. Common buttons ("Save", "Cancel", "Delete", "Edit", "Create", "Search") are in English.

9. Switch locale to Turkish and repeat step 8.
   - **Expected:** All UI text is in Turkish. Same screen codes remain untranslated. No English or Dutch fallback text visible.

10. Switch back to Dutch and verify the default experience.
    - **Expected:** All text returns to Dutch. No translation artifacts or cached English/Turkish strings.

11. Verify formatted values respect locale:
    a. Check a currency amount on an invoice - should show EUR format with comma decimal separator for NL (EUR 1.234,56), period for EN (EUR 1,234.56)
    b. Check a date - should show DD-MM-YYYY for NL, MM/DD/YYYY or locale-appropriate for EN/TR
    - **Expected:** Dates and currencies use the locale-aware formatters (formatCurrency, formatDate, formatDateShort, formatNumber).

**Edge cases to check:**
- Navigate directly to a URL with a non-existent locale (e.g., /fr) and verify graceful handling (redirect to default locale or 404)
- Check that email templates sent from the admin (/api/email/send) use the correct locale for the recipient
- Verify that the monitor dashboard (monitor.colourking.nl) also respects the language setting
- Search using the Cmd-K command palette in each language and verify search results show correctly
- Check that error messages and toast notifications appear in the active language
- Verify that the public payment page (/s/[token]) displays in an appropriate language
- Look for any hardcoded Dutch text in the admin UI that was missed during the Sprint 12 audit (grep for common Dutch words like "opslaan", "verwijderen", "annuleren" in component files outside of message files)
- Confirm all three locale files have exactly the same key structure (no keys present in one but missing in another)

---

## Scenario 6: Workshop Job Lifecycle (Bonus)

**Description:** Test the complete job workflow from intake through all stages to closure, including the workshop board, parts management, photo uploads, and document generation.

**Preconditions:**
- Logged into admin.colourking.nl with admin role
- A customer and vehicle exist in the system
- An approved offer exists linked to the customer/vehicle

**Steps:**

1. Navigate to Jobs (/app/jobs) and create a new job (/app/jobs/nieuw).
   - **Expected:** Job creation form (JB01) loads with customer and vehicle selectors. Select the existing customer and vehicle. Save creates a job in "intake" status with an auto-assigned job number.

2. Open the job detail page (/app/jobs/[id]).
   - **Expected:** JB10 loads showing job info, status badge ("intake"), event audit trail, photo sections (before/during/after), and linked parts.

3. Progress the job through stages: intake -> inspection -> quoted -> approved -> planned -> in_progress.
   - **Expected:** Each stage transition is recorded in the event audit trail with timestamp and user. Status badge updates. The state machine enforces valid transitions only (e.g., cannot skip from intake directly to in_progress).

4. Upload a "before" photo to the job.
   - **Expected:** Photo uploads to Supabase Storage. Appears in the "before" phase section of the job detail.

5. Add a part to the job:
   - Description: "Motorkap nieuw"
   - Status: "needed" (besteld)
   - Blocking: yes
   - **Expected:** Part is created via /api/parts. Appears in the job's parts section. The blocking flag is visible.

6. Try to advance the job to the next stage while a blocking part is in "needed" status.
   - **Expected:** The system prevents the stage change because a blocking part has not been received. An error message explains which part is blocking.

7. Update the part status: needed -> ordered -> shipped -> received.
   - **Expected:** Each status transition is valid per the parts state machine. Once the part is "received", the blocking condition is cleared.

8. Navigate to the Workshop Board (/app/jobs/board).
   - **Expected:** JB15 loads showing a kanban-style board with columns for each job stage. The test job appears in its current stage column.

9. Complete the job by progressing through: in_progress -> quality_check -> ready -> delivered -> closed.
   - **Expected:** Each transition is recorded. At "ready" or "delivered" stage, a handover note can be generated. At "closed", the job is complete.

10. Generate a repair order document for the job.
    - **Expected:** Repair order document (DO20) is created with job details, customer info, vehicle info, and a signature field.

**Edge cases to check:**
- Try to transition the job to an invalid next stage (e.g., from intake directly to closed) and verify the state machine rejects it
- Upload photos in "during" and "after" phases and verify they are separated correctly
- Delete a photo and verify it is removed from both the UI and Supabase Storage
- Create multiple blocking parts and verify ALL must be received before the job can advance
- Verify the event audit trail records the correct user (staff member) for each action
- Test the Cmd-K palette search to find a job by its job number
- Verify that a completed job's documents appear in the Document Archive (/app/documenten, DO05)
