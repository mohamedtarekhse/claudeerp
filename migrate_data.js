import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Extract DATA from main.js
const mainJsPath = path.resolve('main.js');
const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

const dataStart = mainJsContent.indexOf('const DATA = {');
let dataStr = '';
if (dataStart !== -1) {
  let openBraces = 0;
  let started = false;
  for (let i = dataStart; i < mainJsContent.length; i++) {
    if (mainJsContent[i] === '{') {
      openBraces++;
      started = true;
    } else if (mainJsContent[i] === '}') {
      openBraces--;
    }
    dataStr += mainJsContent[i];
    if (started && openBraces === 0) {
      break;
    }
  }
}

// Convert string to object
let DATA = {};
try {
  // Use Function to safely evaluate the object assignment
  const extractFn = new Function(`
    ${dataStr}
    return DATA;
  `);
  DATA = extractFn();
} catch (e) {
  console.error("Failed to parse DATA from main.js", e);
  process.exit(1);
}

async function runMigration() {
  console.log("Starting Data Migration...");

  // 1. Employees
  if (DATA.employees) {
    console.log(`Migrating ${DATA.employees.length} employees...`);
    for (const emp of DATA.employees) {
      const { data: empData, error: empErr } = await supabase.from('employees').upsert({
        id: emp.id,
        first_name: emp.firstName,
        last_name: emp.lastName,
        department: emp.dept,
        position_title: emp.position,
        email: emp.email,
        phone: emp.phone,
        status: emp.status,
        emp_type: emp.empType,
        site: emp.site,
        rotation: emp.rotation,
        crew: emp.crew,
        start_date: emp.startDate,
        manager_id: emp.manager,
        salary_band: emp.salaryBand,
        cost_center: emp.costCenter,
        nationality: emp.nationality,
        visa: emp.visa,
        h2s_level: emp.h2sLevel,
        med_fit: emp.medFit,
        med_expiry: emp.medExpiry,
        work_permit: emp.workPermit
      });
      if (empErr) console.error(`Failed to insert employee ${emp.id}:`, empErr);

      // Skills
      if (emp.skills) {
        for (const skill of emp.skills) {
          await supabase.from('employee_skills').insert({
            employee_id: emp.id,
            name: skill.name,
            pct: skill.pct
          });
        }
      }

      // Leave Balances
      if (emp.leave) {
        for (const [type, balance] of Object.entries(emp.leave)) {
          await supabase.from('employee_leave_balances').insert({
            employee_id: emp.id,
            leave_type: type,
            used: balance.used,
            total: balance.total
          });
        }
      }

      // History
      if (emp.history) {
        for (const hist of emp.history) {
          await supabase.from('employee_history').insert({
            employee_id: emp.id,
            date: hist.date,
            event: hist.event
          });
        }
      }

      // HSE Certs
      if (emp.hseCerts) {
        for (const cert of emp.hseCerts) {
          await supabase.from('employee_hse_certs').insert({
            employee_id: emp.id,
            name: cert.name,
            expiry: cert.expiry,
            status: cert.status
          });
        }
      }
    }
  }

  // 2. Inventory
  if (DATA.inventory) {
    console.log(`Migrating ${DATA.inventory.length} inventory items...`);
    for (const item of DATA.inventory) {
      const { error } = await supabase.from('inventory').upsert({
        id: item.id,
        item_name: item.name,
        category: item.category,
        stock_level: item.stock,
        min_stock: item.min,
        unit: item.unit,
        location: item.location
      });
      if (error) console.error(`Failed to insert inventory ${item.id}:`, error);
    }
  }

  // 3. Purchase Orders
  if (DATA.purchaseOrders) {
    console.log(`Migrating ${DATA.purchaseOrders.length} purchase orders...`);
    for (const po of DATA.purchaseOrders) {
      const { error } = await supabase.from('purchase_orders').upsert({
        id: po.id,
        vendor: po.vendor,
        amount: po.amount,
        status: po.status,
        created_date: po.date,
        delivery_date: po.deliveryDate,
        created_by: po.createdBy
      });
      if (error) console.error(`Failed to insert PO ${po.id}:`, error);
    }
  }

  // 4. Leave Requests
  if (DATA.leaveRequests) {
    console.log(`Migrating ${DATA.leaveRequests.length} leave requests...`);
    for (const req of DATA.leaveRequests) {
      const { error } = await supabase.from('leave_requests').insert({
        employee_id: req.empId,
        leave_type: req.type,
        start_date: req.start,
        end_date: req.end,
        status: req.status
      });
      if (error) console.error(`Failed to insert Leave Request:`, error);
    }
  }

  // 5. CRM Accounts
  if (DATA.accounts) {
    console.log(`Migrating ${DATA.accounts.length} CRM accounts...`);
    for (const acc of DATA.accounts) {
      const { error } = await supabase.from('crm_accounts').upsert({
        id: acc.id,
        name: acc.name,
        industry: acc.industry,
        status: acc.status,
        tier: acc.tier,
        manager_id: acc.managerId,
        revenue: acc.revenue,
        last_contact: acc.lastContact,
        next_action: acc.nextAction
      });
      if (error) console.error(`Failed to insert CRM Account ${acc.id}:`, error);
    }
  }

  // 6. Certificates
  if (DATA.certificates) {
    console.log(`Migrating ${DATA.certificates.length} standalone certificates...`);
    for (const cert of DATA.certificates) {
      const { error } = await supabase.from('certificates').insert({
        employee_id: cert.empId,
        cert_type: cert.type,
        expiry_date: cert.expiry,
        status: cert.status
      });
      if (error) console.error(`Failed to insert Certificate:`, error);
    }
  }

  console.log("Migration Complete!");
}

runMigration();
