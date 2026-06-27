-- ============================================================
-- AMICI ERP — Database Patch: Create missing tables & columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- PART 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS full_name TEXT;
UPDATE employees SET full_name = first_name || ' ' || last_name WHERE full_name IS NULL;

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS part_no TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS warehouse TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS uom TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS qty_on_hand NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reorder_point NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS max_stock NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS last_received DATE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS parent_item TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS serial_tracking BOOLEAN DEFAULT false;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS batch_tracking BOOLEAN DEFAULT false;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_name TEXT;
UPDATE purchase_orders SET supplier_name = vendor WHERE supplier_name IS NULL;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
UPDATE purchase_orders SET total_amount = amount WHERE total_amount IS NULL;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS order_date DATE;
UPDATE purchase_orders SET order_date = created_date WHERE order_date IS NULL;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requested_by TEXT;

ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS employee_name TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS days NUMERIC DEFAULT 0;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approver TEXT;

ALTER TABLE certificates ADD COLUMN IF NOT EXISTS employee_name TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_by TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_date DATE;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS alert_days NUMERIC DEFAULT 30;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS template TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS job_id TEXT;

-- PART 2: CREATE ALL MISSING TABLES
-- ============================================================

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  rating NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active'
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  name TEXT,
  location TEXT,
  site TEXT,
  manager TEXT,
  manager_id TEXT,
  capacity_total NUMERIC DEFAULT 0,
  capacity_used NUMERIC DEFAULT 0
);

-- CRM tables
CREATE TABLE IF NOT EXISTS crm_field_service_logs (
  id TEXT PRIMARY KEY,
  client_name TEXT,
  engineer_name TEXT,
  date DATE,
  job_description TEXT,
  status TEXT DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS crm_leads (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'new',
  source TEXT
);

CREATE TABLE IF NOT EXISTS crm_deals (
  id TEXT PRIMARY KEY,
  title TEXT,
  lead_id TEXT,
  account_id TEXT,
  value NUMERIC DEFAULT 0,
  stage TEXT,
  expected_close_date DATE,
  invoice_id TEXT,
  sales_person TEXT,
  territory TEXT,
  lost_reason TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS crm_tasks (
  id TEXT PRIMARY KEY,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  related_lead_id TEXT,
  related_deal_id TEXT
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id TEXT PRIMARY KEY,
  account_id TEXT,
  salutation TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  designation TEXT,
  department TEXT,
  is_primary BOOLEAN DEFAULT false,
  nationality TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS crm_quotations (
  id TEXT PRIMARY KEY,
  deal_id TEXT,
  account_id TEXT,
  account_name TEXT,
  lead_id TEXT,
  date DATE,
  valid_till DATE,
  items JSONB DEFAULT '[]',
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS crm_prospects (
  id TEXT PRIMARY KEY,
  company_name TEXT,
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  territory TEXT,
  prospect_owner TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_date DATE
);

CREATE TABLE IF NOT EXISTS crm_communications (
  id TEXT PRIMARY KEY,
  reference_type TEXT,
  reference_id TEXT,
  type TEXT,
  subject TEXT,
  content TEXT,
  date TIMESTAMP,
  sender TEXT,
  recipients TEXT
);

-- HR tables
CREATE TABLE IF NOT EXISTS hr_open_positions (
  id TEXT PRIMARY KEY,
  title TEXT,
  department TEXT,
  status TEXT DEFAULT 'open',
  posted_date DATE
);

CREATE TABLE IF NOT EXISTS hr_performance_reviews (
  id TEXT PRIMARY KEY,
  employee_name TEXT,
  period TEXT,
  rating NUMERIC DEFAULT 0,
  comments TEXT,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS hr_hse_training (
  id TEXT PRIMARY KEY,
  employee_name TEXT,
  course TEXT,
  date DATE,
  status TEXT DEFAULT 'completed'
);

CREATE TABLE IF NOT EXISTS hr_org_units (
  id TEXT PRIMARY KEY,
  name TEXT,
  head_count NUMERIC DEFAULT 0,
  manager TEXT
);

CREATE TABLE IF NOT EXISTS hr_attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  date DATE,
  status TEXT,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_expense_claims (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  date DATE,
  amount NUMERIC DEFAULT 0,
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS hr_salary_slips (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  month NUMERIC,
  year NUMERIC,
  base_pay NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_pay NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_id TEXT
);

-- Finance tables
CREATE TABLE IF NOT EXISTS fin_cost_centers (
  id TEXT PRIMARY KEY,
  name TEXT,
  dept TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS fin_tax_templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  rate NUMERIC DEFAULT 0,
  account TEXT,
  type TEXT
);

CREATE TABLE IF NOT EXISTS fin_chart_accounts (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  parent_id TEXT,
  is_group BOOLEAN DEFAULT false,
  balance NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fin_journal_entries (
  id TEXT PRIMARY KEY,
  date DATE,
  reference TEXT,
  description TEXT,
  entries JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS fin_fixed_assets (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  purchase_date DATE,
  cost NUMERIC DEFAULT 0,
  salvage_value NUMERIC DEFAULT 0,
  useful_life_years NUMERIC DEFAULT 0,
  depreciation_method TEXT,
  accumulated_depreciation NUMERIC DEFAULT 0,
  net_book_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  supplier_id TEXT
);

CREATE TABLE IF NOT EXISTS fin_invoices (
  id TEXT PRIMARY KEY,
  type TEXT,
  party_name TEXT,
  date DATE,
  due_date DATE,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  deal_id TEXT,
  items JSONB DEFAULT '[]',
  cost_center_id TEXT,
  tax_template_id TEXT,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fin_payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT,
  date DATE,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  salary_slip_id TEXT
);

-- Supply Chain tables
CREATE TABLE IF NOT EXISTS po_line_items (
  id TEXT PRIMARY KEY,
  po_id TEXT REFERENCES purchase_orders(id),
  item_desc TEXT,
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  unit_price NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_ledger (
  id TEXT PRIMARY KEY,
  item_id TEXT,
  movement_type TEXT,
  quantity NUMERIC DEFAULT 0,
  uom TEXT,
  ref_type TEXT,
  ref_id TEXT,
  date TIMESTAMP,
  unit_cost NUMERIC DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS material_requests (
  id TEXT PRIMARY KEY,
  title TEXT,
  status TEXT DEFAULT 'draft',
  priority TEXT DEFAULT 'medium',
  department TEXT,
  site TEXT,
  requested_by TEXT,
  required_date DATE,
  approved_by TEXT,
  approved_date DATE,
  po_ref TEXT,
  notes TEXT,
  items JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS quality_inspections (
  id TEXT PRIMARY KEY,
  date DATE,
  item_id TEXT,
  item_name TEXT,
  inspection_type TEXT,
  po_ref TEXT,
  inspector TEXT,
  parameters JSONB DEFAULT '[]',
  notes TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS landed_cost_vouchers (
  id TEXT PRIMARY KEY,
  date DATE,
  po_ref TEXT,
  charges JSONB DEFAULT '{}',
  total_charges NUMERIC DEFAULT 0,
  distribution TEXT,
  items JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS reorder_rules (
  id TEXT PRIMARY KEY,
  item_id TEXT,
  item_name TEXT,
  supplier_id TEXT,
  min_qty NUMERIC DEFAULT 0,
  max_qty NUMERIC DEFAULT 0,
  lead_time_days NUMERIC DEFAULT 14,
  auto_create_po BOOLEAN DEFAULT false,
  last_triggered DATE
);

-- PART 3: USER PROFILES FOR ROLE-BASED LOGIN
-- ============================================================

-- Table linking Supabase Auth users to app roles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  roles TEXT[] DEFAULT '{employee}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger: auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, roles)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    '{employee}'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed roles for existing users (UPDATE the emails to match your actual users):
-- UPDATE user_profiles SET roles = '{system_admin}' WHERE email = 'admin@amici.com';
-- UPDATE user_profiles SET roles = '{hr_manager}' WHERE email = 'hr@amici.com';
-- UPDATE user_profiles SET roles = '{crm_manager}' WHERE email = 'crm@amici.com';
-- UPDATE user_profiles SET roles = '{sc_manager}' WHERE email = 'sc@amici.com';
-- UPDATE user_profiles SET roles = '{fin_manager}' WHERE email = 'fin@amici.com';
-- UPDATE user_profiles SET roles = '{employee}' WHERE email = 'user@amici.com';

-- Row Level Security: users can read only their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY user_profiles_select_policy ON user_profiles
    FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
