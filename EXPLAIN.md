# AMICI ERP — User Guide

## How to Use This Application

This guide explains every module and feature from the user's perspective. The app is a single-page ERP with 5 modules accessible from the top tab bar. Each module has a left sidebar with sections and a main content area.

---

# 1. HR Module

**Purpose:** Manage workforce — employees, attendance, leave, payroll, training, and organizational structure.

---

### All Employees

The main employee directory.

**What you see:**
- KPI cards at top: total employees, active, on leave, overdue skills, HSE alerts
- Search bar + dropdowns to filter by department and status
- Left panel: employee list (name, position, status badge, department)
- Right panel: detailed view of selected employee

**Employee detail tabs:**
1. **Info** — Name, contact, position, department, site, rotation, crew, salary band, nationality, visa, H2S level, medical fitness and expiry, work permit
2. **Leave** — Leave type bars showing used vs total (annual, sick, emergency, unpaid)
3. **Skills & HSE** — Skill proficiency bars + HSE certificates timeline with expiry dates
4. **History** — Career events (hired, promoted, transferred) with dates
5. **Documents** — Placeholder for file attachments

**Actions:**
- Click any employee in the left list to view details
- Click column headers to sort
- Click **Add Employee** (HR Manager+) to open a modal with all fields
- Click **Edit** (HR Manager+) on the detail panel

---

### Leave Requests

**What you see:** A table of all leave with employee name, type, dates, days, status.

**Flow:**
1. Click **Request Leave** → modal opens
2. Pick employee, leave type, start/end dates
3. System prevents double-booking (checks overlapping leave for same employee)
4. Submits as "pending" — appears in the table
5. **HR Manager** sees an **Approve** button on pending leaves → clicks to approve
6. On approval, an attendance record is auto-created marking the employee as "On Leave"

---

### Timesheets (Attendance)

Track daily check-in/check-out.

**What you see:** A table of attendance records with employee name, date, check-in time, check-out time, status.

**Actions:**
- **Check In** — records current time for selected employee
- **Check Out** — records current time, calculates hours
- Table shows all attendance with filter

---

### Absence Calendar

**What you see:** A Chart.js heatmap-style calendar showing leave patterns by month and department.

**Purpose:** Visual overview of who is absent when. Useful for resource planning.

---

### Open Positions

Manage job vacancies.

**What you see:** Table of open positions with title, department, posted date, status.

**Actions:**
- **Add Position** — modal with title, department, status fields
- Edit/close positions

---

### Performance Cycle

Employee performance reviews.

**What you see:** Table with employee name, review period, rating, comments, status.

**Actions:**
- **Add Review** — modal with employee, period, rating, comments
- Track review status (pending/completed)

---

### Training & HSE

Track HSE training courses and certifications.

**What you see:** Table with employee name, course name, date completed, status.

**Actions:**
- **Add Training** — modal with employee, course, date, status
- Track who has completed what training

---

### Compensation (Payroll)

Salary slip management.

**What you see:** Table with employee name, month/year, base pay, allowances, deductions, net pay, status.

**Actions:**
- **Generate Slip** (HR Manager+) — creates salary slip for an employee
- **Approve Slip** (HR Manager+) — approves pending slips

---

### Expense Claims

Employee expense reporting.

**What you see:** Table with employee, date, amount, category, description, status.

**Actions:**
- **Add Expense** — modal with employee, date, amount, category, description
- Track approval status

---

### Org Units

Organizational structure.

**What you see:** Table of departments/units with name, head count, manager.

**Actions:**
- **Add Unit** — modal with name, head count, manager

---

### HR Settings

Role management — the checkbox panel at the top-right user menu. Switch between System Admin, HR Manager, HR User, and Employee roles to see different sidebar options.

---

# 2. CRM Module

**Purpose:** Manage customer relationships — accounts, leads, deals, contacts, quotations, and communications.

---

### All Accounts

The main customer directory, designed with Frappe.io-style interface.

**What you see:**
- KPI cards: total accounts, active, leads, opportunities, tasks
- Search + filter by type and rating
- Left panel: account list (name, rating stars)
- Right panel: detailed view

**Account detail tabs:**
1. **Info** — Industry, tier, status, manager, revenue, last contact, next action
2. **Contracts/Timeline** — Chronological activity log (calls, meetings, emails)
3. **Contacts** — List of people linked to this account with name, designation, email, phone

**Opportunity pipeline:** Each account shows weighted deal progress bars.

**Actions:**
- Click account to view details
- **New Account** — modal with name, industry, type, tier, manager, revenue
- Click contact to edit or delete

---

### Leads

Track potential customers.

**What you see:** Table of leads with name, email, phone, status, source.

**Actions:**
- **Add Lead** — modal with name, email, phone, source
- Convert lead to account (creates an account from the lead)
- Delete lead

---

### Deals Pipeline

Track sales opportunities through stages.

**What you see:** Deals filtered by stage (Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost).

**Actions:**
- **Add Deal** — modal with title, value, stage, expected close date, lead, account
- Drag deals between stages (HTML5 drag-and-drop)
- Create quotation from deal
- Win/Loss tracking

---

### Contacts

Manage individual contacts linked to accounts.

**What you see:** Table with full name, email, phone, mobile, designation, department, account.

**Actions:**
- **Add Contact** — modal with salutation, first/last name, email, phone, mobile, designation, department, account, primary checkbox
- Edit, Delete

---

### Quotations

Create and manage sales quotes.

**What you see:** Table with ID, account, date, valid till, grand total, status.

**Actions:**
- **New Quotation** — multi-item modal:
  - Select deal or account
  - Add items (description, qty, rate) with auto-calculated totals
  - Tax rate and tax amount
  - Discount percent and amount
  - Grand total auto-calculated
- View, Edit, Send (mark as sent)
- Convert to Invoice (creates a Sales invoice)
- Delete

---

### Prospects

Track potential accounts before they become leads.

**What you see:** Table with company name, industry, website, phone, email, territory, status.

**Actions:**
- **Add Prospect** — modal with company info, territory, owner
- Convert to Lead
- Delete

---

### Communications

Log meetings, calls, and emails.

**What you see:** Timeline of communications with type (Meeting/Call/Email), subject, content, date, sender, recipients.

**Actions:**
- **New Communication** — modal with reference type/ID, type, subject, content, date, sender
- View full communication details

---

### Win/Loss Analysis

**What you see:** Chart.js pie chart showing won vs lost deals with count labels.

**Purpose:** Understand deal conversion rates.

---

### Territory View

**What you see:** Deals grouped by territory with total values.

**Purpose:** See which regions are performing.

---

### My Tasks

Task management for CRM.

**What you see:** Table with description, due date, assigned to, status, related lead/deal.

**Actions:**
- **Add Task** — modal with description, due date, assigned to
- Toggle completion via checkbox
- Delete

---

### Field Service Logs

Track on-site service visits.

**What you see:** Table with client name, engineer, date, job description, status.

**Actions:**
- **New Log** — modal with client, engineer, date, description, status

---

### Partners / JVs

Placeholder for joint venture and partner management.

---

# 3. Certificates Module

**Purpose:** Full lifecycle management of equipment certificates — the most feature-rich module. Designed for oil & gas equipment certification (lifting gear, pressure vessels, NDT, etc.).

---

### Overview

The module has two main views toggled by entity tabs:
1. **Certificates** — the certificate table/cards
2. **Clients / Locations / Inspectors / Jobs** — entity management

There is also an **Inspector mode** accessed via the top bar dropdown.

---

### Certificate Table (Default View)

A SAP-style data table with these columns:
- **Job No.** — Work order reference
- **Cert ID** — Certificate identifier
- **Asset Tag** — Equipment asset tag
- **Certificate Name** — Equipment description
- **Category** — Equipment category (Rotating, Static, Lifting, etc.)
- **Type** — Certificate type (CAT III, CAT IV, LIFTING, LOAD TEST, NDT, TUBULAR, ORIGINAL COC)
- **Issued By** — Issuing authority
- **Issue Date** — Date issued
- **Expiry** — Expiration date (color-coded: green = valid, orange = expiring soon, red = expired)
- **Approval** — Status badge (pending/approved/rejected)
- **Client** — Owning client
- **QR** — QR code button
- **File** — PDF/document link placeholder

**Features:**
- **Sort** by clicking any column header
- **Filter** by client, location, type using the filter bar
- **Search** across all fields
- **Column visibility** — dropdown to show/hide columns (persisted in browser)
- **Pagination** — 25/50/100 per page with page controls
- **Saved views** — pills above table: All, Valid, Expiring, Expired, Pending, Rejected, No File, New Uploads
- **Mobile** — auto-switches to card view on screens <= 768px

**Row actions (hover):**
- **Eye icon** — opens side drawer with full certificate details
- **Edit** (admin/inspector) — edit certificate fields
- **Approve** (admin/inspector) — marks approval as approved
- **Reject** (admin/inspector) — opens reject modal with reason
- **Delete** (admin/inspector) — confirm and delete

**Multi-select:**
- Checkboxes on each row + select-all in header
- Mass action bar appears with: Approve All, Delete All, Deselect

**Drawer (side panel):** Shows full certificate details including:
- Status badge, expiry bar, job info, client, location, inspector
- QR code image (via qrserver.com API)
- Document link
- Edit/Approve/Reject/Delete buttons

**QR Modal:** Full-size QR code in a blurred-backdrop modal.

---

### Saved View Pills

Quick filters at the top of the table:
- **All** — every certificate
- **Valid** — not expired and not expiring within 30 days
- **Expiring** — expiring within 30 days
- **Expired** — past expiry date
- **Pending** — approval status = pending
- **Rejected** — approval status = rejected
- **No File** — no PDF/attachment
- **New Uploads** — recently added

---

### Certificate Sidebar

Filters by certificate type and equipment category:

**Certificate Types:** CAT III, CAT IV, LIFTING, LOAD TEST, NDT, TUBULAR, ORIGINAL COC (each with count badge)

**Equipment Categories:** Rotating, Static, Lifting, Electrical, Pressure, Fire & Safety, Instrumentation, Vehicles (each with count badge)

**Action items (admin/inspector only):**
- **Upload Certificate** — new certificate modal
- **Bulk Create** — 3-step bulk wizard

**Other sections:**
- Expiry Timeline (Gantt chart)
- Notifications (push notification settings)

---

### Bulk Certificate Wizard

3-step process for creating multiple certificates at once:

**Step 1: Setup**
- Download CSV template
- Upload filled CSV, OR
- Enter rows manually

**Step 2: Preview** (if manual rows have been added)
- Table showing each row with certificate fields
- Auto-fill site (from first row) across all rows
- Auto-calculate expiry dates

**Step 3: Confirm & Create**
- Final review and submit

---

### Inspector Mode

**Purpose:** Field inspectors see only certificates assigned to them.

**How to use:**
1. In the inspector bar at top, click "Login as Inspector ▾"
2. Select an inspector from the dropdown
3. The table filters to show only certificates assigned to that inspector
4. A colored dot and inspector name appear in the bar
5. Click "Logout" to return to full view

**Inspector permissions:**
- Can view, edit, approve, reject certificates
- Cannot cycle job status
- Cannot access Upload/Bulk actions in sidebar

---

### Entity Tabs

**Clients:** Card grid showing client companies with their functional locations. Click a client to filter certificates.

**Functional Locations:** Card grid showing locations (Rig, Workshop, Warehouse, Yard, etc.) with their certificate counts.

**Inspectors:** Card grid showing inspectors with name, title, contact info, and their assigned certificates.

**Jobs (Work Orders):** Card grid showing job orders with:
- Client and location
- Status (Open, In Progress, On Hold, Completed, Cancelled)
- Cycle button to advance status
- Assigned certificates
- Click a job to filter certificates to that job

---

### Expiry Timeline (Gantt Chart)

**What you see:** A Chart.js horizontal bar chart showing certificate expiry timelines grouped by category.

**Purpose:** Visual overview of when certificates expire across the organization.

---

### Push Notifications

Settings panel for browser push notifications:
- Toggle push notifications
- Check service worker health
- Request notification permission

---

# 4. Supply Chain Module

**Purpose:** Manage procurement, inventory, suppliers, and warehouse operations.

---

### Dashboard

**What you see:**
- KPI cards: total POs, pending approval, open orders, low stock items, total suppliers
- Chart: spend by category (doughnut chart)
- Chart: PO status breakdown (count by status)
- Table: recent POs (last 5)
- Table: low stock alerts (items below reorder point)

---

### All POs (Purchase Orders)

**What you see:** Master-detail layout similar to HR and CRM:
- KPI cards: total, draft, ordered, received
- Search + filter by status, priority, site
- Left: PO list with ID, supplier, amount, status
- Right: PO detail with PO lines, approve/receive buttons

**Actions:**
- **New PO** — modal with supplier, description, amount, status, priority, site, requested by, order date, delivery date
- **Approve** (SC Manager+) — changes status from draft to approved
- **Receive** (SC Manager+) — marks PO as received, updates inventory stock levels

---

### Suppliers

**What you see:** Master-detail with supplier list and detail panel.

**Supplier info:** Name, category, contact person, email, phone, country, rating, status.

**Actions:**
- **New Supplier** (SC Manager+) — modal with all fields
- View supplier details and performance

---

### Inventory

**What you see:** Table of all stock items with:
- Item name, part number, category, site, warehouse
- UOM (unit of measure), quantity on hand, reorder point, max stock
- Unit cost, status (auto-calculated based on qty vs reorder point)
- Status colors: green = normal, orange = low, red = critical

**Actions:**
- **New Item** — modal with all inventory fields
- Item status is auto-calculated: qty = 0 → "Out of Stock", qty ≤ reorder → "Low Stock", qty ≤ reorder/2 → "Critical"
- Click row to view full details

---

### Low Stock Alerts

Filtered view of inventory showing only items that are Low, Critical, or Out of Stock.

---

### Stock Ledger

**What you see:** Table of all inventory movements with:
- Item, movement type (In/Out/Transfer/Adjustment), quantity, UOM
- Reference type and ID (links to PO, MR, etc.), date, unit cost, notes

**Purpose:** Complete audit trail of every inventory change.

---

### Warehouses

**What you see:** Cards/table showing warehouses with name, location, site, manager, capacity bars (used vs total).

**Actions:**
- **New Warehouse** — modal with name, location, site, manager, capacities

---

### Material Requests (MRs)

Purchase requisitions — internal requests to buy items.

**What you see:** Table with request title, status, priority, department, site, requested by, required date.

**Actions:**
- **New MR** — modal with title, items (select from inventory), priority, department, site, required date, notes
- **Approve** — changes status to approved
- **Reject** — changes status to rejected
- **Convert to PO** — creates a purchase order from the MR

**Auto-generate:** The system can auto-create MRs based on reorder rules (items below minimum stock).

---

### Quality Inspections

Incoming inspection of purchased items.

**What you see:** Table with inspection ID, PO reference, item, inspection type, inspector, date, result.

**Actions:**
- **New Inspection** — modal with:
  - Select item and PO reference
  - Inspection type
  - Add inspection parameters (parameter name, min value, max value, actual value, result)
  - Any parameter failing → overall result = Failed
- View inspection parameters in detail modal

---

### Landed Cost

Track additional costs on purchases (freight, insurance, customs duty, handling).

**What you see:** Table with voucher ID, date, PO reference, charges breakdown, total, distribution method.

**Actions:**
- **New Voucher** — modal with:
  - PO reference
  - Freight, insurance, duty, handling amounts
  - Distribution method (by value, qty, weight)
  - Items from the PO with proportional allocation
- View allocation detail

---

### Reorder Rules

Automated inventory replenishment rules.

**What you see:** Table with item, supplier, min/max qty, lead time, auto-create toggle, last triggered.

**Actions:**
- **New Rule** — modal with item, supplier, min qty, max qty, lead time days, auto-create PO checkbox
- **Auto Generate MR** button → scans all rules, creates material requests for items below minimum stock, records the trigger date

---

# 5. Finance Module

**Purpose:** Accounting — invoices, payments, general ledger, financial reporting.

---

### Dashboard

**What you see:**
- KPI cards: Total A/R (accounts receivable), Total A/P (accounts payable), Cash Inflow (this month), Cash Outflow (this month)
- Note: Charts and detailed financial reports are planned for future development

---

### Sales Invoices (A/R)

**What you see:** Master-detail with invoice list and detail panel.

**Invoice detail tabs:**
1. **Info** — Invoice type, party, date, due date, status, totals
2. **Line Items** — Items with description, qty, rate, amount
3. **Payments** — Payments received against this invoice (auto-posts to journal)

**Actions:**
- **New Invoice** — modal with:
  - Type (Sales), party name, date, due date
  - Add line items (description, quantity, rate) with auto-calculation
  - Tax template and auto-calculated tax
  - Cost center
  - Auto-generated journal entry
- **Log Payment** — record payment against invoice (creates payment + auto JE)
- Status auto-advances: Draft → Unpaid → Partially Paid → Paid

---

### Purchase Invoices (A/P)

Same structure as Sales Invoices but for supplier bills.

**Actions:**
- **New Invoice** — Type = Purchase
- Log payments to suppliers
- Track payable aging

---

### Payments

**What you see:** Table of all payments with invoice reference, date, amount, method.

**Actions:**
- **New Payment** — modal with:
  - Select unpaid invoice (auto-fills amount)
  - Payment amount, date, method
  - Auto-creates journal entry (debit AP/AR, credit bank)

---

### AR Aging / AP Aging

**What you see:** Aging buckets (0-30, 31-60, 61-90, 90+ days) with total amounts for each bucket.

**Purpose:** See which invoices are overdue and by how much.

---

### General Ledger

**What you see:** Table of all journal entries with date, reference, description, and entry lines.

**Purpose:** Complete audit trail of all financial transactions.

---

### Profit & Loss

**What you see:** Income statement with:
- Income accounts (revenue) grouped, with total
- Expense accounts grouped, with total
- Net profit/loss calculation

**Purpose:** See profitability over a period.

---

### Balance Sheet

**What you see:**
- Assets (current + fixed) with total
- Liabilities (current) with total
- Equity (retained earnings) with total
- Assets = Liabilities + Equity verified

---

### Journal Entries

Manual journal entry creation.

**What you see:** Table of all manual and auto-generated JEs.

**Actions:**
- **New Entry** — modal with:
  - Date, reference number, description
  - Add lines: account selection, debit/credit amounts
  - Auto-checks that debits = credits
- View entries with all lines

---

### Fixed Assets

Manage capitalized assets with depreciation.

**What you see:** Table with asset name, type, purchase date, cost, salvage value, useful life, depreciation method, net book value, status.

**Actions:**
- **New Asset** — modal with name, type, purchase date, cost, salvage value, useful life, depreciation method (Straight Line / Declining Balance)
- Net book value auto-calculated

---

### Cost Centers

Accounting dimensions for tracking costs by department.

**What you see:** Table with name, department, description.

**Actions:**
- **New Cost Center** — modal with name, department, description

---

### Chart of Accounts

Hierarchical account structure.

**What you see:** Tree-like table with accounts grouped by type (Assets, Liabilities, Equity, Income, Expenses), with parent-child relationships and balances.

**Actions:**
- **New Account** — modal with name, type, parent account (optional), is group flag

---

# Cross-Cutting Features

### Role-Based Access

The sidebar and action buttons change based on your role. Switch roles from the user menu (top-right).

**Role hierarchy:** System Admin → Module Managers → Module Users → Employee

| Role | Sees |
|------|------|
| Employee | Basic HR, certs, basic dashboard |
| HR User | HR minus approve actions |
| HR Manager | Full HR + approve leave/salary |
| CRM User | CRM view |
| CRM Manager | CRM + delete contacts/quotes |
| SC User | Supply chain view |
| SC Manager | SC + approve/receive PO |
| Finance User | Finance view |
| Finance Manager | Full finance |
| System Admin | Everything |
| Inspector | Certificates only (field mode) |

### AI Assistant

The AI panel slides out from the right (toggle with the sparkle icon in the header).

**What it can do:**
- Answer questions about your data (employee count, PO status, certificate expiry)
- Navigate to sections ("Go to leave requests")
- Approve POs (if you have permission)
- Add employees (if you have permission)
- Flag certificates as needing attention
- Create draft POs

### Language

Toggle between English and Arabic using the globe icon in the header. Arabic enables RTL layout with Cairo font.

### Export

Any `.data-table` can be exported to CSV using the export function.

### Notifications

The bell icon in the header shows alerts. Certificate expiry notifications and pending leave requests are counted in the badge.
