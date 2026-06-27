/**
 * seed_users.js — Create test users in Supabase Auth
 *
 * Usage:
 *   1. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
 *   2. node seed_users.js
 *
 * Prerequisites:
 *   - db_patch.sql must already be run (user_profiles table + trigger)
 *   - SUPABASE_SERVICE_KEY from Project Settings → API → service_role key
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  { email: 'admin@amici.com',      password: 'admin123', roles: ['system_admin'],                display_name: 'System Admin' },
  { email: 'hr@amici.com',         password: 'hr123',    roles: ['hr_manager'],                  display_name: 'HR Manager' },
  { email: 'crm@amici.com',        password: 'crm123',   roles: ['crm_manager'],                 display_name: 'CRM Manager' },
  { email: 'sc@amici.com',         password: 'sc123',    roles: ['sc_manager'],                  display_name: 'Supply Chain Manager' },
  { email: 'fin@amici.com',        password: 'fin123',   roles: ['fin_manager'],                 display_name: 'Finance Manager' },
  { email: 'user@amici.com',       password: 'user123',  roles: ['employee'],                    display_name: 'Employee' },
  { email: 'hr-user@amici.com',    password: 'hruser123',roles: ['hr_user'],                     display_name: 'HR User' },
  { email: 'crm-user@amici.com',   password: 'crmuser123',roles: ['crm_user'],                  display_name: 'CRM User' },
  { email: 'sc-user@amici.com',    password: 'scuser123', roles: ['sc_user'],                    display_name: 'SC User' },
  { email: 'fin-user@amici.com',   password: 'finuser123',roles: ['fin_user'],                  display_name: 'Finance User' },
];

async function seed() {
  for (const u of USERS) {
    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find(x => x.email === u.email);
    if (found) {
      // Update profile roles
      const { error: upErr } = await supabase
        .from('user_profiles')
        .update({ roles: u.roles, display_name: u.display_name })
        .eq('id', found.id);
      console.log(`${u.email}: already exists → roles updated${upErr ? ' (ERROR: ' + upErr.message + ')' : ' ✓'}`);
      continue;
    }

    // Create user (trigger auto-creates profile with {employee})
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { display_name: u.display_name },
    });

    if (error) {
      console.error(`${u.email}: create failed — ${error.message}`);
      continue;
    }

    // Update profile with correct roles
    const { error: upErr } = await supabase
      .from('user_profiles')
      .update({ roles: u.roles })
      .eq('id', data.user.id);

    console.log(`${u.email}: created ✓${upErr ? ' (role update ERROR: ' + upErr.message + ')' : ''}`);
  }
  console.log('\nDone. Users can now log in with their email and password.');
  console.log('Roles are automatically applied from user_profiles on login.');
}

seed().catch(console.error);
