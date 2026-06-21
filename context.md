# AMICI ERP — Project Context

## Stack
- **Build:** Vite 8, vanilla JS (no framework)
- **Backend:** Supabase (Postgres)
- **AI:** OpenRouter (google/gemini-2.0-flash-exp)
- **UI:** Vanilla CSS + Font Awesome 6 + Chart.js CDN
- **i18n:** Custom `i18n` object, English + Arabic

## Structure
```
/
├── index.html           # Shell, auth modal, tab bar, sidebar, content, AI panel
├── main.js              # ALL app logic (~2500 lines): DATA, routing, HR/CRM/Cert/Supply/Fin renderers
├── missing.js           # Renders content routing, AI assistant, notifications, user menu
├── style.css            # Complete app styles
├── supabase.js          # Supabase client init
├── migrate_data.js      # Node.js script to push DATA to Supabase
├── src/
│   ├── main.js          # Vite boilerplate (unused, superseded by /main.js)
│   └── counter.js       # Vite boilerplate
└── public/
    ├── favicon.svg
    └── icons.svg
```

## Key Architecture
- **DATA** object holds all entities (employees, accounts, certificates, inventory, purchaseOrders, etc.) in-memory
- **Routing:** `state.module` + `state.section` → `renderContent()` → per-module render function
- **Master-Detail pattern:** left list panel + right detail panel (HR employees, CRM accounts)
- **Sidebar:** dynamically rendered per module with sections
- **Modals/Tooltips/Toasts:** custom implementations in `main.js`
- **CSV export:** from any `.data-table`

## Modules
| Module  | Sections                                          |
|---------|---------------------------------------------------|
| HR      | allEmployees, newHires, leaveRequests, timesheets, absenceCalendar, openPositions, performanceCycle, trainingHSE, compensation, expenseClaims, orgUnits, hrSettings |
| CRM     | allAccounts, myFavorites, openContracts, wonThisQuarter, myTasks, partnersJVs |
| Certificates | allCerts, expiredCerts, expiringSoon, cat_* categories |
| Supply Chain | scDashboard, allPOs, inventoryItems, lowStockAlerts, allSuppliers |
| Finance | finDashboard (not fully implemented)             |

## Key Patterns
- **`render*()`** functions return HTML strings, assigned to `#modContent`
- **`rerenderSection()`** = destroyCharts + renderTabBar + renderSidebar + renderContent
- **Filters** stored in `state.filters`, auto-apply on input
- **Sorting** via `state.sortCol` / `state.sortDir`, triggered by click on sortable headers
- **CRUD** operations mutate `DATA` directly, then call `rerenderSection()`
- **Supabase** calls are fire-and-forget (UI works from in-memory DATA whether DB is connected or not)
- **AI Assistant** builds a live context string from DATA, uses OpenRouter API, supports action JSON blocks for approve_po/navigate/add_employee/flag_cert/create_po_draft

## Conventions
- `$()` / `$$()` for querySelector
- `t(key)` for i18n lookups
- `fmt(n)` for locale number formatting
- `fmtDate(d)` for date display
- `statusPill(s)` for colored status badges
- `showToast(msg, type)` for notifications
- `openModal(title, bodyHTML, footerHTML)` / `closeModal()`
- All module renderers live in `main.js`; `missing.js` contains the content router and AI assistant

## Data Entities
employees, leaveRequests, accounts, allOpps, certificates, inventory, purchaseOrders, suppliers, warehouses, attendance, expenses, salarySlips, invoices, payments, openPositions, performanceReviews, hseTraining, orgUnits, notifications, leads, deals, tasks
