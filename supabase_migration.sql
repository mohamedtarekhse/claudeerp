-- ============================================================
-- AMICI ERP — Complete Supabase Schema Migration
-- Run this in Supabase SQL Editor (Project → SQL Editor)
-- Creates ALL tables needed by the app with RLS for anon access
-- ============================================================

-- Drop existing tables to start clean (comment out if risky)
-- DROP TABLE IF EXISTS po_line_items, employee_skills, employee_leave_balances,
--   stock_ledger, material_requests, hr_salary_slips, hr_expense_claims,
--   hr_performance_reviews, hr_hse_training, hr_open_positions, hr_org_units,
--   hr_attendance, fin_payments, fin_invoices, crm_tasks, crm_field_service_logs,
--   crm_deals, crm_leads, crm_accounts, certificates, leave_requests, warehouses,
--   suppliers, inventory, purchase_orders, employees CASCADE;

-- ── HR ──
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  department TEXT,
  position_title TEXT,
  status TEXT DEFAULT 'active',
  emp_type TEXT,
  site TEXT,
  start_date TEXT,
  salary_band TEXT,
  nationality TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_skills (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  skill_name TEXT,
  proficiency TEXT
);

CREATE TABLE IF NOT EXISTS employee_leave_balances (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  leave_type TEXT,
  used INTEGER DEFAULT 0,
  total INTEGER DEFAULT 30
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  employee_name TEXT,
  leave_type TEXT,
  start_date TEXT,
  end_date TEXT,
  days INTEGER,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS hr_attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  date TEXT,
  status TEXT,
  check_in_time TEXT,
  check_out_time TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hr_open_positions (
  id TEXT PRIMARY KEY,
  title TEXT,
  department TEXT,
  status TEXT DEFAULT 'open',
  posted_date TEXT
);

CREATE TABLE IF NOT EXISTS hr_performance_reviews (
  id TEXT PRIMARY KEY,
  employee_name TEXT,
  period TEXT,
  rating TEXT,
  comments TEXT,
  status TEXT DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS hr_hse_training (
  id TEXT PRIMARY KEY,
  employee_name TEXT,
  course TEXT,
  date TEXT,
  status TEXT DEFAULT 'scheduled'
);

CREATE TABLE IF NOT EXISTS hr_org_units (
  id TEXT PRIMARY KEY,
  name TEXT,
  head_count INTEGER DEFAULT 0,
  manager TEXT
);

CREATE TABLE IF NOT EXISTS hr_expense_claims (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  date TEXT,
  amount NUMERIC,
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hr_salary_slips (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  month TEXT,
  year TEXT,
  base_pay NUMERIC,
  allowances NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_pay NUMERIC,
  status TEXT DEFAULT 'draft',
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── CRM ──
CREATE TABLE IF NOT EXISTS crm_accounts (
  id TEXT PRIMARY KEY,
  name TEXT,
  industry TEXT,
  tier TEXT,
  manager_id TEXT,
  status TEXT DEFAULT 'active',
  revenue NUMERIC DEFAULT 0,
  last_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_leads (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_deals (
  id TEXT PRIMARY KEY,
  title TEXT,
  value NUMERIC DEFAULT 0,
  stage TEXT,
  expected_close_date TEXT,
  lead_id TEXT,
  account_id TEXT,
  invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_tasks (
  id TEXT PRIMARY KEY,
  description TEXT,
  due_date TEXT,
  status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  related_lead_id TEXT,
  related_deal_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_field_service_logs (
  id TEXT PRIMARY KEY,
  date TEXT,
  customer TEXT,
  equipment TEXT,
  technician TEXT,
  status TEXT DEFAULT 'Scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Certificates ──
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  cert_type TEXT,
  expiry_date TEXT,
  status TEXT DEFAULT 'valid'
);

-- ── Supply Chain ──
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  rating TEXT,
  country TEXT,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  item_name TEXT,
  category TEXT,
  stock_level INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  unit TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  name TEXT,
  location TEXT,
  manager_id TEXT,
  capacity_used INTEGER DEFAULT 0,
  capacity_total INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  supplier_name TEXT,
  description TEXT,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  priority TEXT DEFAULT 'medium',
  site TEXT,
  requested_by TEXT,
  order_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS po_line_items (
  id TEXT PRIMARY KEY,
  po_id TEXT REFERENCES purchase_orders(id),
  item_desc TEXT,
  quantity NUMERIC,
  unit TEXT,
  unit_price NUMERIC
);

CREATE TABLE IF NOT EXISTS material_requests (
  id TEXT PRIMARY KEY,
  title TEXT,
  status TEXT DEFAULT 'draft',
  priority TEXT DEFAULT 'medium',
  department TEXT,
  site TEXT,
  requested_by TEXT,
  required_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_ledger (
  id TEXT PRIMARY KEY,
  item_id TEXT,
  movement_type TEXT,
  quantity NUMERIC,
  uom TEXT,
  ref_type TEXT,
  ref_id TEXT,
  date TEXT,
  unit_cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Supply Chain — New Tables ──
CREATE TABLE IF NOT EXISTS quality_inspections (
  id TEXT PRIMARY KEY,
  po_ref TEXT,
  item_id TEXT,
  item_name TEXT,
  inspection_type TEXT,
  inspector TEXT,
  date TEXT,
  status TEXT DEFAULT 'Pending',
  parameters JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS landed_cost_vouchers (
  id TEXT PRIMARY KEY,
  po_ref TEXT,
  date TEXT,
  charges JSONB DEFAULT '{}',
  total_charges NUMERIC DEFAULT 0,
  distribution TEXT DEFAULT 'By Value',
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reorder_rules (
  id TEXT PRIMARY KEY,
  item_id TEXT,
  item_name TEXT,
  supplier_id TEXT,
  min_qty NUMERIC DEFAULT 0,
  max_qty NUMERIC DEFAULT 0,
  lead_time_days INTEGER DEFAULT 14,
  auto_create_po BOOLEAN DEFAULT false,
  last_triggered TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Inventory — Add new columns (safe IF NOT EXISTS style) ──
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS part_no TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS qty_on_hand NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS uom TEXT DEFAULT 'Unit';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reorder_point NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS max_stock NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS last_received TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS parent_item TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS serial_tracking BOOLEAN DEFAULT false;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS batch_tracking BOOLEAN DEFAULT false;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- ── Finance ──
CREATE TABLE IF NOT EXISTS fin_invoices (
  id TEXT PRIMARY KEY,
  type TEXT,
  party_name TEXT,
  date TEXT,
  due_date TEXT,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'unpaid',
  deal_id TEXT,
  cost_center_id TEXT,
  tax_template_id TEXT,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fin_payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT,
  date TEXT,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  salary_slip_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Finance — New Tables ──
CREATE TABLE IF NOT EXISTS fin_cost_centers (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  manager TEXT,
  budget NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fin_tax_templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  rate NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'VAT',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fin_chart_accounts (
  id TEXT PRIMARY KEY,
  name TEXT,
  parent_id TEXT,
  type TEXT,
  is_group BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fin_journal_entries (
  id TEXT PRIMARY KEY,
  date TEXT,
  reference TEXT,
  description TEXT,
  entries JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fin_fixed_assets (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  purchase_date TEXT,
  cost NUMERIC DEFAULT 0,
  salvage_value NUMERIC DEFAULT 0,
  useful_life_years INTEGER DEFAULT 5,
  depreciation_method TEXT DEFAULT 'Straight Line',
  accumulated_depreciation NUMERIC DEFAULT 0,
  net_book_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'In Use',
  supplier_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── RLS Policies ──
-- Enable RLS on all tables and allow public anon access
-- (App handles auth optionally; for now allow full anon access)

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'employees','employee_skills','employee_leave_balances','leave_requests',
      'hr_attendance','hr_open_positions','hr_performance_reviews',
      'hr_hse_training','hr_org_units','hr_expense_claims','hr_salary_slips',
      'crm_accounts','crm_leads','crm_deals','crm_tasks','crm_field_service_logs',
      'certificates','suppliers','inventory','warehouses','purchase_orders',
      'po_line_items','material_requests','stock_ledger',
      'fin_invoices','fin_payments',
      'fin_cost_centers','fin_tax_templates','fin_chart_accounts',
      'fin_journal_entries','fin_fixed_assets',
      'quality_inspections','landed_cost_vouchers','reorder_rules'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format(
      'DROP POLICY IF EXISTS anon_all ON %I;', tbl
    );
    EXECUTE format(
      'CREATE POLICY anon_all ON %I FOR ALL USING (true) WITH CHECK (true);', tbl
    );
  END LOOP;
END $$;
