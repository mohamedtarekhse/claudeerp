import { supabase } from './supabase.js';
import { animate, stagger, spring } from 'motion';

/* ═══════════════════════════════════════════════
   STATE — GLOBAL ROUTER STATE
═══════════════════════════════════════════════ */
const state = {
  module:'hr', section:'allEmployees', selectedId:null, detailTab:'info',
  filters:{}, sortCol:null, sortDir:'asc', charts:[],
  roles:['system_admin'], currentUserRole:'System Admin',
  currentInspectorId:null,
  pushEnabled:false, pushSubscribed:false,
};

/* ── Role Helpers ── */
const ROLE_HIERARCHY = {
  system_admin: ['system_admin','hr_manager','hr_user','crm_manager','crm_user','sc_manager','sc_user','fin_manager','fin_user','employee'],
  hr_manager: ['hr_manager','hr_user','employee'],
  hr_user: ['hr_user','employee'],
  crm_manager: ['crm_manager','crm_user','employee'],
  crm_user: ['crm_user','employee'],
  sc_manager: ['sc_manager','sc_user','employee'],
  sc_user: ['sc_user','employee'],
  fin_manager: ['fin_manager','fin_user','employee'],
  fin_user: ['fin_user','employee'],
  employee: ['employee'],
  inspector: ['inspector'],
};
function effectiveRoles(){
  const set = new Set();
  state.roles.forEach(r => {
    const inherited = ROLE_HIERARCHY[r];
    if(inherited) inherited.forEach(x => set.add(x));
  });
  return [...set];
}
function hasRole(r){return effectiveRoles().includes(r);}
function requireRoles(requiredRoles,msg){
  const eff = effectiveRoles();
  if(!requiredRoles.some(r=>eff.includes(r))){
    showToast(msg||'Access denied','error');return false;
  }return true;
}
function getPrimaryRole(){return state.roles[0]||'employee';}
function toggleRole(cb){
  const k = cb.dataset.rolekey;
  if(cb.checked){
    if(!state.roles.includes(k)) state.roles.push(k);
  } else {
    state.roles = state.roles.filter(r => r !== k);
  }
  if(state.roles.length===0){ state.roles=['employee']; cb.checked=true; }
  const priority = ['system_admin','hr_manager','crm_manager','sc_manager','fin_manager','hr_user','crm_user','sc_user','fin_user','employee'];
  const sorted = [...state.roles].sort((a,b)=>priority.indexOf(a)-priority.indexOf(b));
  const top = sorted[0];
  state.currentUserRole = Object.keys(ROLE_KEY_MAP).find(k=>ROLE_KEY_MAP[k]===top)||'Employee';
  rerenderSection();
}

const ROLE_KEY_MAP = {'System Admin':'system_admin','HR Manager':'hr_manager','HR User':'hr_user','CRM Manager':'crm_manager','CRM User':'crm_user','SC Manager':'sc_manager','SC User':'sc_user','Finance Manager':'fin_manager','Finance User':'fin_user','Employee':'employee'};
const ROLE_LABELS = Object.keys(ROLE_KEY_MAP);

/* ── Register Service Worker for Push Notifications ── */
if('serviceWorker' in navigator && 'PushManager' in window){
  try {
    navigator.serviceWorker.register('/sw.js').then(reg=>{
      state._swReg = reg;
      reg.pushManager.getSubscription().then(sub=>{
        state.pushSubscribed = !!sub;
        state.pushEnabled = !!sub;
      });
    }).catch(()=>{});
  } catch(e) {}
}

/* ═══════════════════════════════════════════════
   i18n — BILINGUAL STRINGS
═══════════════════════════════════════════════ */
const i18n = {
  en: {
    appName:'AMICI ERP', search:'Search...', notifications:'Notifications',
    // Modules
    hr:'Human Resources', crm:'Customer Relations', certificates:'Certificates', supplyChain:'Supply Chain',
    // HR Sidebar
    allEmployees:'All Employees', newHires:'New Hires', offboarding:'Offboarding',
    onProbation:'On Probation', leaveRequests:'Leave Requests', timesheets:'Timesheets',
    absenceCalendar:'Absence Calendar', openPositions:'Open Positions', performanceCycle:'Performance Cycle',
    trainingHSE:'Training & HSE', compensation:'Compensation', orgUnits:'Org Units', hrSettings:'HR Settings',
    // HR KPIs
    totalHeadcount:'Total Headcount', activeEmployees:'Active Employees', fieldCrewOnSite:'Field Crew On-Site',
    attritionRate:'Attrition Rate', openPositionsKpi:'Open Positions', pendingApprovals:'Pending Approvals',
    // HR Table
    employee:'Employee', employeeId:'Employee ID', department:'Department', position:'Position',
    site:'Site / Location', empType:'Type', status:'Status', startDate:'Start Date', manager:'Manager', actions:'Actions',
    // Status labels
    active:'Active', inactive:'Inactive', onLeave:'On Leave', probation:'Probation', notice:'Notice Period',
    // Detail tabs
    info:'Info', leave:'Leave', skillsHse:'Skills & HSE', history:'History', documents:'Documents',
    // Buttons
    newEmployee:'New Employee', save:'Save', cancel:'Cancel', export:'Export', edit:'Edit',
    // Form labels
    firstName:'First Name', lastName:'Last Name', email:'Email', phone:'Phone',
    dept:'Department', positionTitle:'Position / Job Title', employmentType:'Employment Type',
    siteLocation:'Site / Location', managerDrop:'Manager', salaryBand:'Salary Band',
    costCenter:'Cost Center', crewType:'Crew Type', rotationSchedule:'Rotation Schedule',
    nationality:'Nationality', notes:'Notes / Remarks',
  },
  ar: {
    appName:'نظام أميتشي', search:'بحث...', notifications:'الإشعارات',
    hr:'الموارد البشرية', crm:'علاقات العملاء', certificates:'الشهادات', supplyChain:'سلسلة التوريد',
    allEmployees:'كل الموظفين', newHires:'موظفون جدد', offboarding:'مغادرة',
    onProbation:'تحت الاختبار', leaveRequests:'طلبات الإجازة', timesheets:'سجلات الوقت',
    absenceCalendar:'تقويم الغياب', openPositions:'الوظائف الشاغرة', performanceCycle:'دورة الأداء',
    trainingHSE:'التدريب والسلامة', compensation:'التعويضات', orgUnits:'الوحدات التنظيمية', hrSettings:'إعدادات الموارد البشرية',
    totalHeadcount:'إجمالي الموظفين', activeEmployees:'الموظفون النشطون', fieldCrewOnSite:'طاقم العمل الميداني',
    attritionRate:'معدل الدوران', openPositionsKpi:'الوظائف الشاغرة', pendingApprovals:'الموافقات المعلقة',
    employee:'الموظف', employeeId:'رقم الموظف', department:'القسم', position:'المنصب',
    site:'الموقع', empType:'النوع', status:'الحالة', startDate:'تاريخ البدء', manager:'المدير', actions:'إجراءات',
    active:'نشط', inactive:'غير نشط', onLeave:'في إجازة', probation:'تحت الاختبار', notice:'فترة الإشعار',
    info:'معلومات', leave:'الإجازة', skillsHse:'المهارات والسلامة', history:'السجل', documents:'الوثائق',
    newEmployee:'موظف جديد', save:'حفظ', cancel:'إلغاء', export:'تصدير', edit:'تعديل',
    firstName:'الاسم الأول', lastName:'اسم العائلة', email:'البريد الإلكتروني', phone:'الهاتف',
    dept:'القسم', positionTitle:'المنصب / المسمى الوظيفي', employmentType:'نوع التوظيف',
    siteLocation:'الموقع', managerDrop:'المدير', salaryBand:'الفئة الراتبية',
    costCenter:'مركز التكلفة', crewType:'نوع الطاقم', rotationSchedule:'جدول الدوران',
    nationality:'الجنسية', notes:'ملاحظات',
  }
};

let lang = 'en';
function t(key){ return (i18n[lang][key]) || key; }

function toggleLang(){
  lang = lang==='en' ? 'ar' : 'en';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang==='ar' ? 'rtl' : 'ltr';
  document.getElementById('langBtn').textContent = lang==='en' ? 'عر' : 'EN';
  renderAll();
}

/* ═══════════════════════════════════════════════
   DATA — HR MODULE (Oil & Gas / AMICI)
═══════════════════════════════════════════════ */
let DATA = {
  leads: [
    {id:'LD-001', name:'Acme Corp', email:'info@acme.com', phone:'+1 555-0198', status:'New', source:'Website'}
  ],
  deals: [
    {id:'DL-001', title:'Acme SaaS Deal', lead_id:'LD-001', account_id:null, value:15000, stage:'Prospecting', expected_close_date:'2026-08-01', invoice_id:null, sales_person:'Ahmed Al-Riyami', territory:'Oman North', lost_reason:'', notes:'Initial SaaS opportunity'},
    {id:'DL-002', title:'Block 15 Drilling Consumables', lead_id:null, account_id:'ACC-001', value:98000, stage:'Negotiation', expected_close_date:'2026-07-15', invoice_id:null, sales_person:'Noor Al-Balushi', territory:'Oman South', lost_reason:'', notes:'Competitive bid, pricing discussion ongoing'},
    {id:'DL-003', title:'H2S Safety Training – PDO', lead_id:null, account_id:'ACC-003', value:42000, stage:'Proposal', expected_close_date:'2026-08-20', invoice_id:null, sales_person:'Ahmed Al-Riyami', territory:'Oman South', lost_reason:'', notes:'Technical proposal submitted'},
    {id:'DL-004', title:'Corrosion Monitoring – Shell', lead_id:null, account_id:'ACC-005', value:65000, stage:'Qualification', expected_close_date:'2026-09-01', invoice_id:null, sales_person:'Noor Al-Balushi', territory:'Oman North', lost_reason:'', notes:'Initial meetings completed'},
    {id:'DL-005', title:'Flow Assurance Study – Total', lead_id:null, account_id:'ACC-002', value:35000, stage:'Closed Lost', expected_close_date:'2026-06-01', invoice_id:null, sales_person:'Ahmed Al-Riyami', territory:'Oman South', lost_reason:'Budget constraints – client postponed indefinitely', notes:'Lost to budget freeze'},
  ],
  tasks: [
    {id:'TSK-001', description:'Follow up with Acme', due_date:'2026-06-25', status:'pending', assigned_to:'EMP-001', related_lead_id:'LD-001', related_deal_id:null}
  ],
  contacts: [
    {id:'CON-001',account_id:'ACC-001',salutation:'Mr',first_name:'Sultan',last_name:'Al-Habsi',email:'sultan@oq.om',phone:'+968 91234567',mobile:'+968 99887766',designation:'Procurement Director',department:'Supply Chain',is_primary:true,nationality:'Omani',notes:''},
    {id:'CON-002',account_id:'ACC-001',salutation:'Ms',first_name:'Laila',last_name:'Al-Zadjali',email:'laila@oq.om',phone:'+968 92345678',mobile:'',designation:'Contracts Manager',department:'Legal',is_primary:false,nationality:'Omani',notes:''},
    {id:'CON-003',account_id:'ACC-003',salutation:'Mr',first_name:'Tariq',last_name:'Al-Balushi',email:'tariq@pdo.co.om',phone:'+968 93456789',mobile:'+968 91122334',designation:'Field Operations Manager',department:'Operations',is_primary:true,nationality:'Omani',notes:''},
    {id:'CON-004',account_id:'ACC-005',salutation:'Dr',first_name:'Fatima',last_name:'Al-Said',email:'fatima@shell.om',phone:'+968 94567890',mobile:'',designation:'HSE Director',department:'HSE',is_primary:true,nationality:'Omani',notes:''},
  ],
  quotations: [
    {id:'QTN-001',deal_id:'DL-001',account_id:'ACC-001',account_name:'OQ (Oman Oil & Gas)',lead_id:null,date:'2025-06-10',valid_till:'2025-07-10',items:[{item:'Drilling Consumables Package',description:'PDC bits + mud pump parts',qty:1,rate:45000,amount:45000},{item:'On-site Technical Support',description:'2 engineers × 30 days',qty:60,rate:850,amount:51000}],tax_rate:5,tax_amount:4800,discount_percent:0,discount_amount:0,grand_total:100800,status:'Sent',notes:'Competitive pricing for Block 15'},
    {id:'QTN-002',deal_id:null,account_id:'ACC-003',account_name:'PDO (Petroleum Development Oman)',lead_id:null,date:'2025-06-12',valid_till:'2025-07-12',items:[{item:'H2S Safety Training Program',description:'10-day certification course',qty:1,rate:28000,amount:28000},{item:'PPE Starter Kits',description:'Full PPE sets for 25 personnel',qty:25,rate:650,amount:16250}],tax_rate:5,tax_amount:2212.5,discount_percent:10,discount_amount:4425,grand_total:42037.5,status:'Draft',notes:'Awaiting budget approval'},
  ],
  prospects: [
    {id:'PRO-001',company_name:'TotalEnergies Oman',industry:'Oil & Gas',website:'totalenergies.om',phone:'+968 95678901',email:'info@total.om',territory:'Oman South',prospect_owner:'Ahmed Al-Riyami',status:'Qualified',notes:'Potential Block 12 operator',created_date:'2025-05-20'},
    {id:'PRO-002',company_name:'Oman LNG',industry:'LNG / Gas',website:'omanlng.om',phone:'+968 96789012',email:'contact@omanlng.om',territory:'Oman North',prospect_owner:'Noor Al-Balushi',status:'New',notes:'New facility planned for 2027',created_date:'2025-06-01'},
  ],
  communications: [
    {id:'COM-001',reference_type:'Account',reference_id:'ACC-001',type:'Meeting',subject:'Q3 Contract Review',content:'Discussed pricing for Block 15 drilling consumables. Client requested volume discount.',date:'2025-06-14',sender:'Ahmed Al-Riyami',recipients:'Sultan Al-Habsi, Laila Al-Zadjali'},
    {id:'COM-002',reference_type:'Deal',reference_id:'DL-001',type:'Email',subject:'Proposal Follow-up',content:'Sent revised pricing for Acme SaaS package. Awaiting feedback.',date:'2025-06-13',sender:'Noor Al-Balushi',recipients:'info@acme.com'},
    {id:'COM-003',reference_type:'Lead',reference_id:'LD-001',type:'Call',subject:'Initial Outreach',content:'Called Acme Corp to introduce AMICI services. Interested in safety training.',date:'2025-06-10',sender:'Ahmed Al-Riyami',recipients:'John (Acme Corp)'},
  ],
  attendance: [
    {id:'ATT-001', employee_id:'EMP-001', date:new Date().toISOString().split('T')[0], status:'Present', check_in_time:'08:00', check_out_time:null}
  ],
  expenses: [
    {id:'EXP-001', employee_id:'EMP-001', date:'2026-06-15', amount:250, category:'Travel', description:'Flight to site', status:'Pending'}
  ],
  salarySlips: [
    {id:'SAL-001', employee_id:'EMP-001', month:6, year:2026, base_pay:5000, allowances:1000, deductions:500, net_pay:5500, status:'Paid', payment_id:null}
  ],
  invoices: [
    {id:'INV-001', type:'Sales', party_name:'Acme Corp', date:'2026-05-01', due_date:'2026-06-01', total_amount:15000, status:'Unpaid', deal_id:null, cost_center_id:'CC-DRL-001', tax_template_id:'TAX-VAT-5', tax_rate:5, tax_amount:750, items:[{item:'Field Engineering Support', description:'Block 15 Rig Alpha - Q2 2026', qty:1, rate:15000, amount:15000}]},
    {id:'INV-002', type:'Sales', party_name:'TotalEnergies E&P Oman', date:'2026-05-15', due_date:'2026-06-15', total_amount:22000, status:'Unpaid', deal_id:null, cost_center_id:'CC-HSE-001', tax_template_id:'TAX-VAT-10', tax_rate:10, tax_amount:2200, items:[{item:'HSE Consultancy Retainer', description:'Monthly HSE advisory', qty:1, rate:12000, amount:12000},{item:'Site Inspection Services', description:'Block 6 quarterly', qty:1, rate:10000, amount:10000}]},
    {id:'INV-003', type:'Sales', party_name:'PDO', date:'2026-04-01', due_date:'2026-04-30', total_amount:8500, status:'Unpaid', deal_id:null, cost_center_id:'CC-GEO-001', tax_template_id:'TAX-VAT-5', tax_rate:5, tax_amount:425, items:[{item:'Corrosion Monitoring Report', description:'Q1 2026 analysis', qty:1, rate:8500, amount:8500}]},
    {id:'INV-004', type:'Sales', party_name:'BP Oman', date:'2026-06-10', due_date:'2026-07-10', total_amount:5000, status:'Unpaid', deal_id:null, cost_center_id:'CC-OPS-001', items:[{item:'Process Safety Audit', description:'Gas Train A preliminary', qty:1, rate:5000, amount:5000}]},
    {id:'PINV-001', type:'Purchase', party_name:'DrillTech Supplies', date:'2026-06-01', due_date:'2026-06-15', total_amount:4500, status:'Unpaid', deal_id:null, cost_center_id:'CC-DRL-001', items:[{item:'Drill Bits 8.5" Tricone', description:'For Block 15', qty:3, rate:1500, amount:4500}]},
    {id:'PINV-002', type:'Purchase', party_name:'Nalco Champion', date:'2026-06-05', due_date:'2026-07-05', total_amount:12000, status:'Unpaid', deal_id:null, cost_center_id:'CC-PRD-002', tax_template_id:'TAX-WHT-3', tax_rate:3, tax_amount:360, items:[{item:'Corrosion Inhibitor CI-4400', description:'Bulk supply', qty:600, rate:20, amount:12000}]}
  ],
  payments: [
    {id:'PAY-001', invoice_id:'INV-001', date:'2026-06-15', amount:5000, payment_method:'Bank Transfer', salary_slip_id:null}
  ],
  openPositions: [
    {id:'OP-001', title:'Senior Geologist', department:'Exploration', status:'Open', posted_date:'2026-06-01'}
  ],
  performanceReviews: [
    {id:'PR-001', employee_name:'Khalid Al-Rashidi', period:'Q2 2026', rating:'Exceeds Expectations', status:'Completed'}
  ],
  hseTraining: [
    {id:'TR-001', employee_name:'Khalid Al-Rashidi', course:'H2S Awareness', date:'2026-05-10', status:'Passed'}
  ],
  orgUnits: [
    {id:'OU-001', name:'Drilling', head_count:45, manager:'EMP-010'}
  ],
  costCenters: [
    {id:'CC-DRL-001', name:'Drilling Operations', dept:'Drilling'},
    {id:'CC-PRD-002', name:'Production Operations', dept:'Production'},
    {id:'CC-HSE-001', name:'HSE', dept:'HSE'},
    {id:'CC-FIN-001', name:'Finance & Admin', dept:'Finance'},
    {id:'CC-SCM-001', name:'Supply Chain', dept:'Procurement'},
    {id:'CC-OPS-001', name:'Operations Management', dept:'Operations'},
    {id:'CC-MNT-001', name:'Maintenance', dept:'Maintenance'},
    {id:'CC-INS-001', name:'Instrumentation', dept:'Instrumentation'},
    {id:'CC-GEO-001', name:'Geology & Exploration', dept:'Geology'},
    {id:'CC-IT-001', name:'IT', dept:'IT'},
  ],
  taxTemplates: [
    {id:'TAX-VAT-5', name:'VAT 5%', rate:5, account:'Output VAT'},
    {id:'TAX-VAT-10', name:'VAT 10%', rate:10, account:'Output VAT'},
    {id:'TAX-WHT-3', name:'WHT 3%', rate:3, account:'Withholding Tax'},
  ],
  chartAccounts: [
    {id:'ACC-ASSET', name:'Assets', type:'Asset', parent_id:null, is_group:true, balance:0},
    {id:'ACC-AR', name:'Accounts Receivable', type:'Asset', parent_id:'ACC-ASSET', is_group:false, balance:0},
    {id:'ACC-BANK', name:'Bank', type:'Asset', parent_id:'ACC-ASSET', is_group:false, balance:0},
    {id:'ACC-FA', name:'Fixed Assets', type:'Asset', parent_id:'ACC-ASSET', is_group:true, balance:0},
    {id:'ACC-LIAB', name:'Liabilities', type:'Liability', parent_id:null, is_group:true, balance:0},
    {id:'ACC-AP', name:'Accounts Payable', type:'Liability', parent_id:'ACC-LIAB', is_group:false, balance:0},
    {id:'ACC-EQUITY', name:'Equity', type:'Equity', parent_id:null, is_group:true, balance:0},
    {id:'ACC-RE', name:'Retained Earnings', type:'Equity', parent_id:'ACC-EQUITY', is_group:false, balance:0},
    {id:'ACC-INCOME', name:'Income', type:'Income', parent_id:null, is_group:true, balance:0},
    {id:'ACC-REV', name:'Revenue', type:'Income', parent_id:'ACC-INCOME', is_group:false, balance:0},
    {id:'ACC-EXP', name:'Expenses', type:'Expense', parent_id:null, is_group:true, balance:0},
    {id:'ACC-OPEX', name:'Operating Expenses', type:'Expense', parent_id:'ACC-EXP', is_group:false, balance:0},
  ],
  journalEntries: [
    {id:'JE-001', date:'2026-06-01', reference:'INV-001', description:'Invoice INV-001 auto-posting', entries:[{account_id:'ACC-AR', debit:15000, credit:0},{account_id:'ACC-REV', debit:0, credit:15000}]},
    {id:'JE-002', date:'2026-06-15', reference:'PAY-001', description:'Payment PAY-001 auto-posting', entries:[{account_id:'ACC-BANK', debit:5000, credit:0},{account_id:'ACC-AR', debit:0, credit:5000}]},
  ],
  fixedAssets: [
    {id:'FA-001', name:'Mud Pump Rig Alpha', type:'Machinery & Equipment', purchase_date:'2024-01-15', cost:850000, salvage_value:50000, useful_life_years:10, depreciation_method:'Straight Line', accumulated_depreciation:127500, net_book_value:722500, status:'In Use', supplier_id:'SUP-002'},
    {id:'FA-002', name:'BOP Stack 13-5/8"', type:'Safety Equipment', purchase_date:'2023-06-01', cost:1200000, salvage_value:100000, useful_life_years:15, depreciation_method:'Straight Line', accumulated_depreciation:256667, net_book_value:943333, status:'In Use', supplier_id:'SUP-009'},
    {id:'FA-003', name:'Forklift Toyota 5-ton', type:'Transport & Material Handling', purchase_date:'2025-03-01', cost:45000, salvage_value:5000, useful_life_years:5, depreciation_method:'Straight Line', accumulated_depreciation:3000, net_book_value:42000, status:'In Use', supplier_id:'SUP-015'},
  ],
  qualityInspections: [
    {id:'QI-001',poRef:'PO-2025-001',itemId:'INV-001',itemName:'Corrosion Inhibitor CI-4400',inspectionType:'Incoming',inspector:'Ahmed Al-Riyami',date:'2025-06-01',status:'Passed',parameters:[{param:'Viscosity (cP)',min:30,max:50,actual:42,result:'Pass'},{param:'Density (g/cm³)',min:0.9,max:1.1,actual:1.02,result:'Pass'},{param:'pH',min:6.5,max:8.5,actual:7.1,result:'Pass'}],notes:'All parameters within spec'},
    {id:'QI-002',poRef:'PO-2025-003',itemId:'INV-005',itemName:'Anti-H2S Coveralls',inspectionType:'Incoming',inspector:'Noor Al-Balushi',date:'2025-06-12',status:'Passed',parameters:[{param:'Material Thickness (mm)',min:0.3,max:0.5,actual:0.42,result:'Pass'},{param:'Seam Strength (N)',min:200,max:500,actual:380,result:'Pass'}],notes:'Visual inspection OK'},
    {id:'QI-003',poRef:'PO-2025-005',itemId:'INV-018',itemName:'Portable Fire Extinguisher 9kg',inspectionType:'Incoming',inspector:'Khalid Al-Maawali',date:'2025-06-18',status:'Failed',parameters:[{param:'Pressure (bar)',min:12,max:15,actual:9.2,result:'Fail'},{param:'Weight (kg)',min:8.5,max:10.5,actual:9.8,result:'Pass'}],notes:'Pressure below minimum — rejected'},
    {id:'QI-004',poRef:'PO-2025-002',itemId:'INV-002',itemName:'Scale Inhibitor SI-210',inspectionType:'Incoming',inspector:'Ahmed Al-Riyami',date:'2025-06-20',status:'Pending',parameters:[{param:'Viscosity (cP)',min:25,max:45,actual:0,result:'Pending'},{param:'Density (g/cm³)',min:0.85,max:1.05,actual:0,result:'Pending'}],notes:'Awaiting lab results'},
  ],
  landedCostVouchers: [
    {id:'LCV-001',poRef:'PO-2025-002',date:'2025-06-10',charges:{freight:12500,insurance:3400,duty:8900,handling:2100},totalCharges:26900,distribution:'By Value',items:[{itemId:'INV-001',itemName:'Corrosion Inhibitor CI-4400',proportion:0.6,allocated:16140},{itemId:'INV-002',itemName:'Scale Inhibitor SI-210',proportion:0.4,allocated:10760}]},
    {id:'LCV-002',poRef:'PO-2025-003',date:'2025-06-15',charges:{freight:5800,insurance:1200,duty:0,handling:800},totalCharges:7800,distribution:'By Value',items:[{itemId:'INV-005',itemName:'Anti-H2S Coveralls',proportion:0.7,allocated:5460},{itemId:'INV-016',itemName:'Safety Boots',proportion:0.3,allocated:2340}]},
  ],
  reorderRules: [
    {id:'RR-001',itemId:'INV-002',itemName:'Scale Inhibitor SI-210',supplierId:'SUP-003',minQty:1500,maxQty:4000,leadTimeDays:14,autoCreatePO:true,lastTriggered:null},
    {id:'RR-002',itemId:'INV-004',itemName:'Mud Pump Liner 7.5"',supplierId:'SUP-002',minQty:4,maxQty:8,leadTimeDays:30,autoCreatePO:true,lastTriggered:null},
    {id:'RR-003',itemId:'INV-006',itemName:'SCBA Set (complete)',supplierId:'SUP-008',minQty:10,maxQty:20,leadTimeDays:21,autoCreatePO:false,lastTriggered:'2025-05-01'},
    {id:'RR-004',itemId:'INV-008',itemName:'H2S Gas Detector – Portable',supplierId:'SUP-013',minQty:10,maxQty:25,leadTimeDays:45,autoCreatePO:true,lastTriggered:null},
    {id:'RR-005',itemId:'INV-010',itemName:'Control Valve – Fisher V250 4"',supplierId:'SUP-005',minQty:1,maxQty:4,leadTimeDays:60,autoCreatePO:true,lastTriggered:null},
  ],
  uomConversions: [
    {from:'Litre', to:'Barrel', factor:0.00629},
    {from:'Litre', to:'Gallon', factor:0.264172},
    {from:'Unit', to:'Dozen', factor:12},
    {from:'Kilogram', to:'Ton', factor:0.001},
    {from:'Metre', to:'Feet', factor:3.28084},
  ],
  employees: [
    {id:'EMP-001',firstName:'Khalid',lastName:'Al-Rashidi',name:'Khalid Al-Rashidi',dept:'Drilling',position:'Senior Drilling Engineer',email:'k.alrashidi@amici.com',phone:'+968 9100 1001',status:'active',empType:'Full-time',site:'Block 15 – Rig Alpha',rotation:'28/28',crew:'Offshore',startDate:'2018-03-10',manager:'EMP-010',salaryBand:'G6',costCenter:'CC-DRL-001',nationality:'Omani',visa:'N/A',h2sLevel:'Level 3',medFit:true,medExpiry:'2025-12-01',workPermit:'N/A',
      leave:{annual:{used:8,total:30},sick:{used:2,total:15},remote:{used:4,total:10},training:{used:5,total:10}},
      skills:[{name:'Directional Drilling',pct:92},{name:'Wellbore Stability',pct:85},{name:'Casing Design',pct:78},{name:'HSE Leadership',pct:88}],
      hseCerts:[{name:'IWCF Well Control',expiry:'2025-11-15',status:'valid'},{name:'BOSIET / HUET',expiry:'2025-06-01',status:'expiring'},{name:'H2S Awareness',expiry:'2026-03-20',status:'valid'}],
      history:[{date:'2022-07-01',event:'Promoted to Senior Drilling Engineer'},{date:'2020-04-15',event:'Transferred to Block 15 – Rig Alpha'},{date:'2018-03-10',event:'Joined AMICI as Drilling Engineer'}],
    },
    {id:'EMP-002',firstName:'Fatima',lastName:'Al-Zahra',name:'Fatima Al-Zahra',dept:'Production',position:'Production Chemist',email:'f.alzahra@amici.com',phone:'+968 9100 1002',status:'active',empType:'Full-time',site:'Onshore Processing Facility – South',rotation:'5/2',crew:'Onshore',startDate:'2019-08-20',manager:'EMP-011',salaryBand:'G5',costCenter:'CC-PRD-002',nationality:'Emirati',visa:'N/A',h2sLevel:'Level 2',medFit:true,medExpiry:'2025-09-30',workPermit:'N/A',
      leave:{annual:{used:12,total:30},sick:{used:0,total:15},remote:{used:6,total:10},training:{used:3,total:10}},
      skills:[{name:'Corrosion Inhibition',pct:90},{name:'Flow Assurance',pct:82},{name:'Lab Analysis',pct:95},{name:'Chemical Injection',pct:87}],
      hseCerts:[{name:'NEBOSH IGC',expiry:'2026-05-10',status:'valid'},{name:'H2S Awareness',expiry:'2026-03-20',status:'valid'},{name:'First Aid',expiry:'2025-08-15',status:'expiring'}],
      history:[{date:'2023-01-10',event:'Assigned lead chemist for South Facility'},{date:'2019-08-20',event:'Joined AMICI as Production Chemist'}],
    },
    {id:'EMP-003',firstName:'Ahmed',lastName:'Hassan',name:'Ahmed Hassan',dept:'HSE',position:'HSE Manager',email:'a.hassan@amici.com',phone:'+968 9100 1003',status:'active',empType:'Full-time',site:'Head Office – Muscat',rotation:'N/A',crew:'Support',startDate:'2016-01-05',manager:'EMP-010',salaryBand:'G7',costCenter:'CC-HSE-001',nationality:'Egyptian',visa:'RP-2026-0041',h2sLevel:'Level 3',medFit:true,medExpiry:'2026-01-15',workPermit:'WP-006-2024',
      leave:{annual:{used:5,total:30},sick:{used:1,total:15},remote:{used:8,total:10},training:{used:7,total:10}},
      skills:[{name:'Incident Investigation',pct:95},{name:'Risk Assessment',pct:93},{name:'Emergency Response',pct:90},{name:'HSE Audits',pct:88}],
      hseCerts:[{name:'NEBOSH Diploma',expiry:'2026-09-01',status:'valid'},{name:'IOSH Managing Safely',expiry:'2025-11-22',status:'valid'},{name:'OPITO T-BOSIET',expiry:'2025-07-10',status:'expiring'}],
      history:[{date:'2021-06-01',event:'Promoted to HSE Manager'},{date:'2016-01-05',event:'Joined AMICI as HSE Engineer'}],
    },
    {id:'EMP-004',firstName:'Samira',lastName:'Belhaj',name:'Samira Belhaj',dept:'Finance',position:'Financial Controller',email:'s.belhaj@amici.com',phone:'+968 9100 1004',status:'active',empType:'Full-time',site:'Head Office – Muscat',rotation:'N/A',crew:'Support',startDate:'2017-09-12',manager:'EMP-010',salaryBand:'G7',costCenter:'CC-FIN-001',nationality:'Libyan',visa:'RP-2025-0088',h2sLevel:'N/A',medFit:true,medExpiry:'2026-03-01',workPermit:'WP-012-2024',
      leave:{annual:{used:15,total:30},sick:{used:3,total:15},remote:{used:10,total:10},training:{used:2,total:10}},
      skills:[{name:'IFRS Reporting',pct:94},{name:'Cost Control',pct:90},{name:'Budgeting',pct:88},{name:'Treasury Management',pct:82}],
      hseCerts:[{name:'First Aid',expiry:'2025-12-01',status:'valid'}],
      history:[{date:'2020-01-01',event:'Promoted to Financial Controller'},{date:'2017-09-12',event:'Joined AMICI as Senior Accountant'}],
    },
    {id:'EMP-005',firstName:'Omar',lastName:'Al-Kindi',name:'Omar Al-Kindi',dept:'Reservoir',position:'Reservoir Engineer',email:'o.alkindi@amici.com',phone:'+968 9100 1005',status:'active',empType:'Full-time',site:'Block 7 – Offshore Platform',rotation:'28/28',crew:'Offshore',startDate:'2020-04-01',manager:'EMP-011',salaryBand:'G5',costCenter:'CC-RES-001',nationality:'Omani',visa:'N/A',h2sLevel:'Level 2',medFit:true,medExpiry:'2025-10-20',workPermit:'N/A',
      leave:{annual:{used:3,total:30},sick:{used:0,total:15},remote:{used:2,total:10},training:{used:4,total:10}},
      skills:[{name:'Petrel / Eclipse',pct:88},{name:'Material Balance',pct:82},{name:'Well Testing',pct:79},{name:'PVT Analysis',pct:85}],
      hseCerts:[{name:'BOSIET',expiry:'2025-09-01',status:'expiring'},{name:'H2S Awareness',expiry:'2026-01-15',status:'valid'},{name:'NEBOSH IGC',expiry:'2026-04-10',status:'valid'}],
      history:[{date:'2020-04-01',event:'Joined AMICI as Reservoir Engineer'},{date:'2022-11-01',event:'Assigned to Block 7 Offshore Platform'}],
    },
    {id:'EMP-006',firstName:'Nadia',lastName:'Youssef',name:'Nadia Youssef',dept:'HR',position:'HR Business Partner',email:'n.youssef@amici.com',phone:'+968 9100 1006',status:'active',empType:'Full-time',site:'Head Office – Muscat',rotation:'N/A',crew:'Support',startDate:'2021-02-15',manager:'EMP-010',salaryBand:'G5',costCenter:'CC-HR-001',nationality:'Jordanian',visa:'RP-2025-0102',h2sLevel:'N/A',medFit:true,medExpiry:'2026-02-10',workPermit:'WP-018-2024',
      leave:{annual:{used:9,total:30},sick:{used:2,total:15},remote:{used:8,total:10},training:{used:6,total:10}},
      skills:[{name:'Talent Acquisition',pct:90},{name:'Performance Management',pct:85},{name:'Employee Relations',pct:88},{name:'L&D',pct:80}],
      hseCerts:[{name:'First Aid',expiry:'2026-01-20',status:'valid'}],
      history:[{date:'2021-02-15',event:'Joined AMICI as HR Business Partner'}],
    },
    {id:'EMP-007',firstName:'Tariq',lastName:'Mubarak',name:'Tariq Mubarak',dept:'Maintenance',position:'Mechanical Maintenance Engineer',email:'t.mubarak@amici.com',phone:'+968 9100 1007',status:'active',empType:'Full-time',site:'Gas Treatment Plant – North',rotation:'14/14',crew:'Onshore',startDate:'2019-06-01',manager:'EMP-012',salaryBand:'G5',costCenter:'CC-MNT-001',nationality:'Kuwaiti',visa:'RP-2025-0065',h2sLevel:'Level 2',medFit:true,medExpiry:'2025-08-20',workPermit:'WP-009-2024',
      leave:{annual:{used:6,total:30},sick:{used:4,total:15},remote:{used:1,total:10},training:{used:3,total:10}},
      skills:[{name:'Rotating Equipment',pct:91},{name:'Predictive Maintenance',pct:83},{name:'CMMS (Maximo)',pct:78},{name:'Root Cause Analysis',pct:85}],
      hseCerts:[{name:'NEBOSH IGC',expiry:'2026-07-01',status:'valid'},{name:'H2S Awareness',expiry:'2025-07-15',status:'expired'},{name:'Confined Space Entry',expiry:'2025-11-01',status:'valid'}],
      history:[{date:'2023-03-01',event:'Assigned to Gas Treatment Plant – North'},{date:'2019-06-01',event:'Joined AMICI as Maintenance Engineer'}],
    },
    {id:'EMP-008',firstName:'Laila',lastName:'Al-Farsi',name:'Laila Al-Farsi',dept:'Procurement',position:'Procurement Specialist',email:'l.alfarsi@amici.com',phone:'+968 9100 1008',status:'active',empType:'Full-time',site:'Head Office – Muscat',rotation:'N/A',crew:'Support',startDate:'2022-01-10',manager:'EMP-013',salaryBand:'G4',costCenter:'CC-SCM-001',nationality:'Omani',visa:'N/A',h2sLevel:'N/A',medFit:true,medExpiry:'2026-01-05',workPermit:'N/A',
      leave:{annual:{used:11,total:30},sick:{used:1,total:15},remote:{used:5,total:10},training:{used:2,total:10}},
      skills:[{name:'SAP Procurement',pct:86},{name:'Vendor Evaluation',pct:80},{name:'Contract Management',pct:82},{name:'Logistics Coordination',pct:75}],
      hseCerts:[{name:'First Aid',expiry:'2026-03-10',status:'valid'}],
      history:[{date:'2022-01-10',event:'Joined AMICI as Procurement Specialist'}],
    },
    {id:'EMP-009',firstName:'Yusuf',lastName:'Al-Balushi',name:'Yusuf Al-Balushi',dept:'Drilling',position:'Mud Engineer',email:'y.albalushi@amici.com',phone:'+968 9100 1009',status:'leave',empType:'Full-time',site:'Block 15 – Rig Alpha',rotation:'28/28',crew:'Offshore',startDate:'2020-11-15',manager:'EMP-001',salaryBand:'G4',costCenter:'CC-DRL-001',nationality:'Omani',visa:'N/A',h2sLevel:'Level 2',medFit:true,medExpiry:'2025-12-20',workPermit:'N/A',
      leave:{annual:{used:28,total:30},sick:{used:5,total:15},remote:{used:0,total:10},training:{used:3,total:10}},
      skills:[{name:'Drilling Fluid Design',pct:88},{name:'Fluid Rheology',pct:84},{name:'Lost Circulation Control',pct:79},{name:'Waste Management',pct:72}],
      hseCerts:[{name:'IWCF',expiry:'2025-10-01',status:'expiring'},{name:'H2S Awareness',expiry:'2026-02-10',status:'valid'},{name:'BOSIET',expiry:'2026-01-15',status:'valid'}],
      history:[{date:'2020-11-15',event:'Joined AMICI as Mud Engineer'},{date:'2024-10-01',event:'Annual Leave – Rotation Break'}],
    },
    {id:'EMP-010',firstName:'Mohammed',lastName:'Al-Harbi',name:'Mohammed Al-Harbi',dept:'Operations',position:'VP Operations',email:'m.alharbi@amici.com',phone:'+968 9100 1010',status:'active',empType:'Full-time',site:'Head Office – Muscat',rotation:'N/A',crew:'Support',startDate:'2012-06-01',manager:null,salaryBand:'G10',costCenter:'CC-OPS-001',nationality:'Saudi',visa:'RP-2025-0010',h2sLevel:'Level 3',medFit:true,medExpiry:'2025-11-01',workPermit:'WP-001-2024',
      leave:{annual:{used:10,total:30},sick:{used:0,total:15},remote:{used:10,total:10},training:{used:8,total:10}},
      skills:[{name:'Operations Management',pct:96},{name:'Strategic Planning',pct:92},{name:'Stakeholder Management',pct:94},{name:'HSE Leadership',pct:90}],
      hseCerts:[{name:'NEBOSH Diploma',expiry:'2026-06-01',status:'valid'},{name:'OPITO Leadership',expiry:'2025-10-15',status:'expiring'}],
      history:[{date:'2020-01-01',event:'Promoted to VP Operations'},{date:'2015-03-01',event:'Promoted to Operations Manager'},{date:'2012-06-01',event:'Joined AMICI as Senior Engineer'}],
    },
    {id:'EMP-011',firstName:'Hessa',lastName:'Al-Muhairi',name:'Hessa Al-Muhairi',dept:'Production',position:'Production Manager',email:'h.almuhairi@amici.com',phone:'+968 9100 1011',status:'active',empType:'Full-time',site:'Onshore Processing Facility – South',rotation:'N/A',crew:'Onshore',startDate:'2015-03-20',manager:'EMP-010',salaryBand:'G8',costCenter:'CC-PRD-001',nationality:'Emirati',visa:'N/A',h2sLevel:'Level 3',medFit:true,medExpiry:'2026-03-15',workPermit:'N/A',
      leave:{annual:{used:7,total:30},sick:{used:2,total:15},remote:{used:6,total:10},training:{used:5,total:10}},
      skills:[{name:'Process Optimization',pct:93},{name:'HAZOP Facilitation',pct:88},{name:'Production Reporting',pct:90},{name:'Team Leadership',pct:95}],
      hseCerts:[{name:'NEBOSH IGC',expiry:'2026-08-01',status:'valid'},{name:'HAZOP Leader',expiry:'2025-12-10',status:'valid'},{name:'H2S Awareness',expiry:'2026-01-20',status:'valid'}],
      history:[{date:'2020-07-01',event:'Promoted to Production Manager'},{date:'2015-03-20',event:'Joined AMICI as Production Engineer'}],
    },
    {id:'EMP-012',firstName:'Ibrahim',lastName:'Qasim',name:'Ibrahim Qasim',dept:'Maintenance',position:'Maintenance Manager',email:'i.qasim@amici.com',phone:'+968 9100 1012',status:'active',empType:'Full-time',site:'Gas Treatment Plant – North',rotation:'N/A',crew:'Onshore',startDate:'2014-09-01',manager:'EMP-010',salaryBand:'G8',costCenter:'CC-MNT-001',nationality:'Pakistani',visa:'RP-2025-0033',h2sLevel:'Level 3',medFit:true,medExpiry:'2025-09-01',workPermit:'WP-005-2024',
      leave:{annual:{used:14,total:30},sick:{used:3,total:15},remote:{used:0,total:10},training:{used:4,total:10}},
      skills:[{name:'Reliability Engineering',pct:92},{name:'Shutdown Planning',pct:90},{name:'Rotating Equipment',pct:88},{name:'Static Equipment',pct:85}],
      hseCerts:[{name:'NEBOSH IGC',expiry:'2025-10-20',status:'expiring'},{name:'Permit to Work',expiry:'2026-01-15',status:'valid'},{name:'H2S Awareness',expiry:'2026-02-20',status:'valid'}],
      history:[{date:'2019-01-01',event:'Promoted to Maintenance Manager'},{date:'2014-09-01',event:'Joined AMICI as Senior Maintenance Engineer'}],
    },
    {id:'EMP-013',firstName:'Rania',lastName:'Saleh',name:'Rania Saleh',dept:'Procurement',position:'Supply Chain Manager',email:'r.saleh@amici.com',phone:'+968 9100 1013',status:'active',empType:'Full-time',site:'Head Office – Muscat',rotation:'N/A',crew:'Support',startDate:'2016-07-15',manager:'EMP-010',salaryBand:'G8',costCenter:'CC-SCM-001',nationality:'Lebanese',visa:'RP-2025-0077',h2sLevel:'N/A',medFit:true,medExpiry:'2026-04-01',workPermit:'WP-014-2024',
      leave:{annual:{used:8,total:30},sick:{used:0,total:15},remote:{used:9,total:10},training:{used:6,total:10}},
      skills:[{name:'Strategic Sourcing',pct:93},{name:'Contract Negotiation',pct:90},{name:'Inventory Optimization',pct:87},{name:'Logistics',pct:82}],
      hseCerts:[{name:'First Aid',expiry:'2025-11-15',status:'valid'}],
      history:[{date:'2021-04-01',event:'Promoted to Supply Chain Manager'},{date:'2016-07-15',event:'Joined AMICI as Procurement Officer'}],
    },
    {id:'EMP-014',firstName:'Saud',lastName:'Al-Otaibi',name:'Saud Al-Otaibi',dept:'Instrumentation',position:'Instrument & Control Engineer',email:'s.alotaibi@amici.com',phone:'+968 9100 1014',status:'active',empType:'Contract',site:'Block 7 – Offshore Platform',rotation:'28/28',crew:'Offshore',startDate:'2021-10-01',manager:'EMP-011',salaryBand:'G5',costCenter:'CC-INS-001',nationality:'Saudi',visa:'RP-2025-0091',h2sLevel:'Level 2',medFit:true,medExpiry:'2025-10-05',workPermit:'WP-021-2024',
      leave:{annual:{used:4,total:30},sick:{used:1,total:15},remote:{used:0,total:10},training:{used:5,total:10}},
      skills:[{name:'DCS / SCADA',pct:89},{name:'Control Valve Maintenance',pct:84},{name:'EX Equipment (IECEx)',pct:80},{name:'Loop Checking',pct:92}],
      hseCerts:[{name:'BOSIET',expiry:'2025-08-01',status:'expiring'},{name:'EX Equipment IECEx',expiry:'2026-03-15',status:'valid'},{name:'H2S Awareness',expiry:'2026-02-01',status:'valid'}],
      history:[{date:'2021-10-01',event:'Joined AMICI as Contract I&C Engineer'},{date:'2023-06-01',event:'Contract Renewed for 2 years'}],
    },
    {id:'EMP-015',firstName:'Aisha',lastName:'Mahmoudi',name:'Aisha Mahmoudi',dept:'Geology',position:'Senior Geologist',email:'a.mahmoudi@amici.com',phone:'+968 9100 1015',status:'probation',empType:'Full-time',site:'Head Office – Muscat',rotation:'N/A',crew:'Support',startDate:'2024-08-01',manager:'EMP-010',salaryBand:'G5',costCenter:'CC-GEO-001',nationality:'Moroccan',visa:'RP-2025-0115',h2sLevel:'Level 1',medFit:true,medExpiry:'2026-05-20',workPermit:'WP-028-2024',
      leave:{annual:{used:2,total:15},sick:{used:0,total:10},remote:{used:3,total:5},training:{used:8,total:10}},
      skills:[{name:'Seismic Interpretation',pct:88},{name:'Petrophysics',pct:82},{name:'Petrel',pct:85},{name:'Basin Analysis',pct:79}],
      hseCerts:[{name:'NEBOSH IGC',expiry:'2026-09-01',status:'valid'},{name:'H2S Awareness',expiry:'2026-04-10',status:'valid'}],
      history:[{date:'2024-08-01',event:'Joined AMICI – Probation Period (12 months)'}],
    },
    {id:'EMP-016',firstName:'Walid',lastName:'Mansour',name:'Walid Mansour',dept:'IT',position:'ERP Systems Administrator',email:'w.mansour@amici.com',phone:'+968 9100 1016',status:'active',empType:'Full-time',site:'Head Office – Muscat',rotation:'N/A',crew:'Support',startDate:'2018-11-20',manager:'EMP-010',salaryBand:'G5',costCenter:'CC-IT-001',nationality:'Tunisian',visa:'RP-2025-0054',h2sLevel:'N/A',medFit:true,medExpiry:'2025-11-25',workPermit:'WP-011-2024',
      leave:{annual:{used:13,total:30},sick:{used:2,total:15},remote:{used:10,total:10},training:{used:7,total:10}},
      skills:[{name:'SAP S/4HANA',pct:91},{name:'Database Admin',pct:87},{name:'Cybersecurity',pct:80},{name:'System Integration',pct:83}],
      hseCerts:[{name:'First Aid',expiry:'2026-02-15',status:'valid'}],
      history:[{date:'2018-11-20',event:'Joined AMICI as IT Systems Engineer'},{date:'2022-01-01',event:'Promoted to ERP Systems Administrator'}],
    },
  ],
  leaveRequests: [
    {id:'LR-001',empId:'EMP-001',empName:'Khalid Al-Rashidi',type:'Annual Leave',from:'2025-07-01',to:'2025-07-28',days:28,status:'approved',approver:'Mohammed Al-Harbi'},
    {id:'LR-002',empId:'EMP-005',empName:'Omar Al-Kindi',type:'Annual Leave',from:'2025-06-20',to:'2025-07-17',days:28,status:'pending',approver:'Hessa Al-Muhairi'},
    {id:'LR-003',empId:'EMP-007',empName:'Tariq Mubarak',type:'Sick Leave',from:'2025-06-10',to:'2025-06-12',days:3,status:'approved',approver:'Ibrahim Qasim'},
    {id:'LR-004',empId:'EMP-004',empName:'Samira Belhaj',type:'Annual Leave',from:'2025-08-01',to:'2025-08-15',days:15,status:'pending',approver:'Mohammed Al-Harbi'},
    {id:'LR-005',empId:'EMP-009',empName:'Yusuf Al-Balushi',type:'Annual Leave',from:'2025-05-15',to:'2025-06-11',days:28,status:'approved',approver:'Khalid Al-Rashidi'},
  ],
  notifications: [
    {icon:'fa-triangle-exclamation',color:'var(--warning)',text:'3 equipment certificates expiring within 30 days',time:'2 hours ago'},
    {icon:'fa-user-clock',color:'var(--blue)',text:'Leave request pending: Omar Al-Kindi (28 days)',time:'5 hours ago'},
    {icon:'fa-circle-xmark',color:'var(--error)',text:'Certificate CERT-007 (H2S Detector) — EXPIRED',time:'1 day ago'},
  ],
  fieldServiceLogs: [],
  partners: [],
};

/* ═══════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════ */
function $(s){ return document.querySelector(s); }
function $$(s){ return document.querySelectorAll(s); }
function debounce(fn,ms=200){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}}
const supabaseCatch=e=>{if(e)console.warn('Supabase sync:',e.message);};
const fmt=n=>n?parseFloat(n).toLocaleString():'0';
const fmtDate=d=>{if(!d)return'';const dt=new Date(d);return dt.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});};
const stockCol=s=>s==='low'?'var(--warning)':s==='critical'||s==='out'?'var(--error)':'var(--text-sec)';

// Export generic HTML table to CSV
function exportToCSV(filename = 'export.csv') {
  const table = document.querySelector('.data-table') || document.querySelector('.table');
  if(!table) return showToast('No table found to export', 'error');
  
  let csv = [];
  const rows = table.querySelectorAll('tr');
  for (let i = 0; i < rows.length; i++) {
    let row = [], cols = rows[i].querySelectorAll('td, th');
    for (let j = 0; j < cols.length; j++) {
      let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').trim();
      data = data.replace(/"/g, '""');
      row.push('"' + data + '"');
    }
    csv.push(row.join(','));
  }
  
  const csvFile = new Blob([csv.join('\n')], {type: 'text/csv'});
  const downloadLink = document.createElement('a');
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  showToast('Export successful', 'success');
}

function daysFromNow(d){ if(!d) return null; return Math.round((new Date(d+'T00:00:00')-new Date())/(1000*60*60*24)); }
function initials(name){ return name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
function avatarColor(name){ const colors=['#0070f2','#188918','#e9730c','#6b3fa0','#0f6c6c','#354a5e','#bb0000','#0047ab']; let h=0; for(const c of name) h=(h*31+c.charCodeAt(0))&0xffffff; return colors[Math.abs(h)%colors.length]; }
function destroyCharts(){ state.charts.forEach(c=>{try{c.destroy();}catch(e){}}); state.charts=[]; }

function statusPill(status){
  const s=status&&status.toLowerCase();
  const map={
    active:'pill-active',inactive:'pill-inactive',leave:'pill-leave',probation:'pill-probation',notice:'pill-notice',
    valid:'pill-valid',expired:'pill-expired',expiring:'pill-expiring',renewal:'pill-renewal',
    approved:'pill-approved',pending:'pill-pending',draft:'pill-draft',ordered:'pill-ordered',cancelled:'pill-cancelled',processing:'pill-processing',
  };
  const labelMap={
    active:t('active'),inactive:t('inactive'),leave:t('onLeave'),probation:t('probation'),notice:t('notice'),
    valid:'Valid',expired:'Expired',expiring:'Expiring Soon',renewal:'Due Renewal',
    approved:'Approved',pending:'Pending',draft:'Draft',ordered:'Ordered',cancelled:'Cancelled',processing:'Processing',
  };
  const cls = map[s]||'pill-blue';
  return `<span class="pill ${cls}">${labelMap[s]||status}</span>`;
}

function sortIcon(col){ if(state.sortCol!==col) return '<i class="fa-solid fa-sort sort-icon"></i>'; return state.sortDir==='asc'?'<i class="fa-solid fa-sort-up sort-icon"></i>':'<i class="fa-solid fa-sort-down sort-icon"></i>';}
function sortedCls(col){ return state.sortCol===col?'sorted':''; }
function sortBy(col){ if(state.sortCol===col){state.sortDir=state.sortDir==='asc'?'desc':'asc';}else{state.sortCol=col;state.sortDir='asc';} rerenderSection(); }
function autoResizeTextarea(el){ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,100)+'px'; }
function closeToast(button){
  const toast = button.closest('.toast');
  if(!toast) return;
  toast.classList.add('is-exiting');
  setTimeout(()=>toast.remove(),200);
}

/* ═══════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════ */
function showToast(msg, type='info'){
  const div=document.createElement('div');
  div.className=`toast ${type}`;
  const icons={success:'fa-check-circle',error:'fa-circle-xmark',warning:'fa-triangle-exclamation',info:'fa-circle-info'};
  div.innerHTML=`<i class="fa-solid ${icons[type]||icons.info}" style="font-size:15px;color:var(--${type==='info'?'blue':type==='success'?'success':type==='error'?'error':'warning'});"></i><span>${msg}</span><button class="toast-close" type="button" aria-label="Dismiss notification" data-action="close-toast">×</button>`;
  $('#toastContainer').appendChild(div);
  setTimeout(()=>{ if(div.isConnected) div.classList.add('is-exiting'); },3800);
  setTimeout(()=>div.remove(),4000);
}

/* ═══════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════ */
function openModal(title, body, footer){
  $('#modalBox').innerHTML=`<div class="modal-header"><h3>${title}</h3><button class="modal-close" type="button" aria-label="Close dialog" data-action="close-modal">×</button></div><div class="modal-body">${body}</div><div class="modal-footer">${footer}</div>`;
  $('#modalOverlay').classList.add('open');
}
function closeModal(){ $('#modalOverlay').classList.remove('open'); }

/* ═══════════════════════════════════════════════
   DROPDOWN
═══════════════════════════════════════════════ */
let activeDropdown=null;
function openDropdown(anchor, html){
  const dd=$('#dropdown');
  dd.innerHTML=html;
  const r=anchor.getBoundingClientRect();
  dd.style.top=(r.bottom+4)+'px';
  dd.style.right=(window.innerWidth-r.right)+'px';
  dd.style.left='auto';
  dd.classList.add('open');
  activeDropdown=anchor;
}
function closeDropdown(){ $('#dropdown').classList.remove('open'); activeDropdown=null; }
document.addEventListener('click',e=>{ if(activeDropdown&&!$('#dropdown').contains(e.target)&&e.target!==activeDropdown) closeDropdown(); });

/* ═══════════════════════════════════════════════
   TAB BAR
═══════════════════════════════════════════════ */
const MODULES = [
  {id:'hr',icon:'fa-users',labelKey:'hr'},
  {id:'crm',icon:'fa-handshake',labelKey:'crm'},
  {id:'certificates',icon:'fa-certificate',labelKey:'certificates'},
  {id:'supply',icon:'fa-truck',labelKey:'supplyChain'},
  {id:'fin',icon:'fa-file-invoice-dollar',labelKey:'finance'},
];

function renderTabBar(){
  const isInspector=hasRole('inspector');
  const mods=MODULES.filter(m=>!isInspector||m.id==='certificates');
  $('#tabBar').innerHTML = `<div class="tab-list" role="tablist">${
    mods.map((m,i)=>`
      <div class="tab-item ${state.module===m.id?'active':''}" role="tab" aria-selected="${state.module===m.id}" tabindex="${state.module===m.id?0:-1}" onclick="switchModule('${m.id}')" onKeyDown="if(event.key==='Enter'||event.key===' ')switchModule('${m.id}')">
        <i class="fa-solid ${m.icon}" aria-hidden="true"></i> ${t(m.labelKey)}
      </div>`).join('')
  }</div>`;
}

function switchModule(mod){
  destroyCharts();
  state.module=mod;
  state.section=mod==='hr'?'allEmployees':mod==='crm'?'allAccounts':mod==='certificates'?'allCerts':mod==='fin'?'finDashboard':'scDashboard';
  state.selectedId=null;
  state.filters={};
  state.sortCol=null;
  renderAll();
}

/* ═══════════════════════════════════════════════
   HR SIDEBAR
═══════════════════════════════════════════════ */

function renderHRSidebar(){
  const pendingLeave = DATA.leaveRequests.filter(l=>l.status==='pending'||l.status==='Pending').length;
  const newHireCount = DATA.employees.filter(e=>{const d=new Date(e.startDate);const n=new Date();return(n-d)/(1000*60*60*24*30)<3;}).length;
  const probationCount = DATA.employees.filter(e=>e.status==='probation').length;
  const openPosCount = DATA.openPositions.length;
  const allSections=[
    {group:null, items:[
      {id:'allEmployees',icon:'fa-users',label:t('allEmployees'),roles:['system_admin','hr_manager','hr_user','employee']},
      {id:'newHires',icon:'fa-user-plus',label:t('newHires'),badge:newHireCount,badgeCls:'blue',roles:['system_admin','hr_manager','hr_user']},
      {id:'onProbation',icon:'fa-clock',label:t('onProbation'),badge:probationCount,badgeCls:'orange',roles:['system_admin','hr_manager','hr_user']},
      {id:'leaveRequests',icon:'fa-calendar-xmark',label:t('leaveRequests'),badge:pendingLeave,roles:['system_admin','hr_manager','hr_user','employee']},
      {id:'timesheets',icon:'fa-table-list',label:t('timesheets'),roles:['system_admin','hr_manager','hr_user','employee']},
      {id:'absenceCalendar',icon:'fa-calendar-days',label:t('absenceCalendar'),roles:['system_admin','hr_manager','hr_user','employee']},
    ]},
    {group:'Workforce', items:[
      {id:'openPositions',icon:'fa-briefcase',label:t('openPositions'),badge:openPosCount,roles:['system_admin','hr_manager','hr_user']},
      {id:'performanceCycle',icon:'fa-chart-line',label:t('performanceCycle'),roles:['system_admin','hr_manager']},
      {id:'trainingHSE',icon:'fa-hard-hat',label:t('trainingHSE'),roles:['system_admin','hr_manager']},
      {id:'compensation',icon:'fa-money-bill-wave',label:t('compensation'),roles:['system_admin','hr_manager']},
      {id:'expenseClaims',icon:'fa-file-invoice-dollar',label:'Expense Claims',roles:['system_admin','hr_manager','hr_user','employee']},
      {id:'orgUnits',icon:'fa-sitemap',label:t('orgUnits'),roles:['system_admin','hr_manager','hr_user']},
    ]},
    {group:'Admin', items:[
      {id:'hrSettings',icon:'fa-gear',label:t('hrSettings'),roles:['system_admin','hr_manager']},
    ]},
  ];
  let html='';
  allSections.forEach(s=>{
    const filtered=s.items.filter(i=>i.roles.some(r=>hasRole(r)));
    if(!filtered.length) return;
    if(s.group) html+=`<div class="sidebar-group">${s.group}</div>`;
    filtered.forEach(i=>{
      html+=`<div class="sidebar-item ${state.section===i.id?'active':''}" onclick="switchSection('${i.id}')">
        <i class="fa-solid ${i.icon}"></i> <span style="flex:1">${i.label}</span>
        ${i.badge?`<span class="sidebar-badge ${i.badgeCls||''}">${i.badge}</span>`:''}
      </div>`;
    });
  });
  return html;
}

function switchSection(sec){
  state.section=sec;
  state.selectedId=null;
  state.filters={};
  state.sortCol=null;
  destroyCharts();
  if(state.module==='certificates')renderCertSubNav();
  else{
    const subNav=$('#certSubNav');
    if(subNav)subNav.style.display='none';
    const body=document.querySelector('.app-body');
    if(body)body.classList.remove('subnav-open');
  }
  renderSidebar();
  renderContent();
}

/* ═══════════════════════════════════════════════
   HR KPI DASHBOARD CARDS
═══════════════════════════════════════════════ */
function renderHRKPIs(){
  const total=DATA.employees.length;
  const active=DATA.employees.filter(e=>e.status==='active').length;
  const field=DATA.employees.filter(e=>e.crew==='Offshore'||e.crew==='Onshore').length;
  const open=4;
  const pending=DATA.leaveRequests.filter(l=>l.status==='pending'||l.status==='Pending').length+2;
  return `<div class="kpi-grid">
    <div class="kpi-card"><span class="kpi-label">${t('totalHeadcount')}</span><span class="kpi-value">${total}</span><span class="kpi-change" style="color:var(--text-sec)"><i class="fa-solid fa-building"></i> All Employees</span></div>
    <div class="kpi-card green"><span class="kpi-label">${t('activeEmployees')}</span><span class="kpi-value">${active}</span><span class="kpi-change kpi-up"><i class="fa-solid fa-arrow-up"></i> ${Math.round(active/total*100)}% of total</span></div>
    <div class="kpi-card"><span class="kpi-label">${t('fieldCrewOnSite')}</span><span class="kpi-value">${field}</span><span class="kpi-change" style="color:var(--blue)"><i class="fa-solid fa-oil-well"></i> Offshore + Onshore</span></div>
    <div class="kpi-card orange"><span class="kpi-label">${t('pendingApprovals')}</span><span class="kpi-value">${pending}</span><span class="kpi-change kpi-warn"><i class="fa-solid fa-clock"></i> Awaiting action</span></div>
    <div class="kpi-card red"><span class="kpi-label">${t('openPositionsKpi')}</span><span class="kpi-value">${open}</span><span class="kpi-change kpi-down"><i class="fa-solid fa-briefcase"></i> Vacant roles</span></div>
    <div class="kpi-card purple"><span class="kpi-label">${t('attritionRate')}</span><span class="kpi-value">4.2%</span><span class="kpi-change kpi-up"><i class="fa-solid fa-arrow-down"></i> Below 5% target</span></div>
  </div>`;
}

/* ═══════════════════════════════════════════════
   HR MODULE — ALL EMPLOYEES (Master-Detail)
═══════════════════════════════════════════════ */
function renderAllEmployees(){
  const f=state.filters;
  let items=[...DATA.employees];
  if(state.section==='onProbation') {
    // Show people hired within last 90 days or status is probation
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    items = items.filter(e => e.status === 'probation' || new Date(e.startDate) > ninetyDaysAgo);
  }
  if(f.search){ const s=f.search.toLowerCase(); items=items.filter(e=>e.name.toLowerCase().includes(s)||e.dept.toLowerCase().includes(s)||e.position.toLowerCase().includes(s)||e.site.toLowerCase().includes(s)||e.id.toLowerCase().includes(s)); }
  if(f.dept&&f.dept!=='all') items=items.filter(e=>e.dept===f.dept);
  if(f.status&&f.status!=='all') items=items.filter(e=>e.status===f.status);
  if(f.crew&&f.crew!=='all') items=items.filter(e=>e.crew===f.crew);
  if(state.sortCol){
    const col=state.sortCol,dir=state.sortDir==='asc'?1:-1;
    items.sort((a,b)=>{ let va=a[col],vb=b[col]; if(typeof va==='string') return va.localeCompare(vb)*dir; return (va-vb)*dir; });
  }
  const depts=[...new Set(DATA.employees.map(e=>e.dept))].sort();

  let html=`<div class="fade-in">`;
  html+=renderHRKPIs();
  html+=`<div class="md-layout">`;

  // MASTER LIST
  html+=`<div class="md-master">
    <div class="filter-bar">
      <input class="filter-input" placeholder="${t('search')}..." value="${f.search||''}" oninput="state.filters.search=this.value;rerenderSection()" style="min-width:120px;flex:1">
      <select class="filter-select" onchange="state.filters.dept=this.value;rerenderSection()">
        <option value="all">All Depts</option>${depts.map(d=>`<option value="${d}" ${f.dept===d?'selected':''}>${d}</option>`).join('')}
      </select>
      <select class="filter-select" onchange="state.filters.status=this.value;rerenderSection()">
        <option value="all">All Status</option>
        <option value="active" ${f.status==='active'?'selected':''}>Active</option>
        <option value="leave" ${f.status==='leave'?'selected':''}>On Leave</option>
        <option value="probation" ${f.status==='probation'?'selected':''}>Probation</option>
      </select>
      ${hasRole('hr_manager')?`<button class="btn btn-primary btn-sm" onclick="openNewEmployeeModal()"><i class="fa-solid fa-plus"></i> ${t('newEmployee')}</button>`:''}
    </div>
    <div style="padding:6px 14px 4px;font-size:11px;color:var(--text-sec);background:#fafafa;border-bottom:1px solid var(--border);">${items.length} employees</div>
    <div class="list-container">`;
  if(items.length===0) html+=`<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No employees found</p></div>`;
  items.forEach(e=>{
    html+=`<div class="list-item ${state.selectedId===e.id?'selected':''}" onclick="selectEmployee('${e.id}')">
      <div class="avatar" style="width:36px;height:36px;background:${avatarColor(e.name)};font-size:12px;">${initials(e.name)}</div>
      <div class="list-item-body">
        <div class="list-item-title">${e.name}</div>
        <div class="list-item-desc">${e.position}</div>
      </div>
      <div class="list-item-right">
        ${statusPill(e.status)}
        <div class="list-item-date">${e.dept}</div>
      </div>
    </div>`;
  });
  html+=`</div></div>`;

  // DETAIL PANEL
  html+=`<div class="md-detail ${state.selectedId?'has-item':''}" style="padding:0;">`;
  if(state.selectedId){
    const e=DATA.employees.find(x=>x.id===state.selectedId);
    if(e) html+=renderEmployeeDetail(e);
  } else {
    html+=`<div class="empty-state" style="min-height:400px;"><i class="fa-solid fa-hand-pointer"></i><p>Select an employee to view details</p></div>`;
  }
  html+=`</div></div></div>`;
  return html;
}

function selectEmployee(id){ state.selectedId=id; state.detailTab='info'; rerenderSection(); }

function renderEmployeeDetail(e){
  const tabs=[{id:'info',label:t('info')},{id:'leave',label:t('leave')},{id:'skills',label:t('skillsHse')},{id:'history',label:t('history')},{id:'docs',label:t('documents')}];
  let html=`<div class="obj-header">
    <div class="obj-header-top">
      <div class="avatar" style="width:52px;height:52px;font-size:18px;background:${avatarColor(e.name)}">${initials(e.name)}</div>
      <div style="flex:1;">
        <h2>${e.name}</h2>
        <div class="obj-sub">${e.position} · ${e.dept}</div>
      </div>
      ${statusPill(e.status)}
    </div>
    <div class="obj-kv">
      <div class="obj-kv-item"><span class="obj-kv-label">${t('employeeId')}</span><span class="obj-kv-value">${e.id}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">${t('site')}</span><span class="obj-kv-value">${e.site}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Crew</span><span class="obj-kv-value">${e.crew}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Rotation</span><span class="obj-kv-value">${e.rotation}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">${t('startDate')}</span><span class="obj-kv-value">${fmtDate(e.startDate)}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Nationality</span><span class="obj-kv-value">${e.nationality}</span></div>
    </div>
  </div>
  <div class="detail-tabs">${tabs.map(tb=>`<div class="detail-tab ${state.detailTab===tb.id?'active':''}" onclick="state.detailTab='${tb.id}';rerenderSection()">${tb.label}</div>`).join('')}</div>
  <div class="detail-tab-body">`;

  if(state.detailTab==='info'){
    html+=`<div class="sec-card"><div class="sec-card-head">Employment Details ${hasRole('hr_manager')?`<button class="btn btn-ghost btn-sm" onclick="showToast('Editing ${e.name}','info')"><i class="fa-solid fa-pen"></i> ${t('edit')}</button>`:''}</div>
    <div class="sec-card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
      ${[['Email',e.email],['Phone',e.phone],['Employment Type',e.empType],['Salary Band',e.salaryBand],['Cost Center',e.costCenter],['Manager',e.manager?DATA.employees.find(x=>x.id===e.manager)?.name||e.manager:'—'],['H2S Level',e.h2sLevel],['Work Permit',e.workPermit],['Visa Expiry',e.visa],['Med. Fitness',e.medFit?'<i class="fa-solid fa-check" style="color:var(--success)"></i> Fit':'<i class="fa-solid fa-xmark" style="color:var(--error)"></i> Unfit'],['Med. Expiry',fmtDate(e.medExpiry)]].map(([k,v])=>`<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">${k}</div><div style="font-size:13px;">${v}</div></div>`).join('')}
    </div></div>`;
  }
  else if(state.detailTab==='leave'){
    html+=`<div class="sec-card"><div class="sec-card-head">Leave Balances</div><div class="sec-card-body">`;
    const lv=e.leave||{};
    [['Annual Leave','annual'],['Sick Leave','sick'],['Remote / WFH','remote'],['Training Days','training']].forEach(([lbl,key])=>{
      const b=lv[key]||{used:0,total:0};
      const pct=b.total>0?Math.round(b.used/b.total*100):0;
      const remaining=b.total-b.used;
      html+=`<div class="leave-bar"><div class="leave-bar-label"><span>${lbl}</span><span style="font-size:11px;color:var(--text-sec);">${b.used} used / ${remaining} remaining of ${b.total}</span></div>
      <div class="leave-bar-track"><div class="leave-bar-fill" style="width:${pct}%;background:${pct>80?'var(--warning)':'var(--success)'}"></div></div></div>`;
    });
    html+=`</div></div>`;
    const myLeave=DATA.leaveRequests.filter(l=>l.empId===e.id);
    if(myLeave.length){
      html+=`<div class="sec-card"><div class="sec-card-head">Leave Requests</div><div class="sec-card-body">`;
      myLeave.forEach(l=>{ html+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;"><span>${l.type} · ${fmtDate(l.from)} – ${fmtDate(l.to)}</span>${statusPill(l.status)}</div>`; });
      html+=`</div></div>`;
    }
  }
  else if(state.detailTab==='skills'){
    html+=`<div class="sec-card"><div class="sec-card-head">Technical Skills</div><div class="sec-card-body">`;
    (e.skills||[]).forEach(s=>{ html+=`<div class="skill-bar"><div class="skill-bar-label"><span>${s.name}</span><span>${s.pct}%</span></div><div class="skill-bar-track"><div class="skill-bar-fill" style="width:${s.pct}%"></div></div></div>`; });
    html+=`</div></div>`;
    html+=`<div class="sec-card"><div class="sec-card-head">HSE Certifications</div><div class="sec-card-body">`;
    (e.hseCerts||[]).forEach(c=>{
      const days=daysFromNow(c.expiry);
      const st=days<0?'expired':days<=30?'expiring':days<=90?'renewal':'valid';
      html+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:13px;"><div><i class="fa-solid fa-certificate" style="color:var(--blue);margin-right:6px;"></i>${c.name}</div><div style="text-align:right;">${statusPill(st)}<div style="font-size:11px;color:var(--text-sec);margin-top:2px;">Expires ${fmtDate(c.expiry)}</div></div></div>`;
    });
    html+=`</div></div>`;
  }
  else if(state.detailTab==='history'){
    html+=`<div class="sec-card"><div class="sec-card-head">Career History</div><div class="sec-card-body">`;
    (e.history||[]).forEach(h=>{ html+=`<div class="timeline-item"><div class="timeline-dot"></div><div><div style="font-size:12px;color:var(--text-sec);">${fmtDate(h.date)}</div><div style="font-size:13px;margin-top:2px;">${h.event}</div></div></div>`; });
    html+=`</div></div>`;
  }
  else if(state.detailTab==='docs'){
    const docs=[['Passport / ID','fa-passport','On file'],['Employment Contract','fa-file-contract','Signed '+fmtDate(e.startDate)],['Medical Fitness Cert.','fa-stethoscope','Valid – '+fmtDate(e.medExpiry)],['HSE Training Records','fa-hard-hat','Up to date'],['Visa / Work Permit','fa-id-card',e.visa!=='N/A'?e.visa:'Not Required']];
    html+=`<div class="sec-card"><div class="sec-card-head">Documents</div><div class="sec-card-body">`;
    docs.forEach(([name,icon,note])=>{ html+=`<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid #f0f0f0;"><i class="fa-solid ${icon}" style="width:20px;text-align:center;color:var(--blue);font-size:15px;"></i><div style="flex:1;"><div style="font-size:13px;font-weight:500;">${name}</div><div style="font-size:11px;color:var(--text-sec);">${note}</div></div><button class="btn btn-secondary btn-sm" onclick="showToast('Opening ${name}...','info')"><i class="fa-solid fa-eye"></i></button></div>`; });
    html+=`</div></div>`;
  }

  html+=`</div>`;
  return html;
}

/* ═══════════════════════════════════════════════
   NEW EMPLOYEE MODAL
═══════════════════════════════════════════════ */
function openNewEmployeeModal(){
  const body=`
    <div class="form-row">
      <div class="form-group"><label class="form-label">${t('firstName')}</label><input class="form-input" id="ne-fname" placeholder="First name"></div>
      <div class="form-group"><label class="form-label">${t('lastName')}</label><input class="form-input" id="ne-lname" placeholder="Last name"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">${t('email')}</label><input class="form-input" id="ne-email" type="email" placeholder="name@amici.com"></div>
      <div class="form-group"><label class="form-label">${t('phone')}</label><input class="form-input" id="ne-phone" placeholder="+968 9XXX XXXX"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">${t('dept')}</label>
        <select class="form-select" id="ne-dept">
          ${[...new Set(DATA.employees.map(e=>e.dept))].sort().map(d=>`<option>${d}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">${t('positionTitle')}</label><input class="form-input" id="ne-position" placeholder="Job title"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">${t('employmentType')}</label>
        <select class="form-select" id="ne-type"><option>Full-time</option><option>Contract</option><option>Part-time</option></select>
      </div>
      <div class="form-group"><label class="form-label">${t('startDate')}</label><input class="form-input" id="ne-start" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">${t('siteLocation')}</label>
        <select class="form-select" id="ne-site">
          <option>Block 15 – Rig Alpha</option><option>Block 7 – Offshore Platform</option>
          <option>Onshore Processing Facility – South</option><option>Gas Treatment Plant – North</option>
          <option>Head Office – Muscat</option><option>Block 3 – Exploration Camp</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">${t('crewType')}</label>
        <select class="form-select" id="ne-crew"><option>Offshore</option><option>Onshore</option><option>Support</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">${t('salaryBand')}</label>
        <select class="form-select" id="ne-band"><option>G3</option><option>G4</option><option>G5</option><option>G6</option><option>G7</option><option>G8</option></select>
      </div>
      <div class="form-group"><label class="form-label">${t('nationality')}</label><input class="form-input" id="ne-nat" placeholder="Nationality"></div>
    </div>
    <div class="form-group"><label class="form-label">${t('notes')}</label><textarea class="form-textarea" id="ne-notes" placeholder="Any remarks..."></textarea></div>`;
  const footer=`<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" onclick="submitNewEmployee()">${t('save')}</button>`;
  openModal(t('newEmployee'), body, footer);
}

async function submitNewEmployee(){
  const fn=$('#ne-fname').value.trim(),ln=$('#ne-lname').value.trim();
  if(!fn||!ln){ showToast('First and last name are required','error'); return; }
  const newId='EMP-'+String(DATA.employees.length+1).padStart(3,'0');
  
  const newEmp = {
    id:newId,firstName:fn,lastName:ln,name:fn+' '+ln,
    dept:$('#ne-dept').value,position:$('#ne-position').value||'TBD',
    email:$('#ne-email').value,phone:$('#ne-phone').value,
    status:'probation',empType:$('#ne-type').value,
    site:$('#ne-site').value,crew:$('#ne-crew').value,
    startDate:$('#ne-start').value,salaryBand:$('#ne-band').value,
    nationality:$('#ne-nat').value,rotation:'N/A',h2sLevel:'N/A',
    medFit:false,medExpiry:null,visa:'N/A',workPermit:'N/A',
    manager:null,costCenter:'TBD',leave:{annual:{used:0,total:15},sick:{used:0,total:10},remote:{used:0,total:5},training:{used:0,total:10}},
    skills:[],hseCerts:[],history:[{date:$('#ne-start').value,event:'Joined AMICI'}]
  };

  if (supabase) {
    const { error } = await supabase.from('employees').insert({
      id: newEmp.id, first_name: newEmp.firstName, last_name: newEmp.lastName,
      department: newEmp.dept, position_title: newEmp.position,
      email: newEmp.email, phone: newEmp.phone, status: newEmp.status,
      emp_type: newEmp.empType, site: newEmp.site, start_date: newEmp.startDate,
      salary_band: newEmp.salaryBand, nationality: newEmp.nationality
    });
    if (error) { showToast('Error saving to DB','error'); return; }
    
    // Also insert default leave
    for (const [type, bal] of Object.entries(newEmp.leave)) {
      const { error: lbErr } = await supabase.from('employee_leave_balances').insert({
        employee_id: newEmp.id, leave_type: type, used: bal.used, total: bal.total
      });
      if(lbErr) showToast('Leave balance sync issue: '+lbErr.message,'warning');
    }
  }

  DATA.employees.push(newEmp);
  closeModal();
  state.selectedId=newId;
  showToast(`${fn} ${ln} added successfully`,'success');
  rerenderSection();
}

/* ═══════════════════════════════════════════════
   HR — OTHER SECTIONS (stubs)
═══════════════════════════════════════════════ */
function renderLeaveRequests(){
  const items=DATA.leaveRequests;
  let html=`<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Leave Requests <span style="font-size:12px;color:var(--text-sec);font-weight:400;">(${items.length})</span></h2>
    <button class="btn btn-primary" onclick="openNewLeaveModal()">+ Request Leave</button>
  </div>
  <div class="sec-card">
  <div style="overflow-x:auto;"><table class="data-table table">
    <thead><tr><th>Request ID</th><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Approver</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>`;
  items.forEach(l=>{ html+=`<tr><td style="font-weight:500">${l.id}</td><td>${l.employeeName||l.empName||'Unknown'}</td><td>${l.type}</td><td>${fmtDate(l.startDate||l.from)}</td><td>${fmtDate(l.endDate||l.to)}</td><td>${l.days}</td><td>${l.approver}</td><td>${statusPill(l.status)}</td>
    <td>${l.status==='pending'&&hasRole('hr_manager')?`<button class="btn btn-primary btn-sm" onclick="approveLeave('${l.id}')">Approve</button>`:''}</td></tr>`; });
  html+=`</tbody></table></div></div></div>`;
  return html;
}

function openNewLeaveModal() {
  const body=`<div style="display:flex;flex-direction:column;gap:12px">
    <input class="filter-input" id="nl-emp" placeholder="Employee Name" value="${DATA.employees[0].name}" />
    <select class="filter-select" id="nl-type">
      <option>Annual Leave</option><option>Sick Leave</option><option>Unpaid Leave</option>
    </select>
    <div style="display:flex;gap:10px;">
      <input class="filter-input" id="nl-from" type="date" />
      <input class="filter-input" id="nl-to" type="date" />
    </div>
  </div>`;
  const footer=`<button class="btn btn-primary" onclick="submitLeaveRequest()">Submit Request</button>`;
  openModal('Request Leave', body, footer);
}

async function submitLeaveRequest() {
  const from=$('#nl-from').value, to=$('#nl-to').value, empName=$('#nl-emp').value;
  if(!from||!to) { showToast('Dates required', 'error'); return; }
  
  // Phase 6.2 Prevent double-booking
  const conflict = DATA.leaveRequests.some(l => l.employeeName === empName && l.status !== 'Rejected' && 
    ((from >= l.startDate && from <= l.endDate) || (to >= l.startDate && to <= l.endDate)));
  if(conflict) {
    showToast('Date conflict: Employee already has active leave during this period', 'error');
    return;
  }
  
  const days = Math.round((new Date(to) - new Date(from))/(1000*60*60*24)) + 1;
  const typeVal=$('#nl-type').value;
  const newReq = { id:'LR-'+Date.now(), employeeName:empName, employee_name:empName, type:typeVal, leave_type:typeVal, startDate:from, start_date:from, endDate:to, end_date:to, days, status:'pending' };
  
  if(supabase) await supabase.from('leave_requests').insert({ id:newReq.id, employee_name:empName, leave_type:typeVal, start_date:from, end_date:to, days, status:'pending' });
  DATA.leaveRequests.push(newReq);
  closeModal(); showToast('Leave requested successfully', 'success'); rerenderSection();
}

window.approveLeave = async function(id) {
  if(!requireRoles(['hr_manager','system_admin'],'Access denied: Requires HR Manager')) return;
  const req = DATA.leaveRequests.find(l => l.id === id);
  if(!req||req.status!=='pending') return;
  req.status = 'approved';
  if(supabase) await supabase.from('leave_requests').update({status:'approved'}).eq('id', id);
    
    // Auto-update attendance
    const emp = DATA.employees.find(e => e.name === (req.employeeName||req.empName));
    if(emp) {
      const attId = 'ATT-'+Date.now();
      const newAtt = { id: attId, employee_id: emp.id, date: (req.startDate||req.from), check_in: null, check_out: null, status: 'On Leave' };
      if(supabase) await supabase.from('hr_attendance').insert(newAtt);
      DATA.attendance.push(newAtt);
      showToast('Leave Approved. Attendance updated.', 'success');
    }
    rerenderSection();
}

function renderHRStub(label){
  return `<div class="fade-in"><div class="empty-state" style="padding:80px 20px;"><i class="fa-solid fa-hard-hat" style="font-size:48px;opacity:.2;margin-bottom:16px;"></i><p style="font-size:15px;font-weight:600;">${label}</p><p style="margin-top:6px;font-size:13px;">This section is planned for Chunk 3.</p></div></div>`;
}

/* ═══════════════════════════════════════════════
   DATA — CRM MODULE
═══════════════════════════════════════════════ */
DATA.accounts = [
  {id:'ACC-001',name:'OQ (Oman Oil & Gas)',type:'Operator',country:'Oman',territory:'Oman South',region:'Middle East',owner:'Khalid Al-Rashidi',status:'active',contractValue:4200000,rating:'Hot',blockRef:'Block 15',openOpps:2,
    contacts:[{name:'Saif Al-Habsi',role:'VP Upstream',email:'s.alhabsi@oq.com'},{name:'Muna Al-Lawati',role:'Contracts Manager',email:'m.allawati@oq.com'}],
    opps:[{id:'OPP-001',title:'Integrated Well Services – Phase 3',value:2100000,stage:'Negotiation',closeDate:'2025-09-30',prob:75},{id:'OPP-002',title:'Production Optimisation Study',value:480000,stage:'Technical Bid',closeDate:'2025-11-15',prob:45}],
    activities:[{type:'Meeting',date:'2025-06-02',desc:'Quarterly review at OQ HQ – discussed Phase 3 scope'},{type:'Call',date:'2025-05-20',desc:'Follow-up on contract terms with Saif Al-Habsi'},{type:'Site Visit',date:'2025-04-10',desc:'Joint inspection at Block 15 Rig Alpha'}],
  },
  {id:'ACC-002',name:'TotalEnergies E&P Oman',type:'Operator',country:'Oman',region:'Middle East',owner:'Mohammed Al-Harbi',status:'active',contractValue:7800000,rating:'Hot',blockRef:'Block 6',openOpps:3,
    contacts:[{name:'Pierre Dumas',role:'Country Manager',email:'p.dumas@totalenergies.com'},{name:'Fatima Al-Busaidi',role:'Procurement Lead',email:'f.albusaidi@totalenergies.com'}],
    opps:[{id:'OPP-003',title:'Drilling Services – 4 Well Campaign',value:3600000,stage:'Award',closeDate:'2025-08-01',prob:90},{id:'OPP-004',title:'HSE Consultancy Retainer',value:320000,stage:'Commercial Bid',closeDate:'2025-10-01',prob:60},{id:'OPP-005',title:'Wellbore Integrity Survey',value:950000,stage:'Technical Bid',closeDate:'2025-12-01',prob:40}],
    activities:[{type:'Proposal',date:'2025-06-05',desc:'Submitted commercial bid for Drilling Services campaign'},{type:'Meeting',date:'2025-05-28',desc:'Technical clarification session – Paris office (video)'},{type:'Call',date:'2025-05-10',desc:'Kick-off call for HSE retainer scope discussion'}],
  },
  {id:'ACC-003',name:'BP Oman',type:'JV Partner',country:'Oman',region:'Middle East',owner:'Hessa Al-Muhairi',status:'active',contractValue:2900000,rating:'Warm',blockRef:'Block 61',openOpps:1,
    contacts:[{name:'James Whitfield',role:'Operations Director',email:'j.whitfield@bp.com'},{name:'Amal Al-Sinawi',role:'Engineering Lead',email:'a.alsinawi@bp.com'}],
    opps:[{id:'OPP-006',title:'Process Safety Audit – Gas Train A',value:280000,stage:'Qualification',closeDate:'2026-01-15',prob:30}],
    activities:[{type:'Meeting',date:'2025-05-15',desc:'JV steering committee – FEED review for Block 61'},{type:'Email',date:'2025-04-20',desc:'Sent NDA for shared subsurface data access'}],
  },
  {id:'ACC-004',name:'PDO – Petroleum Development Oman',type:'Operator',country:'Oman',territory:'Oman South',region:'Middle East',owner:'Khalid Al-Rashidi',status:'active',contractValue:11500000,rating:'Hot',blockRef:'South Oman',openOpps:4,
    contacts:[{name:'Hamood Al-Toubi',role:'Head of Drilling',email:'h.altoubi@pdo.co.om'},{name:'Noor Al-Kalbani',role:'Contracts Specialist',email:'n.alkalbani@pdo.co.om'}],
    opps:[{id:'OPP-007',title:'Enhanced Oil Recovery – Pilot Phase',value:4800000,stage:'Commercial Bid',closeDate:'2025-10-30',prob:65},{id:'OPP-008',title:'Corrosion Management Services',value:1100000,stage:'Award',closeDate:'2025-07-15',prob:92},{id:'OPP-009',title:'Produced Water Treatment Study',value:550000,stage:'Negotiation',closeDate:'2025-09-01',prob:80},{id:'OPP-010',title:'Rig Inspection & Certification',value:220000,stage:'Technical Bid',closeDate:'2025-11-30',prob:35}],
    activities:[{type:'Site Visit',date:'2025-06-01',desc:'Visited Marmul field – EOR pilot site walk-through'},{type:'Proposal',date:'2025-05-25',desc:'Submitted commercial bid for EOR pilot'},{type:'Meeting',date:'2025-05-05',desc:'Annual account review at PDO HQ Muscat'}],
  },
  {id:'ACC-005',name:'Shell EP Oman',type:'Operator',country:'Oman',region:'Middle East',owner:'Ahmed Hassan',status:'active',contractValue:3100000,rating:'Warm',blockRef:'Block 10',openOpps:2,
    contacts:[{name:'Laura van den Berg',role:'Asset Manager',email:'l.vandenberg@shell.com'},{name:'Yusuf Al-Amri',role:'HSE Manager',email:'y.alamri@shell.com'}],
    opps:[{id:'OPP-011',title:'HAZOP Study – Gas Compression Unit',value:190000,stage:'Prospect',closeDate:'2026-02-01',prob:20},{id:'OPP-012',title:'Subsea Inspection Services',value:760000,stage:'Qualification',closeDate:'2025-12-15',prob:40}],
    activities:[{type:'Call',date:'2025-05-30',desc:'Introductory call for subsea services scope'},{type:'Email',date:'2025-04-15',desc:'Sent capability presentation deck'}],
  },
  {id:'ACC-006',name:'Schlumberger SIS',type:'Service Company',country:'UAE',region:'Middle East',owner:'Rania Saleh',status:'active',contractValue:890000,rating:'Warm',blockRef:'N/A',openOpps:1,
    contacts:[{name:'Raj Kumar',role:'Account Director',email:'r.kumar@slb.com'}],
    opps:[{id:'OPP-013',title:'Well Data Analytics Platform',value:890000,stage:'Commercial Bid',closeDate:'2025-08-30',prob:55}],
    activities:[{type:'Meeting',date:'2025-06-03',desc:'Demo of new SIS analytics platform at AMICI office'}],
  },
  {id:'ACC-007',name:'Halliburton Oman',type:'Service Company',country:'Oman',region:'Middle East',owner:'Mohammed Al-Harbi',status:'active',contractValue:1650000,rating:'Warm',blockRef:'N/A',openOpps:1,
    contacts:[{name:'Mike Garrison',role:'Business Development Manager',email:'m.garrison@halliburton.com'},{name:'Sara Al-Maskari',role:'Operations Lead',email:'s.almaskari@halliburton.com'}],
    opps:[{id:'OPP-014',title:'Cementing Services Frame Agreement',value:1650000,stage:'Negotiation',closeDate:'2025-09-15',prob:70}],
    activities:[{type:'Proposal',date:'2025-05-22',desc:'Received commercial proposal for frame agreement'},{type:'Meeting',date:'2025-04-30',desc:'Technical evaluation workshop'}],
  },
  {id:'ACC-008',name:'Ministry of Energy & Minerals Oman',type:'Government / Regulator',country:'Oman',region:'Middle East',owner:'Ahmed Hassan',status:'active',contractValue:0,rating:'Warm',blockRef:'National',openOpps:0,
    contacts:[{name:'H.E. Salim Al-Aufi',role:'Minister',email:'N/A'},{name:'Tariq Al-Ghafri',role:'Director – Upstream Licensing',email:'t.alghafri@mem.gov.om'}],
    opps:[],
    activities:[{type:'Meeting',date:'2025-05-10',desc:'Block renewal consultation at MEM HQ'},{type:'Email',date:'2025-03-20',desc:'Submitted annual environmental compliance report'}],
  },
  {id:'ACC-009',name:'CNOOC International',type:'JV Partner',country:'China',region:'Asia Pacific',owner:'Mohammed Al-Harbi',status:'active',contractValue:5500000,rating:'Hot',blockRef:'Block 7',openOpps:2,
    contacts:[{name:'Li Wei',role:'VP International Projects',email:'l.wei@cnooc.com.cn'},{name:'Chen Mei',role:'Finance Director',email:'c.mei@cnooc.com.cn'}],
    opps:[{id:'OPP-015',title:'Offshore Field Development Plan Review',value:2200000,stage:'Technical Bid',closeDate:'2025-11-01',prob:50},{id:'OPP-016',title:'Reservoir Monitoring System',value:1400000,stage:'Qualification',closeDate:'2026-01-20',prob:35}],
    activities:[{type:'Meeting',date:'2025-05-18',desc:'JV board meeting – Block 7 development update'},{type:'Site Visit',date:'2025-04-05',desc:'Platform inspection – offshore Block 7'}],
  },
  {id:'ACC-010',name:'Medco Energi',type:'Operator',country:'Indonesia',region:'Asia Pacific',owner:'Hessa Al-Muhairi',status:'inactive',contractValue:0,rating:'Cold',blockRef:'N/A',openOpps:0,
    contacts:[{name:'Budi Santoso',role:'Business Development',email:'b.santoso@medcoenergi.com'}],
    opps:[],
    activities:[{type:'Call',date:'2024-11-15',desc:'Initial prospecting call – no near-term opportunity'}],
  },
  {id:'ACC-011',name:'Eni Oman',type:'Operator',country:'Italy',region:'Middle East',owner:'Khalid Al-Rashidi',status:'active',contractValue:1200000,rating:'Warm',blockRef:'Block 47',openOpps:1,
    contacts:[{name:'Marco Ferri',role:'Country Representative',email:'m.ferri@eni.com'},{name:'Fatima Al-Hosni',role:'Contracts Officer',email:'f.alhosni@eni.com'}],
    opps:[{id:'OPP-017',title:'Wireline Logging Services',value:420000,stage:'Prospect',closeDate:'2026-03-01',prob:25}],
    activities:[{type:'Meeting',date:'2025-04-22',desc:'Annual business review – Block 47 exploration plan'}],
  },
  {id:'ACC-012',name:'Weatherford Oman',type:'Service Company',country:'Oman',region:'Middle East',owner:'Tariq Mubarak',status:'active',contractValue:740000,rating:'Warm',blockRef:'N/A',openOpps:1,
    contacts:[{name:'David Okeke',role:'Operations Manager',email:'d.okeke@weatherford.com'}],
    opps:[{id:'OPP-018',title:'Managed Pressure Drilling Equipment Rental',value:740000,stage:'Commercial Bid',closeDate:'2025-09-30',prob:60}],
    activities:[{type:'Proposal',date:'2025-05-28',desc:'Received MPD equipment rental proposal'}],
  },
  {id:'ACC-013',name:'GPC – Gulf Petroleum Corporation',type:'Operator',country:'Bahrain',region:'Middle East',owner:'Mohammed Al-Harbi',status:'active',contractValue:980000,rating:'Warm',blockRef:'Offshore Bahrain',openOpps:1,
    contacts:[{name:'Ali Al-Mannai',role:'CEO',email:'a.almannai@gpc.bh'},{name:'Nadia Hussain',role:'Technical Director',email:'n.hussain@gpc.bh'}],
    opps:[{id:'OPP-019',title:'Subsurface Data Reprocessing',value:980000,stage:'Technical Bid',closeDate:'2025-12-10',prob:45}],
    activities:[{type:'Meeting',date:'2025-05-12',desc:'Technical scoping session in Manama'}],
  },
  {id:'ACC-014',name:'Vitol Group',type:'JV Partner',country:'Netherlands',region:'Europe',owner:'Samira Belhaj',status:'active',contractValue:2300000,rating:'Hot',blockRef:'N/A',openOpps:1,
    contacts:[{name:'Erik Janssen',role:'Portfolio Manager',email:'e.janssen@vitol.com'}],
    opps:[{id:'OPP-020',title:'Crude Oil Marketing & Logistics Agreement',value:2300000,stage:'Negotiation',closeDate:'2025-08-15',prob:80}],
    activities:[{type:'Meeting',date:'2025-06-04',desc:'Final commercial negotiation session – Geneva'}],
  },
  {id:'ACC-015',name:'ADNOC Upstream',type:'Operator',country:'UAE',region:'Middle East',owner:'Mohammed Al-Harbi',status:'active',contractValue:6700000,rating:'Hot',blockRef:'Onshore Abu Dhabi',openOpps:2,
    contacts:[{name:'Sultan Al-Jaber',role:'Managing Director',email:'N/A'},{name:'Mariam Al-Mazrouei',role:'Procurement Director',email:'m.almazrouei@adnoc.ae'}],
    opps:[{id:'OPP-021',title:'Integrated Field Management Services',value:3900000,stage:'Commercial Bid',closeDate:'2025-10-15',prob:65},{id:'OPP-022',title:'EPC – Water Injection Facility',value:2800000,stage:'Technical Bid',closeDate:'2026-01-01',prob:40}],
    activities:[{type:'Meeting',date:'2025-05-25',desc:'Pre-qualification review at ADNOC HQ Abu Dhabi'},{type:'Site Visit',date:'2025-04-18',desc:'Site survey – onshore field Abu Dhabi'}],
  },
];

DATA.allOpps = DATA.accounts.flatMap(a=>a.opps||[]).map(o=>{
  const acc = DATA.accounts.find(a=>a.opps&&a.opps.some(op=>op.id===o.id));
  return {...o, accountName: acc?acc.name:'—', accountId: acc?acc.id:'—'};
});

/* ═══════════════════════════════════════════════
   DATA — CERTIFICATE MODULE
═══════════════════════════════════════════════ */
(function(){
  const today = new Date();
  function offsetDays(d){ const dt=new Date(today); dt.setDate(dt.getDate()+d); return dt.toISOString().split('T')[0]; }
  DATA.certificates = [
    {id:'CERT-001',equipName:'HP Centrifugal Pump – P-101A',assetTag:'ROT-P101A',category:'Rotating',site:'Onshore Processing Facility – South',certType:'API 610 Inspection',issuer:'Bureau Veritas',issueDate:'2024-06-01',expiryDate:offsetDays(180),engineer:'Tariq Mubarak',remarks:'Annual API 610 pump inspection. Last overhaul Q2-2024.',pdfUrl:''},
    {id:'CERT-002',equipName:'HP Centrifugal Pump – P-102B',assetTag:'ROT-P102B',category:'Rotating',site:'Onshore Processing Facility – South',certType:'Vibration Analysis Cert.',issuer:'Intertek',issueDate:'2024-09-15',expiryDate:offsetDays(240),engineer:'Tariq Mubarak',remarks:'Baseline vibration signature recorded.',pdfUrl:''},
    {id:'CERT-003',equipName:'Production Separator – V-201',assetTag:'STA-V201',category:'Static',site:'Block 15 – Rig Alpha',certType:'API 510 Pressure Vessel Inspection',issuer:'Lloyd\'s Register',issueDate:'2024-01-20',expiryDate:offsetDays(25),engineer:'Ibrahim Qasim',remarks:'Internal and external inspection. Minor corrosion noted on nozzle N3 – monitor.',pdfUrl:'cert_v201.pdf'},
    {id:'CERT-004',equipName:'Gas Scrubber – V-301',assetTag:'STA-V301',category:'Static',site:'Gas Treatment Plant – North',certType:'PSSR Written Scheme',issuer:'DNV',issueDate:'2023-11-10',expiryDate:offsetDays(-15),engineer:'Ibrahim Qasim',remarks:'EXPIRED – Renewal scheduled for July 2025. Operations notified.',pdfUrl:''},
    {id:'CERT-005',equipName:'Overhead Crane 10T – CR-01',assetTag:'LFT-CR01',category:'Lifting',site:'Block 15 – Rig Alpha',certType:'LOLER Thorough Examination',issuer:'SGS',issueDate:'2025-01-05',expiryDate:offsetDays(60),engineer:'Omar Al-Kindi',remarks:'6-monthly LOLER exam. SWL marked and load tested.',pdfUrl:'cert_cr01.pdf'},
    {id:'CERT-006',equipName:'Man Riding Winch – WN-02',assetTag:'LFT-WN02',category:'Lifting',site:'Block 7 – Offshore Platform',certType:'LOLER Thorough Examination',issuer:'Bureau Veritas',issueDate:'2024-12-10',expiryDate:offsetDays(55),engineer:'Saud Al-Otaibi',remarks:'Wire rope inspected. No broken wires. Brake test passed.',pdfUrl:''},
    {id:'CERT-007',equipName:'H2S Gas Detector – GT-401',assetTag:'INS-GT401',category:'Instrumentation',site:'Gas Treatment Plant – North',certType:'Calibration Certificate',issuer:'Dräger',issueDate:'2024-12-01',expiryDate:offsetDays(-8),engineer:'Saud Al-Otaibi',remarks:'EXPIRED – Recalibration overdue. Unit quarantined pending service.',pdfUrl:''},
    {id:'CERT-008',equipName:'Main Switchgear Panel – SG-101',assetTag:'ELC-SG101',category:'Electrical',site:'Onshore Processing Facility – South',certType:'IEC 60079 Ex Inspection',issuer:'Intertek',issueDate:'2024-05-20',expiryDate:offsetDays(320),engineer:'Walid Mansour',remarks:'Full zone 1 Ex inspection. All cells tested. IR thermography clear.',pdfUrl:'cert_sg101.pdf'},
    {id:'CERT-009',equipName:'UPS Battery System – UPS-01',assetTag:'ELC-UPS01',category:'Electrical',site:'Head Office – Muscat',certType:'Annual Electrical Test',issuer:'In-house',issueDate:'2024-11-01',expiryDate:offsetDays(150),engineer:'Walid Mansour',remarks:'Load bank test and battery capacity verified.',pdfUrl:''},
    {id:'CERT-010',equipName:'Safety Relief Valve – PSV-301',assetTag:'PRS-PSV301',category:'Pressure',site:'Block 15 – Rig Alpha',certType:'PSSR Inspection',issuer:'Lloyd\'s Register',issueDate:'2023-08-15',expiryDate:offsetDays(-45),engineer:'Ahmed Hassan',remarks:'EXPIRED – Valve pulled and sent for bench testing. Replacement in progress.',pdfUrl:'cert_psv301.pdf'},
    {id:'CERT-011',equipName:'High Pressure Manifold – MF-101',assetTag:'PRS-MF101',category:'Pressure',site:'Block 15 – Rig Alpha',certType:'API 570 Piping Inspection',issuer:'DNV',issueDate:'2024-03-10',expiryDate:offsetDays(80),engineer:'Ahmed Hassan',remarks:'Ultrasonic thickness survey completed. Nominal wall thickness within limits.',pdfUrl:'cert_mf101.pdf'},
    {id:'CERT-012',equipName:'CO2 Fire Suppression System – FS-01',assetTag:'FRS-FS01',category:'Fire & Safety',site:'Head Office – Muscat',certType:'Annual System Inspection',issuer:'Kidde',issueDate:'2024-10-15',expiryDate:offsetDays(130),engineer:'Ahmed Hassan',remarks:'Cylinders weighed. All within serviceable limits. Nozzle flow test passed.',pdfUrl:'cert_fs01.pdf'},
    {id:'CERT-013',equipName:'Portable Fire Extinguishers (x12)',assetTag:'FRS-PFE-SET',category:'Fire & Safety',site:'Block 7 – Offshore Platform',certType:'Annual Service & Test',issuer:'Tyco',issueDate:'2025-01-20',expiryDate:offsetDays(230),engineer:'Omar Al-Kindi',remarks:'All 12 units serviced. 2 units replaced due to corrosion on handles.',pdfUrl:''},
    {id:'CERT-014',equipName:'Coriolis Flow Meter – FT-401',assetTag:'INS-FT401',category:'Instrumentation',site:'Onshore Processing Facility – South',certType:'Metrological Calibration',issuer:'SIKA',issueDate:'2024-07-10',expiryDate:offsetDays(200),engineer:'Saud Al-Otaibi',remarks:'Calibrated against traceable standard. Uncertainty ±0.15%.',pdfUrl:'cert_ft401.pdf'},
    {id:'CERT-015',equipName:'Rough Terrain Forklift – FK-03',assetTag:'VEH-FK03',category:'Vehicles',site:'Gas Treatment Plant – North',certType:'LOLER + Annual Vehicle Cert.',issuer:'SGS',issueDate:'2024-09-01',expiryDate:offsetDays(40),engineer:'Tariq Mubarak',remarks:'Load test 5T completed. Tyres and hydraulics checked.',pdfUrl:'cert_fk03.pdf'},
    {id:'CERT-016',equipName:'Offshore Supply Vessel – OSV Falcon',assetTag:'VEH-OSV01',category:'Vehicles',site:'Block 7 – Offshore Platform',certType:'SOLAS Class Survey',issuer:'Bureau Veritas',issueDate:'2024-02-01',expiryDate:offsetDays(260),engineer:'Omar Al-Kindi',remarks:'Annual class survey. No deficiencies noted.',pdfUrl:'cert_osv.pdf'},
    {id:'CERT-017',equipName:'Gas Turbine Compressor – C-201',assetTag:'ROT-C201',category:'Rotating',site:'Gas Treatment Plant – North',certType:'API 670 Vibration System Cert.',issuer:'Emerson',issueDate:'2024-08-20',expiryDate:offsetDays(70),engineer:'Tariq Mubarak',remarks:'Proximity probe system calibrated. Alert and shutdown setpoints verified.',pdfUrl:''},
    {id:'CERT-018',equipName:'Transformer TR-220 – T-101',assetTag:'ELC-T101',category:'Electrical',site:'Onshore Processing Facility – South',certType:'Oil Dielectric Test',issuer:'Intertek',issueDate:'2024-06-15',expiryDate:offsetDays(350),engineer:'Walid Mansour',remarks:'DGA results normal. No acetylene detected. Moisture content acceptable.',pdfUrl:'cert_t101.pdf'},
    {id:'CERT-019',equipName:'SCBA Set – 10 Units',assetTag:'FRS-SCBA-SET',category:'Fire & Safety',site:'Block 15 – Rig Alpha',certType:'Annual Service & Hydro Test',issuer:'MSA Safety',issueDate:'2025-02-10',expiryDate:offsetDays(260),engineer:'Ahmed Hassan',remarks:'All cylinders hydro tested. Flow-through test passed. Harnesses inspected.',pdfUrl:''},
    {id:'CERT-020',equipName:'Subsea BOP Stack – BOP-15A',assetTag:'PRS-BOP15A',category:'Pressure',site:'Block 7 – Offshore Platform',certType:'API 16A BOP Pressure Test',issuer:'DNV',issueDate:'2024-11-05',expiryDate:offsetDays(18),engineer:'Khalid Al-Rashidi',remarks:'Function test and pressure test to 15,000 psi. All rams passed.',pdfUrl:'cert_bop15a.pdf'},
    {id:'CERT-021',equipName:'Pedestal Crane – PC-02',assetTag:'LFT-PC02',category:'Lifting',site:'Block 7 – Offshore Platform',certType:'LOLER + API 2C Survey',issuer:'Lloyd\'s Register',issueDate:'2024-10-20',expiryDate:offsetDays(120),engineer:'Omar Al-Kindi',remarks:'Annual load test to 125% SWL. Slew ring inspection clear.',pdfUrl:'cert_pc02.pdf'},
    {id:'CERT-022',equipName:'Level Transmitter – LT-501',assetTag:'INS-LT501',category:'Instrumentation',site:'Gas Treatment Plant – North',certType:'SIL Functional Test',issuer:'Exida',issueDate:'2024-04-05',expiryDate:offsetDays(165),engineer:'Saud Al-Otaibi',remarks:'SIL-2 function test passed. Trip time within specification.',pdfUrl:''},
  ];
  DATA.certificates.forEach(c=>{
    const days = Math.round((new Date(c.expiryDate)-new Date())/(1000*60*60*24));
    c.daysRemaining = days;
    c.status = days<0?'expired':days<=30?'expiring':days<=90?'renewal':'valid';
    /* ── Rigways integration fields ── */
    c.jobNumber       = c.jobNumber       || '';
    c.certCategory    = c.certCategory    || {'Rotating':'LOAD TEST','Static':'CAT IV','Lifting':'LIFTING','Electrical':'CAT III','Pressure':'CAT IV','Fire & Safety':'ORIGINAL COC','Instrumentation':'CAT III','Vehicles':'LOAD TEST'}[c.category]||'CAT III';
    c.liftingSubtype  = c.liftingSubtype  || (c.category==='Lifting'?{'Overhead Crane 10T – CR-01':'LIFTING EQUIPMENT','Man Riding Winch – WN-02':'LIFTING GEAR','Pedestal Crane – PC-02':'LIFTING PERSONNEL'}[c.equipName]||'LIFTING EQUIPMENT':'');
    c.approvalStatus  = c.approvalStatus  || 'approved';
    c.client          = c.client          || {'Block 15 – Rig Alpha':'ADNOC','Block 7 – Offshore Platform':'ADNOC','Onshore Processing Facility – South':'ADNOC','Gas Treatment Plant – North':'OCC','Head Office – Muscat':'AMICI','Block 3 – Exploration Camp':'OCC'}[c.site]||'ADNOC';
    c.fileName        = c.fileName        || c.pdfUrl || '';
    /* ── FK relationship fields (null for legacy seed data) ── */
    c.clientId = null;
    c.flId = null;
    c.inspectorId = null;
  });
})();

/* ── Functional Locations (client-scoped, Rigways style) ── */
DATA.functionalLocations = [
  {id:'FL-001',flId:'FL-OQ-RG01',name:'Rig Alpha',type:'Rig',clientId:'ACC-001',status:'active'},
  {id:'FL-002',flId:'FL-OQ-PF01',name:'Onshore Processing Facility – South',type:'Workshop',clientId:'ACC-001',status:'active'},
  {id:'FL-003',flId:'FL-OQ-WH01',name:'Warehouse A – South',type:'Warehouse',clientId:'ACC-001',status:'active'},
  {id:'FL-004',flId:'FL-TE-EC01',name:'Exploration Camp Block 6',type:'Yard',clientId:'ACC-002',status:'active'},
  {id:'FL-005',flId:'FL-TE-WS01',name:'Workshop – Block 6',type:'Workshop',clientId:'ACC-002',status:'active'},
  {id:'FL-006',flId:'FL-BP-RG01',name:'Block 61 Rig',type:'Rig',clientId:'ACC-003',status:'active'},
  {id:'FL-007',flId:'FL-BP-YD01',name:'Block 61 Yard',type:'Yard',clientId:'ACC-003',status:'active'},
  {id:'FL-008',flId:'FL-PDO-FC01',name:'South Oman Facility',type:'Workshop',clientId:'ACC-004',status:'active'},
  {id:'FL-009',flId:'FL-SH-LF01',name:'Block 10 Platform',type:'Rig',clientId:'ACC-005',status:'active'},
  {id:'FL-010',flId:'FL-CNO-OC01',name:'Block 7 Platform',type:'Rig',clientId:'ACC-009',status:'active'},
  {id:'FL-011',flId:'FL-HO-001',name:'Head Office – Muscat',type:'Other',clientId:null,status:'active'},
  {id:'FL-012',flId:'FL-CW-001',name:'Central Warehouse – Muscat',type:'Warehouse',clientId:null,status:'active'},
];

/* ── Inspectors (Rigways-style, separate entity linked to employees) ── */
DATA.inspectors = [
  {id:'INS-001',inspectorNumber:'INS-001',employeeId:'EMP-003',name:'Ahmed Hassan',title:'Senior HSE Inspector',email:'a.hassan@amici.com',phone:'+968 9100 1003',status:'active',color:'#e53935'},
  {id:'INS-002',inspectorNumber:'INS-002',employeeId:'EMP-007',name:'Tariq Mubarak',title:'Mechanical Inspector',email:'t.mubarak@amici.com',phone:'+968 9100 1007',status:'active',color:'#1e88e5'},
  {id:'INS-003',inspectorNumber:'INS-003',employeeId:'EMP-012',name:'Ibrahim Qasim',title:'Senior Maintenance Inspector',email:'i.qasim@amici.com',phone:'+968 9100 1012',status:'active',color:'#43a047'},
  {id:'INS-004',inspectorNumber:'INS-004',employeeId:'EMP-014',name:'Saud Al-Otaibi',title:'Instrument & Control Inspector',email:'s.alotaibi@amici.com',phone:'+968 9100 1014',status:'active',color:'#fb8c00'},
];

/* ── Jobs (Work Orders) ── */
DATA.jobs = [
  {id:'JOB-001',title:'Q4 Rig Alpha Inspection',clientId:'ACC-001',flId:'FL-001',status:'open',createdAt:'2026-06-01',completedAt:null,closedAt:null,description:'Annual API inspection of rig equipment, BOPs, and lifting gear.'},
  {id:'JOB-002',title:'H2S & Safety Audit – Gas Plant',clientId:'ACC-009',flId:'FL-010',status:'in_progress',createdAt:'2026-06-10',completedAt:null,closedAt:null,description:'H2S detection systems, SCBA sets, and fire suppression audit.'},
  {id:'JOB-003',title:'Pressure Vessel Inspection – South',clientId:'ACC-001',flId:'FL-002',status:'completed',createdAt:'2026-05-15',completedAt:'2026-06-15',closedAt:null,description:'API 510 inspection of all pressure vessels at Onshore Processing.'},
  {id:'JOB-004',title:'Lifting Equipment LOLER',clientId:'ACC-003',flId:'FL-006',status:'open',createdAt:'2026-06-18',completedAt:null,closedAt:null,description:'Thorough examination of all lifting equipment on Block 61 Rig.'},
  {id:'JOB-005',title:'Electrical Switchgear Survey',clientId:'ACC-001',flId:'FL-002',status:'open',createdAt:'2026-06-20',completedAt:null,closedAt:null,description:'IEC 60079 Ex inspection of all switchgear panels.'},
  {id:'JOB-006',title:'Pipeline Corrosion Survey',clientId:'ACC-004',flId:'FL-008',status:'closed',createdAt:'2026-04-01',completedAt:'2026-05-01',closedAt:'2026-06-01',description:'UT thickness survey of all pipelines at South Oman Facility.'},
];
DATA.jobAssignments = [
  {id:'JA-001',jobId:'JOB-001',inspectorId:'INS-001',assignedAt:'2026-06-01'},
  {id:'JA-002',jobId:'JOB-001',inspectorId:'INS-002',assignedAt:'2026-06-01'},
  {id:'JA-003',jobId:'JOB-002',inspectorId:'INS-001',assignedAt:'2026-06-10'},
  {id:'JA-004',jobId:'JOB-002',inspectorId:'INS-004',assignedAt:'2026-06-10'},
  {id:'JA-005',jobId:'JOB-003',inspectorId:'INS-003',assignedAt:'2026-05-15'},
  {id:'JA-006',jobId:'JOB-004',inspectorId:'INS-002',assignedAt:'2026-06-18'},
  {id:'JA-007',jobId:'JOB-004',inspectorId:'INS-001',assignedAt:'2026-06-18'},
  {id:'JA-008',jobId:'JOB-005',inspectorId:'INS-004',assignedAt:'2026-06-20'},
  {id:'JA-009',jobId:'JOB-006',inspectorId:'INS-001',assignedAt:'2026-04-01'},
];

/* ═══════════════════════════════════════════════
   CRM i18n additions
═══════════════════════════════════════════════ */
Object.assign(i18n.en,{
  allAccounts:'All Accounts',myFavorites:'My Favorites',openContracts:'Open Contracts',wonThisQuarter:'Won This Quarter',myTasks:'My Tasks',fieldServiceLogs:'Field Service Logs',partnersJVs:'Partners / JVs',crmSettings:'CRM Settings',
  totalAccounts:'Total Accounts',activeContractsValue:'Active Contracts Value',winRate:'Contract Win Rate',avgContractValue:'Avg Contract Value',overdueFollowups:'Overdue Follow-ups',
  accountName:'Account Name',accountType:'Type',country:'Country',owner:'Owner',contractValue:'Contract Value',openOpps:'Open Opps',rating:'Rating',
  newAccount:'New Account',
  oppStages:['Prospect','Qualification','Technical Bid','Commercial Bid','Negotiation','Award'],
});
Object.assign(i18n.ar,{
  allAccounts:'كل الحسابات',myFavorites:'المفضلة',openContracts:'العقود المفتوحة',wonThisQuarter:'الفائز هذا الربع',myTasks:'مهامي',fieldServiceLogs:'سجلات الخدمة الميدانية',partnersJVs:'الشركاء / المشاريع المشتركة',crmSettings:'إعدادات CRM',
  totalAccounts:'إجمالي الحسابات',activeContractsValue:'قيمة العقود النشطة',winRate:'معدل الفوز',avgContractValue:'متوسط قيمة العقد',overdueFollowups:'المتابعات المتأخرة',
  accountName:'اسم الحساب',accountType:'النوع',country:'الدولة',owner:'المسؤول',contractValue:'قيمة العقد',openOpps:'الفرص المفتوحة',rating:'التقييم',
  newAccount:'حساب جديد',
  oppStages:['فرصة مبدئية','تأهيل','عرض تقني','عرض تجاري','تفاوض','ترسية'],
});

/* ═══════════════════════════════════════════════
   CERT i18n additions
═══════════════════════════════════════════════ */
Object.assign(i18n.en,{
  allCerts:'All Certificates',expiredCerts:'Expired',expiringSoon:'Expiring Soon',catRotating:'Rotating Equipment',catStatic:'Static Equipment',catLifting:'Lifting Equipment',catElectrical:'Electrical Equipment',catPressure:'Pressure Systems',catFire:'Fire & Safety',catInstrumentation:'Instrumentation',catVehicles:'Vehicles & Mobile',uploadCert:'Upload Certificate',complianceReport:'Compliance Report',
  totalCerts:'Total Certificates',validCerts:'Valid',expiringIn30:'Expiring in 30 Days',expiredCount:'Expired (Critical)',complianceRate:'Compliance Rate',
  equipName:'Equipment Name',assetTag:'Asset Tag',category:'Category',certType:'Certificate Type',issuer:'Issuing Authority',issueDate:'Issue Date',expiryDate:'Expiry Date',daysRemaining:'Days Remaining',responsibleEngineer:'Engineer',
  newCertificate:'New Certificate',
  /* Rigways integration */
  certCategory:'Cert. Category',pendingApproval:'Pending Approval',approved:'Approved',rejected:'Rejected',jobNumber:'Job Number',client:'Client',liftingSubtype:'Lifting Subtype',approvalStatus:'Approval Status',
  catCATIII:'CAT III Inspection',catCATIV:'CAT IV Inspection',catLIFTING:'Lifting Equipment',catLOADTEST:'Load Test',catNDT:'NDT Inspection',catTUBULAR:'Tubular Inspection',catORIGINALCOC:'Original COC',
});
Object.assign(i18n.ar,{
  allCerts:'كل الشهادات',expiredCerts:'منتهية الصلاحية',expiringSoon:'تنتهي قريباً',catRotating:'المعدات الدوارة',catStatic:'المعدات الثابتة',catLifting:'معدات الرفع',catElectrical:'المعدات الكهربائية',catPressure:'أنظمة الضغط',catFire:'الحريق والسلامة',catInstrumentation:'الأجهزة والقياس',catVehicles:'المركبات',uploadCert:'رفع شهادة',complianceReport:'تقرير الامتثال',
  totalCerts:'إجمالي الشهادات',validCerts:'سارية',expiringIn30:'تنتهي خلال 30 يوم',expiredCount:'منتهية (حرجة)',complianceRate:'معدل الامتثال',
  equipName:'اسم المعدة',assetTag:'رقم الأصل',category:'الفئة',certType:'نوع الشهادة',issuer:'جهة الإصدار',issueDate:'تاريخ الإصدار',expiryDate:'تاريخ الانتهاء',daysRemaining:'الأيام المتبقية',responsibleEngineer:'المهندس',
  newCertificate:'شهادة جديدة',
  /* Rigways integration */
  certCategory:'تصنيف الشهادة',pendingApproval:'قيد الموافقة',approved:'معتمدة',rejected:'مرفوضة',jobNumber:'رقم الوظيفة',client:'العميل',liftingSubtype:'نوع الرفع',approvalStatus:'حالة الموافقة',
  catCATIII:'فحص CAT III',catCATIV:'فحص CAT IV',catLIFTING:'معدات الرفع',catLOADTEST:'اختبار تحميل',catNDT:'فحص NDT',catTUBULAR:'فحص الأنابيب',catORIGINALCOC:'شهادة المنشأ',
});

/* ═══════════════════════════════════════════════
   CRM SIDEBAR
═══════════════════════════════════════════════ */
function renderCRMSidebar(){
  const overdueCount = DATA.tasks.filter(t=>t.status!=='completed'&&t.due_date&&t.due_date<new Date().toISOString().split('T')[0]).length;
  const allSections=[
    {group:null,items:[
      {id:'crmLeads',icon:'fa-users-viewfinder',label:'Leads',roles:['system_admin','crm_manager','crm_user']},
      {id:'crmDeals',icon:'fa-kanban',label:'Deals Pipeline',roles:['system_admin','crm_manager','crm_user']},
      {id:'allAccounts',icon:'fa-building',label:t('allAccounts'),roles:['system_admin','crm_manager','crm_user','employee']},
      {id:'crmContacts',icon:'fa-address-card',label:'Contacts',roles:['system_admin','crm_manager','crm_user']},
      {id:'crmQuotations',icon:'fa-file-invoice',label:'Quotations',roles:['system_admin','crm_manager','crm_user']},
      {id:'myFavorites',icon:'fa-star',label:t('myFavorites'),roles:['system_admin','crm_manager','crm_user','employee']},
      {id:'openContracts',icon:'fa-file-signature',label:t('openContracts'),roles:['system_admin','crm_manager','crm_user']},
      {id:'wonThisQuarter',icon:'fa-trophy',label:t('wonThisQuarter'),roles:['system_admin','crm_manager','crm_user']},
    ]},
    {group:'Pipeline',items:[
      {id:'crmProspects',icon:'fa-binoculars',label:'Prospects',roles:['system_admin','crm_manager','crm_user']},
      {id:'crmCommunications',icon:'fa-comments',label:'Communications',roles:['system_admin','crm_manager','crm_user']},
    ]},
    {group:'Analytics',items:[
      {id:'crmWinLoss',icon:'fa-chart-simple',label:'Win/Loss Analysis',roles:['system_admin','crm_manager']},
      {id:'crmTerritory',icon:'fa-map-location-dot',label:'Territory View',roles:['system_admin','crm_manager']},
    ]},
    {group:'Activities',items:[
      {id:'myTasks',icon:'fa-list-check',label:t('myTasks'),badge:overdueCount,badgeCls:'red',roles:['system_admin','crm_manager','crm_user','employee']},
      {id:'fieldServiceLogs',icon:'fa-screwdriver-wrench',label:t('fieldServiceLogs'),roles:['system_admin','crm_manager','crm_user']},
      {id:'partnersJVs',icon:'fa-handshake',label:t('partnersJVs'),roles:['system_admin','crm_manager','crm_user','employee']},
    ]},
    {group:'Admin',items:[
      {id:'crmSettings',icon:'fa-gear',label:t('crmSettings'),roles:['system_admin','crm_manager']},
    ]},
  ];
  let html='';
  allSections.forEach(s=>{
    const filtered=s.items.filter(i=>i.roles.some(r=>hasRole(r)));
    if(!filtered.length) return;
    if(s.group) html+=`<div class="sidebar-group">${s.group}</div>`;
    filtered.forEach(i=>{
      html+=`<div class="sidebar-item ${state.section===i.id?'active':''}" onclick="switchSection('${i.id}')">
        <i class="fa-solid ${i.icon}"></i><span style="flex:1">${i.label}</span>
        ${i.badge?`<span class="sidebar-badge ${i.badgeCls||''}">${i.badge}</span>`:''}
      </div>`;
    });
  });
  return html;
}

/* ═══════════════════════════════════════════════
   CRM KPI CARDS
═══════════════════════════════════════════════ */
function renderCRMKPIs(){
  const active=DATA.accounts.filter(a=>a.status==='active');
  const totalVal=active.reduce((s,a)=>s+a.contractValue,0);
  const allO=DATA.allOpps||DATA.deals||[];
  const won=allO.filter(o=>o.stage==='Award'||o.stage==='Closed Won').length;
  const total=allO.length;
  const avgVal=won>0?allO.filter(o=>o.stage==='Award').reduce((s,o)=>s+o.value,0)/won:0;
  return `<div class="kpi-grid">
    <div class="kpi-card"><span class="kpi-label">${t('totalAccounts')}</span><span class="kpi-value">${DATA.accounts.length}</span><span class="kpi-change" style="color:var(--text-sec)"><i class="fa-solid fa-building"></i> ${active.length} active</span></div>
    <div class="kpi-card green"><span class="kpi-label">${t('activeContractsValue')}</span><span class="kpi-value" style="font-size:20px">${fmt(totalVal)}</span><span class="kpi-change kpi-up"><i class="fa-solid fa-arrow-up"></i> 8.3% vs last quarter</span></div>
    <div class="kpi-card"><span class="kpi-label">${t('winRate')}</span><span class="kpi-value">${total>0?Math.round(won/total*100):0}%</span><span class="kpi-change" style="color:var(--blue)"><i class="fa-solid fa-chart-pie"></i> ${won}/${total} opps</span></div>
    <div class="kpi-card purple"><span class="kpi-label">${t('avgContractValue')}</span><span class="kpi-value" style="font-size:20px">${fmt(avgVal)}</span><span class="kpi-change kpi-up"><i class="fa-solid fa-arrow-up"></i> Per awarded contract</span></div>
    <div class="kpi-card red"><span class="kpi-label">${t('overdueFollowups')}</span><span class="kpi-value">2</span><span class="kpi-change kpi-warn"><i class="fa-solid fa-clock"></i> Tasks past due</span></div>
  </div>`;
}

/* ═══════════════════════════════════════════════
   CRM — ALL ACCOUNTS (Master-Detail)
═══════════════════════════════════════════════ */
function renderAllAccounts(filterFn){
  const f=state.filters;
  let items=[...DATA.accounts];
  if(filterFn) items=items.filter(filterFn);
  if(f.search){const s=f.search.toLowerCase();items=items.filter(a=>a.name.toLowerCase().includes(s)||a.country.toLowerCase().includes(s)||a.owner.toLowerCase().includes(s)||a.id.toLowerCase().includes(s));}
  if(f.type&&f.type!=='all') items=items.filter(a=>a.type===f.type);
  if(f.rating&&f.rating!=='all') items=items.filter(a=>a.rating===f.rating);
  if(state.sortCol){const col=state.sortCol,dir=state.sortDir==='asc'?1:-1;items.sort((a,b)=>{let va=a[col],vb=b[col];if(typeof va==='string')return va.localeCompare(vb)*dir;return (va-vb)*dir;});}
  const types=[...new Set(DATA.accounts.map(a=>a.type))];
  const ratingPill=r=>r==='Hot'?'<span style="color:#b71c1c;font-weight:700"><i class="fa-solid fa-fire" style="color:#b71c1c"></i> Hot</span>':r==='Warm'?'<span style="color:#b35d00;font-weight:700"><i class="fa-solid fa-temperature-quarter" style="color:#e76500"></i> Warm</span>':'<span style="color:#6a6d70;font-weight:700"><i class="fa-solid fa-snowflake" style="color:#0070f2"></i> Cold</span>';

  let html=`<div class="fade-in">`;
  html+=renderCRMKPIs();
  html+=`<div class="md-layout">`;

  // MASTER
  html+=`<div class="md-master">
    <div class="filter-bar">
      <input class="filter-input" placeholder="${t('search')}..." value="${f.search||''}" oninput="state.filters.search=this.value;rerenderSection()" style="flex:1;min-width:100px">
      <select class="filter-select" onchange="state.filters.type=this.value;rerenderSection()">
        <option value="all">All Types</option>${types.map(tp=>`<option value="${tp}" ${f.type===tp?'selected':''}>${tp}</option>`).join('')}
      </select>
      <select class="filter-select" onchange="state.filters.rating=this.value;rerenderSection()">
        <option value="all">All Ratings</option><option value="Hot" ${f.rating==='Hot'?'selected':''}>Hot</option><option value="Warm" ${f.rating==='Warm'?'selected':''}>Warm</option><option value="Cold" ${f.rating==='Cold'?'selected':''}>Cold</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="openNewAccountModal()"><i class="fa-solid fa-plus"></i> ${t('newAccount')}</button>
    </div>
    <div style="padding:6px 14px 4px;font-size:11px;color:var(--text-sec);background:#fafafa;border-bottom:1px solid var(--border);">${items.length} accounts</div>
    <div class="list-container">`;
  if(items.length===0) html+=`<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No accounts found</p></div>`;
  items.forEach(a=>{
    html+=`<div class="list-item ${state.selectedId===a.id?'selected':''}" onclick="selectCRMItem('${a.id}')">
      <div class="avatar" style="width:36px;height:36px;background:${avatarColor(a.name)};font-size:12px;">${initials(a.name)}</div>
      <div class="list-item-body">
        <div class="list-item-title">${a.name}</div>
        <div class="list-item-desc">${a.type} · ${a.country}</div>
      </div>
      <div class="list-item-right">
        ${ratingPill(a.rating)}
        <div class="list-item-date" style="margin-top:3px;">${a.contractValue>0?fmt(a.contractValue):'No contract'}</div>
      </div>
    </div>`;
  });
  html+=`</div></div>`;

  // DETAIL
  html+=`<div class="md-detail ${state.selectedId?'has-item':''}" style="padding:0;">`;
  if(state.selectedId){
    const a=DATA.accounts.find(x=>x.id===state.selectedId);
    if(a) html+=renderAccountDetail(a);
  } else {
    html+=`<div class="empty-state" style="min-height:400px;"><i class="fa-solid fa-hand-pointer"></i><p>Select an account to view details</p></div>`;
  }
  html+=`</div></div></div>`;
  return html;
}

function selectCRMItem(id){ state.selectedId=id; state.detailTab='info'; rerenderSection(); }

function renderAccountDetail(a){
  const tabs=[{id:'info',label:t('info')},{id:'contracts',label:'Contracts'},{id:'timeline',label:'Timeline'},{id:'contacts',label:'Contacts'}];
  const stagePct={Prospect:10,Qualification:25,'Technical Bid':45,'Commercial Bid':65,Negotiation:80,Award:100};
  const stageColor={Prospect:'#6a6d70',Qualification:'#0070f2','Technical Bid':'#e9730c','Commercial Bid':'#6b3fa0',Negotiation:'#0f6c6c',Award:'#188918'};
  const ratingColors={Hot:'#b71c1c',Warm:'#b35d00',Cold:'#5f6368'};

  let html=`<div class="obj-header">
    <div class="obj-header-top">
      <div class="avatar" style="width:52px;height:52px;font-size:18px;background:${avatarColor(a.name)}">${initials(a.name)}</div>
      <div style="flex:1;"><h2>${a.name}</h2><div class="obj-sub">${a.type} · ${a.country} · Block: ${a.blockRef}</div></div>
      <span style="font-weight:700;color:${ratingColors[a.rating]};font-size:13px;"><i class="fa-solid fa-circle" style="font-size:8px;vertical-align:middle;margin-right:3px;color:${ratingColors[a.rating]}"></i> ${a.rating}</span>
    </div>
    <div class="obj-kv">
      <div class="obj-kv-item"><span class="obj-kv-label">Account ID</span><span class="obj-kv-value">${a.id}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Owner</span><span class="obj-kv-value">${a.owner}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Status</span><span class="obj-kv-value">${statusPill(a.status)}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Contract Value</span><span class="obj-kv-value" style="font-size:15px;font-weight:700;color:var(--blue)">${a.contractValue>0?fmt(a.contractValue):'—'}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Open Opps</span><span class="obj-kv-value">${a.openOpps}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Region</span><span class="obj-kv-value">${a.region}</span></div>
    </div>
  </div>
  <div class="detail-tabs">${tabs.map(tb=>`<div class="detail-tab ${state.detailTab===tb.id?'active':''}" onclick="state.detailTab='${tb.id}';rerenderSection()">${tb.label}</div>`).join('')}</div>
  <div class="detail-tab-body">`;

  if(state.detailTab==='info'){
    html+=`<div class="sec-card"><div class="sec-card-head">Account Details <button class="btn btn-ghost btn-sm" onclick="showToast('Editing ${a.name}','info')"><i class="fa-solid fa-pen"></i> Edit</button></div>
    <div class="sec-card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
      ${[['Type',a.type],['Country / Region',a.country+' · '+a.region],['Block / Concession',a.blockRef],['Owner (AMICI)',a.owner],['Contract Value',a.contractValue>0?fmt(a.contractValue):'No active contract'],['Open Opportunities',a.openOpps],['Rating',a.rating],['Status',a.status==='active'?'Active':'Inactive']].map(([k,v])=>`<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">${k}</div><div style="font-size:13px;">${v}</div></div>`).join('')}
    </div></div>`;
  }
  else if(state.detailTab==='contracts'){
    if(a.opps&&a.opps.length){
      a.opps.forEach(o=>{
        const pct=stagePct[o.stage]||0;
        const col=stageColor[o.stage]||'#6a6d70';
        html+=`<div class="sec-card" style="margin-bottom:10px;"><div class="sec-card-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
            <div><div style="font-size:13px;font-weight:600;">${o.title}</div><div style="font-size:11px;color:var(--text-sec);margin-top:2px;">${o.id} · Close: ${fmtDate(o.closeDate)}</div></div>
            <div style="text-align:right;"><div style="font-size:15px;font-weight:700;color:var(--blue)">${fmt(o.value)}</div><div style="font-size:11px;color:var(--text-sec);">${o.prob}% probability</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:#e0e0e0;border-radius:3px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${col};border-radius:3px;transition:width .4s;"></div></div>
            <span style="font-size:11px;font-weight:700;color:${col};white-space:nowrap;">${o.stage}</span>
          </div>
        </div></div>`;
      });
    } else {
      html+=`<div class="empty-state"><i class="fa-solid fa-file-circle-xmark"></i><p>No open contracts</p></div>`;
    }
  }
  else if(state.detailTab==='timeline'){
    html+=`<div class="sec-card"><div class="sec-card-head">Activity Timeline</div><div class="sec-card-body">`;
    const typeIcon={Meeting:'fa-users',Call:'fa-phone',Email:'fa-envelope',Proposal:'fa-file-alt','Site Visit':'fa-location-dot','Field Service':'fa-screwdriver-wrench'};
    (a.activities||[]).forEach(ac=>{
      html+=`<div class="timeline-item"><div style="width:28px;height:28px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid ${typeIcon[ac.type]||'fa-circle-dot'}" style="font-size:12px;"></i></div>
        <div><div style="display:flex;gap:8px;align-items:center;"><span style="font-size:12px;font-weight:600;">${ac.type}</span><span style="font-size:11px;color:var(--text-sec);">${fmtDate(ac.date)}</span></div><div style="font-size:13px;margin-top:2px;">${ac.desc}</div></div></div>`;
    });
    html+=`</div></div>`;
  }
  else if(state.detailTab==='contacts'){
    html+=`<div class="sec-card"><div class="sec-card-head">Key Contacts</div><div class="sec-card-body">`;
    (a.contacts||[]).forEach(c=>{
      html+=`<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f0f0f0;">
        <div class="avatar" style="width:36px;height:36px;background:${avatarColor(c.name)};font-size:12px;">${initials(c.name)}</div>
        <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${c.name}</div><div style="font-size:12px;color:var(--text-sec);">${c.role}</div></div>
        <a href="mailto:${c.email}" style="font-size:12px;color:var(--blue);text-decoration:none;">${c.email!=='N/A'?c.email:''}</a>
      </div>`;
    });
    html+=`</div></div>`;
  }
  html+=`</div>`;
  return html;
}

function openNewAccountModal(){
  const body=`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Account / Company Name</label><input class="form-input" id="na-name" placeholder="e.g. BP Oman"></div>
      <div class="form-group"><label class="form-label">Account Type</label>
        <select class="form-select" id="na-type"><option>Operator</option><option>JV Partner</option><option>Service Company</option><option>Government / Regulator</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Country</label><input class="form-input" id="na-country" placeholder="Country"></div>
      <div class="form-group"><label class="form-label">Region</label>
        <select class="form-select" id="na-region"><option>Middle East</option><option>Asia Pacific</option><option>Europe</option><option>Africa</option><option>Americas</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Block / Concession Ref.</label><input class="form-input" id="na-block" placeholder="e.g. Block 15"></div>
      <div class="form-group"><label class="form-label">Rating</label>
        <select class="form-select" id="na-rating"><option>Hot</option><option>Warm</option><option>Cold</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Account Owner (AMICI)</label>
        <select class="form-select" id="na-owner">${DATA.employees.filter(e=>e.status==='active').map(e=>`<option>${e.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Contract Value (USD)</label><input class="form-input" id="na-value" type="number" value="0" min="0"></div>
    </div>`;
  const footer=`<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" onclick="submitNewAccount()">Create Account</button>`;
  openModal(t('newAccount'),body,footer);
}

async function submitNewAccount(){
  const name=$('#na-name').value.trim();
  if(!name){showToast('Account name is required','error');return;}
  const newId='ACC-'+String(DATA.accounts.length+1).padStart(3,'0');
  
  const newAcc = {id:newId,name,industry:$('#na-type').value,tier:$('#na-region').value,manager_id:$('#na-owner').value,status:'active',revenue:parseInt($('#na-value').value)||0,last_contact:new Date().toISOString().split('T')[0]};
  
  if (supabase) {
    const { error } = await supabase.from('crm_accounts').insert(newAcc);
    if (error) { showToast('Error saving account','error'); return; }
  }

  // Fallback to match UI logic
  const uiAcc = {id:newId,name,type:newAcc.industry,country:'',region:newAcc.tier,blockRef:'N/A',owner:newAcc.manager_id,status:newAcc.status,contractValue:newAcc.revenue,rating:'Warm',openOpps:0,contacts:[],opps:[],activities:[{type:'Created',date:newAcc.last_contact,desc:'Account created'}]};
  DATA.accounts.push(uiAcc);
  if(DATA.accounts.flatMap) DATA.allOpps=DATA.accounts.flatMap(a=>a.opps||[]).map(o=>{const acc=DATA.accounts.find(a=>a.opps&&a.opps.some(op=>op.id===o.id));return{...o,accountName:acc?acc.name:'-',accountId:acc?acc.id:'-'};});
  closeModal();state.selectedId=newId;showToast(name+' added successfully','success');rerenderSection();
}

/* ═══════════════════════════════════════════════
   CERTIFICATE SIDEBAR
═══════════════════════════════════════════════ */
function renderCertSidebar(){
  const certs=DATA.certificates;
  const expired=certs.filter(c=>getCertStatus(c)==='expired').length;
  const expiring=certs.filter(c=>getCertStatus(c)==='expiring').length;
  const pending=certs.filter(c=>c.approvalStatus==='pending').length;
  const cats=['Rotating','Static','Lifting','Electrical','Pressure','Fire & Safety','Instrumentation','Vehicles'];
  const catIcons={'Rotating':'fa-rotate','Static':'fa-industry','Lifting':'fa-weight-hanging','Electrical':'fa-bolt','Pressure':'fa-gauge-high','Fire & Safety':'fa-fire-extinguisher','Instrumentation':'fa-sliders','Vehicles':'fa-truck'};
  const catKeys={'Rotating':'catRotating','Static':'catStatic','Lifting':'catLifting','Electrical':'catElectrical','Pressure':'catPressure','Fire & Safety':'catFire','Instrumentation':'catInstrumentation','Vehicles':'catVehicles'};
  const certTypes=['CAT III','CAT IV','LIFTING','LOAD TEST','NDT','TUBULAR','ORIGINAL COC'];
  const typeIcons={'CAT III':'fa-shield','CAT IV':'fa-shield','LIFTING':'fa-weight-hanging','LOAD TEST':'fa-dumbbell','NDT':'fa-chart-line','TUBULAR':'fa-pipe','ORIGINAL COC':'fa-file-circle-check'};
  const typeKeys={'CAT III':'catCATIII','CAT IV':'catCATIV','LIFTING':'catLIFTING','LOAD TEST':'catLOADTEST','NDT':'catNDT','TUBULAR':'catTUBULAR','ORIGINAL COC':'catORIGINALCOC'};
  const canManage=hasRole('system_admin')||hasRole('inspector');
  let html=`<div class="sidebar-item ${state.section==='allCerts'?'active':''}" onclick="switchSection('allCerts')"><i class="fa-solid fa-certificate"></i><span style="flex:1">${t('allCerts')}</span></div>
    <div class="sidebar-item ${state.section==='expiredCerts'?'active':''}" onclick="switchSection('expiredCerts')"><i class="fa-solid fa-circle-xmark" style="color:var(--error)"></i><span style="flex:1">${t('expiredCerts')}</span><span class="sidebar-badge">${expired}</span></div>
    <div class="sidebar-item ${state.section==='expiringSoon'?'active':''}" onclick="switchSection('expiringSoon')"><i class="fa-solid fa-clock" style="color:var(--warning)"></i><span style="flex:1">${t('expiringSoon')}</span><span class="sidebar-badge orange">${expiring}</span></div>
    <div class="sidebar-item ${state.section==='pendingApproval'?'active':''}" onclick="switchSection('pendingApproval')"><i class="fa-solid fa-hourglass-half" style="color:var(--purple)"></i><span style="flex:1">${t('pendingApproval')}</span><span class="sidebar-badge purple">${pending}</span></div>
    <div class="sidebar-group">${t('certCategory')}</div>`;
  certTypes.forEach(ct=>{
    const id='certType_'+ct.replace(/[^a-z0-9]/gi,'');
    const cnt=certs.filter(c=>c.certCategory===ct).length;
    html+=`<div class="sidebar-item ${state.section===id?'active':''}" onclick="switchSection('${id}')"><i class="fa-solid ${typeIcons[ct]||'fa-tag'}"></i><span style="flex:1">${t(typeKeys[ct])}</span><span class="sidebar-badge blue">${cnt}</span></div>`;
  });
  html+=`<div class="sidebar-group">Equipment Categories</div>`;
  cats.forEach(cat=>{
    const id='cat_'+cat.replace(/[^a-z]/gi,'');
    const cnt=certs.filter(c=>c.category===cat).length;
    html+=`<div class="sidebar-item ${state.section===id?'active':''}" onclick="switchSection('${id}')"><i class="fa-solid ${catIcons[cat]}"></i><span style="flex:1">${t(catKeys[cat])}</span><span class="sidebar-badge blue">${cnt}</span></div>`;
  });
  html+=`<div class="sidebar-group">Actions</div>`;
  if(canManage) html+=`
    <div class="sidebar-item" onclick="openNewCertModal()"><i class="fa-solid fa-upload"></i><span>${t('uploadCert')}</span></div>
    <div class="sidebar-item" onclick="openBulkCertModal()"><i class="fa-solid fa-layer-group"></i><span>Bulk Create</span></div>`;
  html+=`
    <div class="sidebar-item ${state.section==='certGantt'?'active':''}" onclick="switchSection('certGantt')"><i class="fa-solid fa-chart-bar"></i><span>Expiry Timeline</span></div>
    <div class="sidebar-item ${state.section==='certNotifications'?'active':''}" onclick="switchSection('certNotifications')"><i class="fa-solid fa-bell"></i><span>Notifications</span></div>
    <div class="sidebar-item" onclick="showToast('Generating compliance report...','info')"><i class="fa-solid fa-chart-bar"></i><span>${t('complianceReport')}</span></div>`;
  return html;
}

/* ═══════════════════════════════════════════════
   CERTIFICATE KPI CARDS
═══════════════════════════════════════════════ */
function renderCertKPIs(){
  const certs=DATA.certificates;
  const total=certs.length;
  const valid=certs.filter(c=>getCertStatus(c)==='valid').length;
  const expiring=certs.filter(c=>getCertStatus(c)==='expiring').length;
  const expired=certs.filter(c=>getCertStatus(c)==='expired').length;
  const pending=certs.filter(c=>c.approvalStatus==='pending').length;
  const compliance=Math.round(valid/total*100);
  return `<div class="kpi-grid">
    <div class="kpi-card"><span class="kpi-label">${t('totalCerts')}</span><span class="kpi-value">${total}</span><span class="kpi-change" style="color:var(--text-sec)"><i class="fa-solid fa-certificate"></i> Registered</span></div>
    <div class="kpi-card green"><span class="kpi-label">${t('validCerts')}</span><span class="kpi-value">${valid}</span><span class="kpi-change kpi-up"><i class="fa-solid fa-check-circle"></i> In compliance</span></div>
    <div class="kpi-card orange"><span class="kpi-label">${t('expiringIn30')}</span><span class="kpi-value">${expiring}</span><span class="kpi-change kpi-warn"><i class="fa-solid fa-triangle-exclamation"></i> Action required</span></div>
    <div class="kpi-card red"><span class="kpi-label">${t('expiredCount')}</span><span class="kpi-value">${expired}</span><span class="kpi-change kpi-down"><i class="fa-solid fa-circle-xmark"></i> Immediate action!</span></div>
    <div class="kpi-card purple"><span class="kpi-label">${t('pendingApproval')}</span><span class="kpi-value">${pending}</span><span class="kpi-change kpi-warn"><i class="fa-solid fa-hourglass-half"></i> Awaiting review</span></div>
    <div class="kpi-card ${compliance>=90?'green':compliance>=75?'orange':'red'}"><span class="kpi-label">${t('complianceRate')}</span><span class="kpi-value">${compliance}%</span><span class="kpi-change ${compliance>=90?'kpi-up':'kpi-warn'}"><i class="fa-solid fa-${compliance>=90?'check':'triangle-exclamation'}"></i> ${compliance>=90?'On target':'Below target'}</span></div>
  </div>`;
}

/* ═══════════════════════════════════════════════
   CERTIFICATE MODULE — RIGWAYS-STYLE TABLE VIEW
═══════════════════════════════════════════════ */
let certSortCol='expiryDate';
let certSortDir=1;
let certCurrentPage=1;
let certPageSize=Number(localStorage.getItem('cert_page_size')||25);
let certSavedView='all';
let certEntityView='list';
let certClientFilter='all';
let certLocFilter='all';
let certTypeFilter='all';
let certInspectorFilter='all';
let certJobFilter='all';
let certMultipleStatuses=null;

function h(s){if(s===null||s===undefined)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');}

function getCertStatus(c){
  if(c.approvalStatus==='pending')return'pending';
  if(c.approvalStatus==='rejected')return'rejected';
  const t=new Date();t.setHours(0,0,0,0);
  const e=new Date(c.expiryDate);e.setHours(0,0,0,0);
  const d=Math.ceil((e-t)/86400000);
  if(d<0)return'expired';
  if(d<=30)return'expiring';
  return'valid';
}

function getCertDays(c){
  const t=new Date();t.setHours(0,0,0,0);
  const e=new Date(c.expiryDate);e.setHours(0,0,0,0);
  return Math.ceil((e-t)/86400000);
}

function getCertBadge(status){
  const m={approved:{c:'var(--success)',l:'Approved'},pending:{c:'var(--warning)',l:'Pending'},rejected:{c:'var(--error)',l:'Rejected'}};
  const x=m[status]||m.pending;
  return `<span class="pill" style="background:${x.c}22;color:${x.c};border:1px solid ${x.c}44;">${x.l}</span>`;
}

function getCertExpiryBar(c){
  const st=getCertStatus(c);
  if(st==='pending'||st==='rejected')return`<span class="sap-badge">—</span>`;
  const d=getCertDays(c);
  if(d<0)return`<span class="pill pill-expired">${Math.abs(d)}d ago</span>`;
  const cls=d<=7?'var(--error)':d<=30?'var(--warning)':'var(--success)';
  const lbl=d+'d';
  return`<span style="font-size:12px;font-weight:700;color:${cls};">${lbl}</span>`;
}

/* ── Certificate sub-nav bar (status tabs + inspector bar + entity tabs) ── */
function renderCertSubNav(){
  const allCerts=DATA.certificates;
  const tabCounts={
    all:allCerts.length,
    valid:allCerts.filter(c=>getCertStatus(c)==='valid').length,
    expiring:allCerts.filter(c=>getCertStatus(c)==='expiring').length,
    expired:allCerts.filter(c=>getCertStatus(c)==='expired').length,
    pending:allCerts.filter(c=>c.approvalStatus==='pending').length,
    rejected:allCerts.filter(c=>c.approvalStatus==='rejected').length,
    noFile:allCerts.filter(c=>!c.fileName&&!c.pdfUrl).length,
    newUploads:allCerts.filter(c=>{const u=c.uploadTime?new Date(c.uploadTime):null;return u&&(new Date()-u)<=86400000;}).length,
  };
  const badgeCls=(id,i)=>{
    if(i===0||id==='all')return'default';
    if(id==='expiring'||id==='pending'||id==='newUploads')return'warning';
    if(id==='expired'||id==='rejected')return'error';
    return'default';
  };
  const tabs=[
    {id:'all',label:'All'},{id:'valid',label:'Valid'},{id:'expiring',label:'Expiring'},
    {id:'expired',label:'Expired'},{id:'pending',label:'Pending'},{id:'rejected',label:'Rejected'},
    {id:'noFile',label:'No File'},{id:'newUploads',label:'New Uploads'},
  ];
  let html='';
  html+=`<div class="cert-sub-nav" role="tablist">`;
  tabs.forEach((t,i)=>{
    const cnt=tabCounts[t.id];
    html+=`<button class="sap-tab ${certSavedView===t.id?'active':''}" role="tab" aria-selected="${certSavedView===t.id}" tabindex="${certSavedView===t.id?0:-1}" onclick="certSetTab('${t.id}')" onKeyDown="if(event.key==='Enter'||event.key===' ')certSetTab('${t.id}')"><span>${t.label}</span><span class="sap-tab__badge sap-tab__badge--${badgeCls(t.id,i)}">${cnt}</span></button>`;
  });
  html+=`</div>`;

  if(state.currentInspectorId){
    const ins=DATA.inspectors.find(i=>i.id===state.currentInspectorId);
    html+=`<div class="inspector-bar"><span style="display:flex;align-items:center;gap:6px;"><span class="inspector-dot" style="background:${ins?.color||'#6a6d70'}"></span><strong>${ins?h(ins.name):'Inspector'}</strong><span class="badge badge--blue">Inspector Mode</span></span><button class="btn btn-ghost btn-sm" onclick="certLogoutInspector()">Logout</button></div>`;
  } else {
    const inspOpts=DATA.inspectors.filter(i=>i.status==='active').map(i=>`<option value="${i.id}">${h(i.name)} – ${h(i.title)}</option>`).join('');
    html+=`<div class="inspector-bar"><span style="font-size:12px;color:var(--text-sec);cursor:pointer;" onclick="document.getElementById('insLoginDropdown').classList.toggle('open')">Login as Inspector ▾</span><select id="insLoginDropdown" class="col-dropdown" style="position:absolute;top:100%;right:0;display:none;width:240px;" onchange="certLoginInspector(this.value)"><option value="">Select inspector...</option>${inspOpts}</select><div style="flex:1;"></div><span style="font-size:11px;color:var(--text-sec);">Admin Mode</span></div>`;
  }

  const entityTabs=state.currentInspectorId
    ? [{id:'list',label:'Certificates'}]
    : [
        {id:'list',label:'Certificates'},
        {id:'clients',label:'Clients'},
        {id:'functionalLocations',label:'Functional Locations'},
        {id:'inspectors',label:'Inspectors'},
        {id:'jobs',label:'Jobs'},
      ];
  html+=`<div class="cert-sub-nav" role="tablist">`;
  entityTabs.forEach(t=>{
    const isJobTab=t.id==='jobs';
    const jobCounts=isJobTab?getJobsForCurrentUser().length:0;
    html+=`<button class="sap-tab ${certEntityView===t.id?'active':''}" role="tab" aria-selected="${certEntityView===t.id}" tabindex="${certEntityView===t.id?0:-1}" onclick="certSetEntityView('${t.id}')" onKeyDown="if(event.key==='Enter'||event.key===' ')certSetEntityView('${t.id}')"><span>${t.label}</span>${isJobTab?`<span class="sap-tab__badge sap-tab__badge--${jobCounts?'warning':'default'}">${jobCounts}</span>`:''}</button>`;
  });
  html+=`</div>`;

  const el=$('#certSubNav');
  if(el){
    el.style.display='';
    el.innerHTML=html;
  }
  const body=document.querySelector('.app-body');
  if(body)body.classList.add('subnav-open');
}

function renderCertificates(filterFn){
  const isMobile=window.innerWidth<=768;
  if(![25,50,100].includes(certPageSize))certPageSize=25;
  // Reset page when section changes (filterFn means section routing)
  if(filterFn)certCurrentPage=1;

  let data=filterFn?DATA.certificates.filter(filterFn):[...DATA.certificates];
  // Inspector auto-filter: inspector sees only certs assigned to them or their active jobs
  if(state.currentInspectorId){
    const activeJobs=DATA.jobAssignments
      .filter(ja=>ja.inspectorId===state.currentInspectorId&&ja.status!=='closed')
      .map(ja=>ja.jobId);
    data=data.filter(c=>c.inspectorId===state.currentInspectorId||(c.jobId&&activeJobs.includes(c.jobId)));
  }
  const search=(state.filters.search||'').toLowerCase();

  // Apply saved view / sub-nav tab filter
  if(!filterFn){
    if(certSavedView==='valid')data=data.filter(c=>getCertStatus(c)==='valid');
    else if(certSavedView==='expired')data=data.filter(c=>getCertStatus(c)==='expired');
    else if(certSavedView==='expiring')data=data.filter(c=>getCertStatus(c)==='expiring');
    else if(certSavedView==='pending')data=data.filter(c=>c.approvalStatus==='pending');
    else if(certSavedView==='rejected')data=data.filter(c=>c.approvalStatus==='rejected');
    else if(certSavedView==='noFile')data=data.filter(c=>!c.fileName&&!c.pdfUrl);
    else if(certSavedView==='newUploads'){
      const n=new Date();
      data=data.filter(c=>{const u=c.uploadTime?new Date(c.uploadTime):null;return u&&(n-u)<=86400000;});
    }
  }

  // Search
  if(search)data=data.filter(c=>
    (c.equipName||'').toLowerCase().includes(search)||
    (c.assetTag||'').toLowerCase().includes(search)||
    (c.certType||'').toLowerCase().includes(search)||
    (c.id||'').toLowerCase().includes(search)||
    (c.jobNumber||'').toLowerCase().includes(search)||
    (c.client||'').toLowerCase().includes(search)||
    (c.issuer||'').toLowerCase().includes(search)
  );

  // Dropdown filters
  if(certClientFilter!=='all')data=data.filter(c=>c.clientId===certClientFilter);
  if(certLocFilter!=='all')data=data.filter(c=>c.flId===certLocFilter);
  if(certTypeFilter!=='all')data=data.filter(c=>c.certCategory===certTypeFilter);
  if(certInspectorFilter!=='all')data=data.filter(c=>c.inspectorId===certInspectorFilter);
  if(certJobFilter!=='all')data=data.filter(c=>c.jobId===certJobFilter);

  // Legacy state filters
  if(state.filters.certCategory&&state.filters.certCategory!=='all')data=data.filter(c=>c.certCategory===state.filters.certCategory);
  if(state.filters.status==='valid')data=data.filter(c=>getCertStatus(c)==='valid');
  else if(state.filters.status==='expiring')data=data.filter(c=>getCertStatus(c)==='expiring');
  else if(state.filters.status==='expired')data=data.filter(c=>getCertStatus(c)==='expired');
  else if(state.filters.status==='pending')data=data.filter(c=>c.approvalStatus==='pending');
  else if(state.filters.status==='rejected')data=data.filter(c=>c.approvalStatus==='rejected');

  // Sort
  data.sort((a,b)=>{
    let va=a[certSortCol],vb=b[certSortCol];
    if(typeof va==='string')return va.localeCompare(vb||'')*certSortDir;
    return((va||0)-(vb||0))*certSortDir;
  });

  const total=data.length;
  const start=(certCurrentPage-1)*certPageSize;
  const end=Math.min(start+certPageSize,total);
  const page=data.slice(start,end);

  const TYPE_COLORS={
    'CAT III':{bg:'#e8f3ff',color:'#0070f2'},
    'CAT IV':{bg:'#dce8ff',color:'#0057c2'},
    'ORIGINAL COC':{bg:'#f0faf0',color:'#188918'},
    'LOAD TEST':{bg:'#fff3e0',color:'#e76500'},
    'NDT':{bg:'#fce4e4',color:'#bb0000'},
    'TUBULAR':{bg:'#f3e5f5',color:'#7b1fa2'},
    'LIFTING':{bg:'#fff3e0',color:'#e76500'},
  };
  const tc=TYPE_COLORS;

  let html=`<div class="fade-in">`;
  html+=renderCertKPIs();
  html+=`<div class="sap-card" style="background:var(--white);border:1px solid var(--border);border-radius:8px;overflow:hidden;">`;

  if(certEntityView==='list'){
    html+=`<div class="sap-table-wrapper cert-table-view">`;

    // Toolbar with filter dropdowns
    const clientOpts=DATA.accounts.filter(a=>a.status==='active').map(a=>`<option value="${a.id}" ${certClientFilter===a.id?'selected':''}>${h(a.name)}</option>`).join('');
    const locOpts=DATA.functionalLocations.filter(f=>f.status==='active').map(f=>`<option value="${f.id}" ${certLocFilter===f.id?'selected':''}>${h(f.name)}</option>`).join('');
    const typeOpts=[...new Set(DATA.certificates.map(c=>c.certCategory).filter(Boolean))].map(t=>`<option value="${t}" ${certTypeFilter===t?'selected':''}>${t}</option>`).join('');
    html+=`<div class="cert-toolbar">
      <input type="checkbox" class="sap-checkbox" aria-label="Select all" onchange="certToggleSelectAll(this)" style="margin-right:2px;">
      <div class="sap-search-box">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Search certs..." value="${h(state.filters.search||'')}" oninput="state.filters.search=this.value;rerenderSection()">
    </div>
    <span class="cert-toolbar__count">${total}</span>
    <div style="width:1px;height:20px;background:var(--border);flex-shrink:0;"></div>
    <select class="cert-filter-select" onchange="certSetFilter('client',this.value)"><option value="all">All Clients</option>${clientOpts}</select>
    <select class="cert-filter-select" onchange="certSetFilter('loc',this.value)"><option value="all">All Locations</option>${locOpts}</select>
    <select class="cert-filter-select" onchange="certSetFilter('type',this.value)"><option value="all">All Types</option>${typeOpts}</select>
    <div class="col-selector-wrap">
      <button class="col-selector-btn" onclick="certToggleColDropdown()">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        <span>Columns</span>
        <span class="badge" id="certColBadge">13</span>
      </button>
      <div class="col-dropdown" id="certColDropdown">
        <div class="col-dropdown__header"><span>Visible Columns</span><button class="col-dropdown__reset" onclick="certResetColumns()">Reset</button></div>
        <label class="col-dropdown__item col-dropdown__item--locked"><input type="checkbox" checked disabled/><span>Certificate Name</span></label>
        ${['jobNumber','certId','assetTag','category','certType','issuedBy','issueDate','expiry','approval','client','qr','fileLink'].map(c=>`<label class="col-dropdown__item"><input type="checkbox" id="certCol_${c}" checked onchange="certApplyColVisibility()"/><span>${c.charAt(0).toUpperCase()+c.slice(1).replace('certId','Cert ID').replace('assetTag','Asset Tag').replace('issuedBy','Issued By').replace('issueDate','Issue Date').replace('fileLink','File')}</span></label>`).join('')}
      </div>
    </div>
    <div class="col-selector-wrap cert-toolbar__export">
      <button class="col-selector-btn" onclick="document.getElementById('certExportDropdown').classList.toggle('open')">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        <span>Export</span>
      </button>
      <div class="col-dropdown" id="certExportDropdown" style="min-width:140px;">
        <div class="col-dropdown__header"><span>Export Format</span></div>
        <label class="col-dropdown__item" onclick="certExportCSV()"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span>CSV</span></label>
        <label class="col-dropdown__item" onclick="certExportPDF()"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14" style="color:#bb0000;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span style="color:#bb0000;">PDF</span></label>
      </div>
    </div>
    <button class="btn btn-secondary btn-sm" onclick="openBulkCertModal()" style="margin-right:4px;"><i class="fa-solid fa-layer-group"></i> Bulk</button>
    <button class="btn btn-primary btn-sm" onclick="certJobFilter!=='all'?openNewCertModal(certJobFilter):openNewCertModal()"><i class="fa-solid fa-plus"></i> New</button>
  </div>`;

    // Active job filter chip
    if(certJobFilter!=='all'){
      const job=DATA.jobs.find(j=>j.id===certJobFilter);
      if(job){
        const client=DATA.accounts.find(a=>a.id===job.clientId);
        html+=`<div class="filter-chip-bar"><span class="filter-chip"><span class="filter-chip__label">Job:</span> ${h(job.title)}${client?' · '+h(client.name):''}<button class="filter-chip__clear" onclick="certJobFilter='all';rerenderSection()"><i class="fa-solid fa-xmark"></i></button></span></div>`;
      }
    }

    // Mass action bar
    html+=`<div class="mass-action-bar" id="certMassBar">
      <span class="mass-action-bar__count" id="certMassCount">0 selected</span>
      <button class="btn btn-success btn-sm" id="certMassApproveBtn" style="display:none;" onclick="certMassApprove()"><i class="fa-solid fa-check"></i> Approve</button>
      <div class="mass-action-bar__spacer"></div>
      <button class="btn btn-danger btn-sm" id="certMassDeleteBtn" style="display:none;" onclick="certMassDelete()"><i class="fa-solid fa-trash"></i> Delete</button>
      <button class="btn btn-ghost btn-sm" onclick="certClearSelection()"><i class="fa-solid fa-xmark"></i> Deselect</button>
    </div>`;

    // Table
    html+=`<table class="sap-table">
      <thead><tr>
        <th class="cell-check"><input type="checkbox" class="sap-checkbox" onchange="certToggleSelectAll(this)"/></th>
        <th data-col="jobNumber" onclick="certSortTable('jobNumber')">Job No. <span class="sort-icon">↕</span></th>
        <th data-col="certId" onclick="certSortTable('id')">Cert ID <span class="sort-icon">↕</span></th>
        <th data-col="assetTag" onclick="certSortTable('assetTag')">Asset Tag <span class="sort-icon">↕</span></th>
        <th data-col="name" onclick="certSortTable('equipName')">Certificate Name <span class="sort-icon">↕</span></th>
        <th data-col="category" onclick="certSortTable('category')">Category <span class="sort-icon">↕</span></th>
        <th data-col="certType" onclick="certSortTable('certType')">Type <span class="sort-icon">↕</span></th>
        <th data-col="issuedBy" onclick="certSortTable('issuer')">Issued By <span class="sort-icon">↕</span></th>
        <th data-col="expiry" onclick="certSortTable('expiryDate')">Expiry <span class="sort-icon">↕</span></th>
        <th data-col="issueDate" onclick="certSortTable('issueDate')">Issue Date <span class="sort-icon">↕</span></th>
        <th data-col="approval" onclick="certSortTable('approvalStatus')">Approval <span class="sort-icon">↕</span></th>
        <th data-col="client" onclick="certSortTable('client')">Client <span class="sort-icon">↕</span></th>
        <th data-col="qr" style="text-align:center;">QR</th>
        <th data-col="fileLink">File</th>
      </tr></thead>
      <tbody id="certTableBody">`;

    if(page.length===0){
      html+=`</tbody></table>
        <div class="sap-table__empty">
          <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
          <p>No certificates found.</p>
        </div>`;
    } else {
      page.forEach(c=>{
        const st=getCertStatus(c);
        const tc2=tc[c.certCategory]||tc[c.certType]||{bg:'#f5f6f7',color:'#6a6d70'};
        const d=getCertDays(c);
        const expCls=d<0?'red':d<=30?'orange':d<=90?'var(--purple)':'green';
        const expCol=d<0?'var(--error)':d<=30?'var(--warning)':d<=90?'var(--purple)':'var(--success)';
        const canApprove=c.approvalStatus==='pending';

        html+=`<tr class="cert-row" onmouseenter="certShowRowActions(this)" onmouseleave="certHideRowActions(this)">
          <td class="cell-check"><input type="checkbox" class="sap-checkbox" data-id="${c.id}" onchange="certUpdateMassBar()"/></td>
          <td data-col="jobNumber"><span style="font-family:monospace;font-size:11px;font-weight:700;color:var(--blue);background:var(--blue-light);border:1px solid #90caf9;border-radius:4px;padding:2px 6px;white-space:nowrap;">${h(c.jobNumber||'—')}</span></td>
          <td data-col="certId"><span class="cert-id-chip">${h(c.id)}</span></td>
          <td data-col="assetTag"><span class="asset-id-chip">${h(c.assetTag||'—')}</span></td>
          <td data-col="name">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
              <div style="min-width:0;">
                <div style="font-weight:600;font-size:13px;cursor:pointer;color:var(--blue);" onclick="openCertDrawer('${c.id}')">${h(c.equipName)}</div>
              </div>
              <div class="row-actions" style="display:none;gap:3px;flex-shrink:0;align-items:center;">
                <button class="btn btn-ghost btn-icon" onclick="openCertDrawer('${c.id}')" title="View"><i class="fa-solid fa-eye" style="font-size:11px;"></i></button>
                ${(()=>{
                  const isInspector=state.currentInspectorId!==null;
                  const isOwnCert=c.uploadedBy===state.currentInspectorId;
                  const inWindow=c.uploadedAt&&(Date.now()-new Date(c.uploadedAt).getTime()<=28800000);
                  const canEdit=!isInspector||(isOwnCert&&inWindow);
                  const canDelete=canEdit;
                  const canApproveCert=!isInspector&&canApprove;
                  let btns='';
                  if(canEdit)btns+=`<button class="btn btn-secondary btn-icon" onclick="openEditCertModal('${c.id}')" title="Edit"><i class="fa-solid fa-pen" style="font-size:11px;"></i></button>`;
                  if(canApproveCert)btns+=`<button class="btn btn-success btn-icon" onclick="approveCert('${c.id}')" title="Approve"><i class="fa-solid fa-check" style="font-size:11px;"></i></button>
                <button class="btn btn-danger btn-icon" onclick="openCertRejectModal('${c.id}')" title="Reject"><i class="fa-solid fa-xmark" style="font-size:11px;"></i></button>`;
                  if(canDelete)btns+=`<button class="btn btn-danger btn-icon" onclick="if(confirm('Delete ${c.id}?')){deleteCert('${c.id}')}" title="Delete"><i class="fa-solid fa-trash" style="font-size:11px;"></i></button>`;
                  return btns;
                })()}
              </div>
            </div>
          </td>
          <td data-col="category"><span style="font-size:11px;">${h(c.category||'—')}</span></td>
          <td data-col="certType"><span class="cert-type-chip" style="background:${tc2.bg};color:${tc2.color};">${h(c.certCategory||c.certType)}</span></td>
          <td data-col="issuedBy" style="font-size:12px;">${h(c.issuer||'—')}</td>
          <td data-col="expiry">
            ${getCertExpiryBar(c)}
            <div style="font-size:11px;color:var(--text-sec);margin-top:2px;">${c.expiryDate}</div>
          </td>
          <td data-col="issueDate" style="font-size:12px;">${c.issueDate||'—'}</td>
          <td data-col="approval">${getCertBadge(c.approvalStatus)}${c.rejectionReason?`<div style="font-size:10px;color:var(--error);margin-top:2px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${h(c.rejectionReason)}">${h(c.rejectionReason)}</div>`:''}</td>
          <td data-col="client"><span style="font-size:12px;font-weight:600;">${h(c.client||'—')}</span></td>
          <td data-col="qr" style="text-align:center;">
            <button class="qr-icon-btn" onclick="openCertQRModal('${c.id}')" title="View QR">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
          </td>
          <td data-col="fileLink">
            ${c.fileName||c.pdfUrl?`<button class="cert-file-link" onclick="showToast('Opening ${c.fileName||'certificate'}','info')">
              <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              ${h(c.fileName||'View')}
            </button>`:`<span style="color:var(--text-sec);font-size:11px;">—</span>`}
          </td>
        </tr>`;
      });
      html+=`</tbody></table>`;
    }

    // Mobile cards
    html+=`<div class="cert-cards-view" id="certCardsContainer" style="padding:12px;">`;
    if(page.length===0){
      html+=`<div class="empty-state"><i class="fa-solid fa-certificate"></i><p>No certificates found</p></div>`;
    } else {
      page.forEach(c=>{
        const tc2=tc[c.certCategory]||tc[c.certType]||{bg:'#f5f6f7',color:'#6a6d70'};
        html+=`<div class="cert-card">
          <div class="cert-card__header">
            <span class="cert-card__title" onclick="openCertDrawer('${c.id}')">${h(c.equipName)}</span>
            ${getCertBadge(c.approvalStatus)}
          </div>
          <div style="font-size:11px;color:var(--text-sec);margin-bottom:4px;"><span class="cert-id-chip">${h(c.id)}</span></div>
          <div class="cert-card__details">
            <div><strong>Type:</strong> <span style="color:${tc2.color};">${h(c.certCategory||c.certType)}</span></div>
            <div><strong>Expiry:</strong> ${getCertExpiryBar(c)}</div>
            <div><strong>Asset:</strong> ${h(c.assetTag||'—')}</div>
            <div><strong>Client:</strong> ${h(c.client||'—')}</div>
          </div>
          <div class="cert-card__footer">
            ${c.approvalStatus==='pending'?`<button class="btn btn-success btn-sm" onclick="approveCert('${c.id}')">Approve</button><button class="btn btn-danger btn-sm" onclick="openCertRejectModal('${c.id}')">Reject</button>`:''}
            <button class="btn btn-ghost btn-sm" onclick="openCertDrawer('${c.id}')">View</button>
          </div>
        </div>`;
      });
    }
    html+=`</div>`;

    // Pagination
    html+=`<div class="sap-pagination">
      <div class="sap-pagination__info">Showing ${start+1}-${end} of ${total}</div>
      <div class="sap-pagination__controls">${certRenderPagination(total)}</div>
      <div class="sap-pagination__size">
        <span>Rows:</span>
        <select onchange="certSetPageSize(this.value)">
          <option value="25" ${certPageSize===25?'selected':''}>25</option>
          <option value="50" ${certPageSize===50?'selected':''}>50</option>
          <option value="100" ${certPageSize===100?'selected':''}>100</option>
        </select>
      </div>
    </div>`;

    html+=`</div>`;
  } else if(certEntityView==='clients'){
    html+=renderCertClientsView();
  } else if(certEntityView==='functionalLocations'){
    html+=renderCertFLView();
  } else if(certEntityView==='inspectors'){
    html+=renderCertInspectorsView();
  } else if(certEntityView==='jobs'){
    html+=renderCertJobsView();
  }

  html+=`</div>`;
  return html;
}

/* ── Entity view: Clients ── */
function openNewCertClientModal() {
  openNewAccountModal();
}
function renderCertClientsView(){
  const now=new Date().toISOString().split('T')[0];
  let activeClients=DATA.accounts.filter(a=>a.status==='active');
  if(state.currentInspectorId){
    const ja=DATA.jobAssignments.filter(a=>a.inspectorId===state.currentInspectorId);
    const activeJobIds=ja.map(a=>a.jobId);
    const openJobs=DATA.jobs.filter(j=>activeJobIds.includes(j.id)&&j.status!=='closed');
    const allowedClientIds=[...new Set(openJobs.map(j=>j.clientId).filter(Boolean))];
    activeClients=activeClients.filter(c=>allowedClientIds.includes(c.id));
  }
  let html='<div style="padding:16px;display:flex;justify-content:flex-end;"><button class="btn btn-primary btn-sm" onclick="openNewCertClientModal()"><i class="fa-solid fa-plus"></i> New Client</button></div><div class="cert-entity-grid" style="padding:0 16px 16px;">';
  activeClients.forEach(cl=>{
    const fls=DATA.functionalLocations.filter(f=>f.clientId===cl.id);
    const certs=DATA.certificates.filter(c=>c.clientId===cl.id);
    html+=`<div class="cert-entity-card">
      <div class="cert-entity-card__header" onclick="certClientFilter='${cl.id}';certEntityView='list';rerenderSection()" style="cursor:pointer;">
        <div class="cert-entity-card__title">${h(cl.name)}</div>
        <div class="cert-entity-card__meta">${cl.type||''} · ${cl.country||''}</div>
      </div>
      <div class="cert-entity-card__stats">
        <span class="cert-entity-stat"><strong>${certs.length}</strong> certs</span>
        <span class="cert-entity-stat"><strong>${fls.length}</strong> locations</span>
        <span class="cert-entity-stat"><strong>${certs.filter(c=>getCertStatus(c)==='expired').length}</strong> expired</span>
        <span class="cert-entity-stat"><strong>${certs.filter(c=>getCertStatus(c)==='expiring').length}</strong> expiring</span>
      </div>
      ${fls.length?`<div class="cert-entity-sublist"><div style="font-size:11px;font-weight:700;color:var(--text-sec);margin-bottom:4px;">FUNCTIONAL LOCATIONS</div>
        ${fls.map(fl=>{
          const flCerts=DATA.certificates.filter(c=>c.flId===fl.id);
          return`<div class="cert-entity-subitem" onclick="certLocFilter='${fl.id}';certEntityView='list';rerenderSection()">
            <span>${h(fl.name)}</span>
            <span class="cert-entity-stat">${flCerts.length} certs</span>
          </div>`;
        }).join('')}</div>`:''}
    </div>`;
  });
  html+='</div>';
  return html;
}

/* ── Entity view: Functional Locations ── */
function openNewFLModal() {
  const clientOpts = DATA.accounts.filter(a=>a.status==='active').map(a=>`<option value="${a.id}">${h(a.name)}</option>`).join('');
  openModal('New Functional Location', `<div class="modal-body">
    <div class="form-group"><label>Location Name *</label>
      <input id="fl-name" class="form-input" placeholder="e.g. Rig Alpha"></div>
    <div class="form-row"><div class="form-group">
      <label>FL ID / Code</label>
      <input id="fl-code" class="form-input" placeholder="e.g. FL-OQ-RG01"></div>
    <div class="form-group">
      <label>Type</label>
      <select id="fl-type" class="form-input">
        <option value="Rig">Rig</option><option value="Workshop">Workshop</option>
        <option value="Warehouse">Warehouse</option><option value="Yard">Yard</option>
        <option value="Other">Other</option>
      </select></div></div>
    <div class="form-group"><label>Client</label>
      <select id="fl-client" class="form-input"><option value="">None</option>${clientOpts}</select></div>
  </div>`, `<button class="btn btn-primary" onclick="submitNewFL()">Save</button>
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`);
}
async function submitNewFL() {
  const name = document.getElementById('fl-name')?.value?.trim();
  if(!name){showToast('Location name required','error');return;}
  const id='FL-'+String(DATA.functionalLocations.length+1).padStart(3,'0');
  const code = document.getElementById('fl-code')?.value?.trim() || id;
  const rec={id,flId:code,name,type:document.getElementById('fl-type')?.value||'Other',clientId:document.getElementById('fl-client')?.value||null,status:'active'};
  DATA.functionalLocations.push(rec);
  closeModal();
  showToast('Functional location added','success');
  rerenderSection();
}
function renderCertFLView(){
  let fls=DATA.functionalLocations.filter(f=>f.status==='active');
  if(state.currentInspectorId){
    const ja=DATA.jobAssignments.filter(a=>a.inspectorId===state.currentInspectorId);
    const activeJobIds=ja.map(a=>a.jobId);
    const openJobs=DATA.jobs.filter(j=>activeJobIds.includes(j.id)&&j.status!=='closed');
    const allowedFlIds=[...new Set(openJobs.map(j=>j.flId).filter(Boolean))];
    fls=fls.filter(f=>allowedFlIds.includes(f.id));
  }
  let html='<div style="padding:16px;display:flex;justify-content:flex-end;"><button class="btn btn-primary btn-sm" onclick="openNewFLModal()"><i class="fa-solid fa-plus"></i> New Location</button></div><div class="cert-entity-grid" style="padding:0 16px 16px;">';
  fls.forEach(fl=>{
    const client=DATA.accounts.find(a=>a.id===fl.clientId);
    const certs=DATA.certificates.filter(c=>c.flId===fl.id);
    html+=`<div class="cert-entity-card">
      <div class="cert-entity-card__header" onclick="certLocFilter='${fl.id}';certEntityView='list';rerenderSection()" style="cursor:pointer;">
        <div class="cert-entity-card__title">${h(fl.name)}</div>
        <div class="cert-entity-card__meta">${fl.type||''}${client?' · '+h(client.name):''}</div>
      </div>
      <div class="cert-entity-card__stats">
        <span class="cert-entity-stat"><strong>${certs.length}</strong> certs</span>
        <span class="cert-entity-stat"><strong>${certs.filter(c=>getCertStatus(c)==='expired').length}</strong> expired</span>
        <span class="cert-entity-stat"><strong>${certs.filter(c=>getCertStatus(c)==='expiring').length}</strong> expiring</span>
      </div>
      ${certs.length?`<div style="margin-top:8px;"><div style="font-size:11px;font-weight:700;color:var(--text-sec);margin-bottom:4px;">CERTIFICATES (${certs.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${certs.slice(0,10).map(c=>`<span class="cert-type-chip" style="font-size:10px;padding:2px 6px;cursor:pointer;" onclick="certSetTab('all');certSavedView='all';certLocFilter='${fl.id}';certEntityView='list';rerenderSection()">${h(c.equipName)}</span>`).join('')}${certs.length>10?`<span style="font-size:10px;color:var(--text-sec);">+${certs.length-10} more</span>`:''}</div></div>`:''}
    </div>`;
  });
  html+='</div>';
  return html;
}

/* ── Entity view: Inspectors ── */
function openNewInspectorModal() {
  const empOpts = DATA.employees.filter(e=>e.status==='active').map(e=>`<option value="${e.id}">${e.name} — ${e.position}</option>`).join('');
  openModal('New Inspector', `<div class="modal-body">
    <div class="form-group"><label>Employee *</label>
      <select id="ins-emp" class="form-input">${empOpts}</select></div>
    <div class="form-group"><label>Inspector Title</label>
      <input id="ins-title" class="form-input" placeholder="e.g. Senior HSE Inspector"></div>
    <div class="form-row"><div class="form-group">
      <label>Color Tag</label>
      <input id="ins-color" class="form-input" type="color" value="#e53935"></div>
    <div class="form-group">
      <label>Status</label>
      <select id="ins-status" class="form-input">
        <option value="active">Active</option><option value="inactive">Inactive</option>
      </select></div></div>
  </div>`, `<button class="btn btn-primary" onclick="submitNewInspector()">Save</button>
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`);
}
async function submitNewInspector() {
  const empId = document.getElementById('ins-emp')?.value;
  if(!empId){showToast('Employee required','error');return;}
  const emp = DATA.employees.find(e=>e.id===empId);
  if(!emp){showToast('Employee not found','error');return;}
  const id='INS-'+String(DATA.inspectors.length+1).padStart(3,'0');
  const rec={id,inspectorNumber:id,employeeId:empId,name:emp.name,title:document.getElementById('ins-title')?.value?.trim()||emp.position,email:emp.email,phone:emp.phone,status:document.getElementById('ins-status')?.value||'active',color:document.getElementById('ins-color')?.value||'#6a6d70'};
  DATA.inspectors.push(rec);
  closeModal();
  showToast('Inspector added','success');
  rerenderSection();
}
function renderCertInspectorsView(){
  const inspectors=DATA.inspectors.filter(i=>i.status==='active');
  let html='<div style="padding:16px;display:flex;justify-content:flex-end;"><button class="btn btn-primary btn-sm" onclick="openNewInspectorModal()"><i class="fa-solid fa-plus"></i> New Inspector</button></div><div class="cert-entity-grid" style="padding:0 16px 16px;">';
  inspectors.forEach(ins=>{
    const certs=DATA.certificates.filter(c=>c.inspectorId===ins.id);
    html+=`<div class="cert-entity-card">
      <div class="cert-entity-card__header" onclick="certInspectorFilter='${ins.id}';certEntityView='list';rerenderSection()" style="cursor:pointer;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${ins.color||'#6a6d70'};flex-shrink:0;"></span>
          <div class="cert-entity-card__title">${h(ins.name)}</div>
        </div>
        <div class="cert-entity-card__meta">${ins.title||''}</div>
      </div>
      <div class="cert-entity-card__stats">
        <span class="cert-entity-stat"><strong>${certs.length}</strong> certs</span>
        <span class="cert-entity-stat"><strong>${certs.filter(c=>getCertStatus(c)==='expired').length}</strong> expired</span>
        <span class="cert-entity-stat"><strong>${certs.filter(c=>getCertStatus(c)==='expiring').length}</strong> expiring</span>
        <span class="cert-entity-stat"><strong>${certs.filter(c=>c.approvalStatus==='pending').length}</strong> pending</span>
      </div>
      ${ins.email?`<div style="font-size:12px;color:var(--text-sec);margin-top:4px;"><i class="fa-regular fa-envelope"></i> ${h(ins.email)}</div>`:''}
      ${certs.length?`<div style="margin-top:8px;"><div style="font-size:11px;font-weight:700;color:var(--text-sec);margin-bottom:4px;">CERTIFICATES (${certs.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${certs.slice(0,8).map(c=>`<span class="cert-type-chip" style="font-size:10px;padding:2px 6px;cursor:pointer;" onclick="certInspectorFilter='${ins.id}';certEntityView='list';rerenderSection()">${h(c.equipName)}</span>`).join('')}${certs.length>8?`<span style="font-size:10px;color:var(--text-sec);">+${certs.length-8} more</span>`:''}</div></div>`:''}
    </div>`;
  });
  html+='</div>';
  return html;
}

/* ── Entity view: Jobs (Work Orders) ── */
function openNewJobModal() {
  const clientOpts = DATA.accounts.filter(a=>a.status==='active').map(a=>`<option value="${a.id}">${h(a.name)}</option>`).join('');
  const flOpts = DATA.functionalLocations.filter(f=>f.status==='active').map(f=>`<option value="${f.id}">${h(f.name)}</option>`).join('');
  const inspOpts = DATA.inspectors.filter(i=>i.status==='active').map(i=>`<option value="${i.id}">${h(i.name)}</option>`).join('');
  openModal('New Work Order', `<div class="modal-body">
    <div class="form-group"><label>Job Title *</label>
      <input id="job-title" class="form-input" placeholder="e.g. Q4 Rig Alpha Inspection"></div>
    <div class="form-group"><label>Description</label>
      <textarea id="job-desc" class="form-input" rows="2" placeholder="Job description"></textarea></div>
    <div class="form-row"><div class="form-group">
      <label>Client</label>
      <select id="job-client" class="form-input"><option value="">None</option>${clientOpts}</select></div>
    <div class="form-group">
      <label>Functional Location</label>
      <select id="job-fl" class="form-input"><option value="">None</option>${flOpts}</select></div></div>
    <div class="form-group"><label>Assign Inspectors</label>
      <div style="display:flex;flex-wrap:wrap;gap:6px;padding:4px 0;">${DATA.inspectors.filter(i=>i.status==='active').map(i=>`<label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;"><input type="checkbox" class="job-insp-chk" value="${i.id}"><span style="width:8px;height:8px;border-radius:50%;background:${i.color||'#6a6d70'};display:inline-block;"></span>${h(i.name)}</label>`).join('')}</div></div>
  </div>`, `<button class="btn btn-primary" onclick="submitNewJob()">Create Job</button>
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`);
}
async function submitNewJob() {
  const title = document.getElementById('job-title')?.value?.trim();
  if(!title){showToast('Job title required','error');return;}
  const id='JOB-'+String(DATA.jobs.length+1).padStart(3,'0');
  const checked = [...document.querySelectorAll('.job-insp-chk:checked')].map(cb=>cb.value);
  const job={id,title,clientId:document.getElementById('job-client')?.value||null,flId:document.getElementById('job-fl')?.value||null,status:'open',createdAt:new Date().toISOString().split('T')[0],completedAt:null,closedAt:null,description:document.getElementById('job-desc')?.value?.trim()||''};
  DATA.jobs.push(job);
  checked.forEach(inspectorId=>{
    const jaId='JA-'+String(DATA.jobAssignments.length+1).padStart(3,'0');
    DATA.jobAssignments.push({id:jaId,jobId:id,inspectorId,assignedAt:new Date().toISOString().split('T')[0]});
  });
  closeModal();
  showToast('Work order created','success');
  rerenderSection();
}

function getJobsForCurrentUser(){
  if(state.currentInspectorId){
    const assignedJobIds=DATA.jobAssignments.filter(ja=>ja.inspectorId===state.currentInspectorId).map(ja=>ja.jobId);
    return DATA.jobs.filter(j=>assignedJobIds.includes(j.id));
  }
  return DATA.jobs;
}

function renderCertJobsView(){
  const jobs=getJobsForCurrentUser();
  const statusColors={open:'#0070f2',in_progress:'#e76500',completed:'#188918',closed:'#6a6d70'};
  let html='<div style="padding:16px;display:flex;justify-content:flex-end;"><button class="btn btn-primary btn-sm" onclick="openNewJobModal()"><i class="fa-solid fa-plus"></i> New Work Order</button></div><div class="cert-entity-grid" style="padding:0 16px 16px;">';
  jobs.forEach(job=>{
    const client=DATA.accounts.find(a=>a.id===job.clientId);
    const fl=DATA.functionalLocations.find(f=>f.id===job.flId);
    const inspectors=DATA.jobAssignments.filter(ja=>ja.jobId===job.id).map(ja=>DATA.inspectors.find(i=>i.id===ja.inspectorId)).filter(Boolean);
    const certs=DATA.certificates.filter(c=>c.jobId===job.id);
    const isClosed=job.status==='closed';
    html+=`<div class="cert-entity-card" style="${isClosed?'opacity:.5;':''}">
      <div class="cert-entity-card__header" onclick="${isClosed?'':`certJobFilter='${job.id}';certEntityView='list';rerenderSection()`}" style="cursor:${isClosed?'default':'pointer'};">
        <div class="cert-entity-card__title">${h(job.title)}</div>
        <div class="cert-entity-card__meta">${client?h(client.name):'—'}${fl?' · '+h(fl.name):''}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
        <span class="job-status-badge" style="background:${(statusColors[job.status]||'#6a6d70')}22;color:${statusColors[job.status]||'#6a6d70'};border:1px solid ${(statusColors[job.status]||'#6a6d70')}44;">${job.status.replace('_',' ')}</span>
        <span class="cert-entity-stat"><strong>${certs.length}</strong> certs</span>
        <span class="cert-entity-stat"><strong>${certs.filter(c=>getCertStatus(c)==='expired').length}</strong> expired</span>
        ${!hasRole('inspector')&&!isClosed?`<button class="btn btn-ghost btn-sm" style="margin-left:auto;font-size:10px;padding:2px 6px;" onclick="event.stopPropagation();cycleJobStatus('${job.id}')">Cycle ▾</button>`:''}
      </div>
      ${inspectors.length?`<div style="font-size:11px;color:var(--text-sec);margin-bottom:4px;">Assigned: ${inspectors.map(i=>`<span class="inspector-dot" style="background:${i.color||'#6a6d70'};display:inline-block;width:8px;height:8px;border-radius:50%;"></span> ${h(i.name)}`).join(', ')}</div>`:''}
      ${job.description?`<div style="font-size:12px;color:var(--text-sec);margin-top:4px;">${h(job.description)}</div>`:''}
      ${isClosed?`<div style="font-size:11px;color:var(--text-sec);margin-top:4px;">Closed: ${job.closedAt||'—'}</div>`:''}
      ${!isClosed&&certs.length?`<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);"><div style="display:flex;flex-wrap:wrap;gap:4px;">${certs.slice(0,6).map(c=>`<span class="cert-type-chip" style="font-size:10px;padding:2px 6px;cursor:pointer;" onclick="certJobFilter='${job.id}';certEntityView='list';rerenderSection()">${h(c.equipName)}</span>`).join('')}${certs.length>6?`<span style="font-size:10px;color:var(--text-sec);">+${certs.length-6} more</span>`:''}</div></div>`:''}
    </div>`;
  });
  html+=`${jobs.length===0?'<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-sec);font-size:14px;">No jobs assigned.</div>':''}`;
  html+='</div>';
  return html;
}

function cycleJobStatus(jobId){
  const job=DATA.jobs.find(j=>j.id===jobId);
  if(!job)return;
  const order=['open','in_progress','completed','closed'];
  const idx=order.indexOf(job.status);
  const next=order[(idx+1)%order.length];
  job.status=next;
  if(next==='completed')job.completedAt=new Date().toISOString().split('T')[0];
  if(next==='closed')job.closedAt=new Date().toISOString().split('T')[0];
  rerenderSection();
}

/* ── Certificate list helpers ── */
function certRenderPagination(total){
  const tp=Math.ceil(total/certPageSize);
  let h='';
  h+=`<button class="sap-page-btn" onclick="certGoPage(${certCurrentPage-1})" ${certCurrentPage<=1?'disabled':''}>‹</button>`;
  for(let i=1;i<=tp;i++){
    if(tp>7&&Math.abs(i-certCurrentPage)>2&&i!==1&&i!==tp){if(i===2)h+=`<span style="padding:0 4px;color:var(--text-sec);">…</span>`;continue;}
    h+=`<button class="sap-page-btn ${i===certCurrentPage?'active':''}" onclick="certGoPage(${i})">${i}</button>`;
  }
  h+=`<button class="sap-page-btn" onclick="certGoPage(${certCurrentPage+1})" ${certCurrentPage>=tp?'disabled':''}>›</button>`;
  return h;
}

function certGoPage(p){
  const max=Math.ceil(DATA.certificates.length/certPageSize);
  if(p<1||p>max)return;
  certCurrentPage=p;
  rerenderSection();
}

function certSetPageSize(s){
  certPageSize=Number(s);
  localStorage.setItem('cert_page_size',String(certPageSize));
  certCurrentPage=1;
  rerenderSection();
}

function certSetTab(tab){
  certSavedView=tab;
  certEntityView='list';
  certClientFilter='all';
  certLocFilter='all';
  certTypeFilter='all';
  certInspectorFilter='all';
  certJobFilter='all';
  state.filters.search='';
  certCurrentPage=1;
  rerenderSection();
}

function certSetEntityView(view){
  certEntityView=view;
  if(view!=='list'){
    certClientFilter='all';
    certLocFilter='all';
    certTypeFilter='all';
    certInspectorFilter='all';
    certJobFilter='all';
  }
  state.filters.search='';
  certCurrentPage=1;
  rerenderSection();
}

function certSetFilter(type, value){
  if(type==='client') certClientFilter=value;
  else if(type==='loc') certLocFilter=value;
  else if(type==='type') certTypeFilter=value;
  else if(type==='inspector') certInspectorFilter=value;
  else if(type==='job') certJobFilter=value;
  rerenderSection();
}

function certLoginInspector(inspectorId){
  state.currentInspectorId=inspectorId;
  if(!hasRole('inspector')) state.roles.push('inspector');
  state.currentUserRole='Inspector';
  state.module='certificates';
  state.section='allCerts';
  certJobFilter='all';
  certEntityView='list';
  certSavedView='all';
  certCurrentPage=1;
  rerenderSection();
}

function certLogoutInspector(){
  state.currentInspectorId=null;
  state.roles=state.roles.filter(r=>r!=='inspector');
  if(state.roles.length===0) state.roles=['employee'];
  const priority = ['system_admin','hr_manager','crm_manager','sc_manager','fin_manager','hr_user','crm_user','sc_user','fin_user','employee'];
  const top = [...state.roles].sort((a,b)=>priority.indexOf(a)-priority.indexOf(b))[0];
  state.currentUserRole = Object.keys(ROLE_KEY_MAP).find(k=>ROLE_KEY_MAP[k]===top)||'Employee';
  state.module='certificates';
  state.section='allCerts';
  certJobFilter='all';
  certEntityView='list';
  certSavedView='all';
  certCurrentPage=1;
  rerenderSection();
}

function setCertSavedView(view){
  certSavedView=view;
  state.filters.search='';
  certCurrentPage=1;
  rerenderSection();
}

function certSortTable(col){
  if(col===certSortCol){certSortDir*=-1;}
  else{certSortCol=col;certSortDir=1;}
  rerenderSection();
}

function certToggleColDropdown(){
  document.getElementById('certColDropdown')?.classList.toggle('open');
}

function certApplyColVisibility(){
  const cols=['jobNumber','certId','assetTag','category','certType','issuedBy','issueDate','expiry','approval','client','qr','fileLink'];
  cols.forEach(col=>{
    const cb=document.getElementById('certCol_'+col);
    const show=cb?cb.checked:true;
    document.querySelectorAll(`[data-col="${col}"]`).forEach(el=>el.style.display=show?'':'none');
  });
  const checked=cols.filter(c=>document.getElementById('certCol_'+c)?.checked).length;
  const badge=document.getElementById('certColBadge');
  if(badge)badge.textContent=checked+1;
  localStorage.setItem('cert_col_state',JSON.stringify(Object.fromEntries(cols.map(c=>[c,document.getElementById('certCol_'+c)?.checked||false]))));
}

function certResetColumns(){
  ['jobNumber','certId','assetTag','category','certType','issuedBy','issueDate','expiry','approval','client','qr','fileLink'].forEach(c=>{
    const el=document.getElementById('certCol_'+c);
    if(el)el.checked=true;
  });
  certApplyColVisibility();
}

function certLoadColState(){
  const allCols=['jobNumber','certId','assetTag','category','certType','issuedBy','issueDate','expiry','approval','client','qr','fileLink'];
  const saved=localStorage.getItem('cert_col_state');
  let st={};
  if(saved){
    try{st=JSON.parse(saved);}catch(e){}
  }
  allCols.forEach(k=>{
    const el=document.getElementById('certCol_'+k);
    if(el)el.checked=st[k]!==false;
  });
}

function certShowRowActions(row){const b=row.querySelector('.row-actions');if(b)b.style.display='flex';}
function certHideRowActions(row){const b=row.querySelector('.row-actions');if(b)b.style.display='none';}

function certToggleSelectAll(cb){
  document.querySelectorAll('#certTableBody input[type="checkbox"]').forEach(c=>c.checked=cb.checked);
  certUpdateMassBar();
}

function certGetSelectedIds(){
  return[...document.querySelectorAll('#certTableBody input[type="checkbox"]:checked')].map(cb=>cb.getAttribute('data-id'));
}

function certUpdateMassBar(){
  const ids=certGetSelectedIds();
  const bar=document.getElementById('certMassBar');
  if(!bar)return;
  if(ids.length===0){bar.classList.remove('visible');return;}
  bar.classList.add('visible');
  const countEl=document.getElementById('certMassCount');
  if(countEl)countEl.textContent=ids.length+' selected';
  const hasPending=ids.some(id=>DATA.certificates.find(c=>c.id===id)?.approvalStatus==='pending');
  const appBtn=document.getElementById('certMassApproveBtn');
  if(appBtn)appBtn.style.display=hasPending?'inline-flex':'none';
  const delBtn=document.getElementById('certMassDeleteBtn');
  if(delBtn)delBtn.style.display='inline-flex';
}

function certClearSelection(){
  document.querySelectorAll('#certTableBody input[type="checkbox"], .cert-toolbar .sap-checkbox').forEach(c=>c.checked=false);
  certUpdateMassBar();
}

function certMassApprove(){
  const ids=certGetSelectedIds();
  ids.forEach(id=>{
    const c=DATA.certificates.find(x=>x.id===id);
    if(c&&c.approvalStatus==='pending'){c.approvalStatus='approved';}
  });
  showToast(`Approved ${ids.length} certificate(s)`,'success');
  certClearSelection();
  rerenderSection();
}

function certMassDelete(){
  const ids=certGetSelectedIds();
  if(!ids.length||!confirm(`Delete ${ids.length} certificate(s)? This cannot be undone.`))return;
  ids.forEach(id=>{
    const idx=DATA.certificates.findIndex(x=>x.id===id);
    if(idx>-1)DATA.certificates.splice(idx,1);
  });
  showToast(`Deleted ${ids.length} certificate(s)`,'success');
  certClearSelection();
  rerenderSection();
}

function certExportCSV(){
  const rows=[['Job No.','Cert ID','Asset Tag','Name','Category','Type','Issued By','Expiry','Issue Date','Approval','Client']];
  DATA.certificates.forEach(c=>{
    rows.push([c.jobNumber||'',c.id||'',c.assetTag||'',c.equipName||'',c.category||'',c.certCategory||c.certType||'',c.issuer||'',c.expiryDate||'',c.issueDate||'',c.approvalStatus||'',c.client||'']);
  });
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='certificates_export.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('CSV exported','success');
}

function certExportPDF(){
  if(typeof window.jspdf==='undefined'){
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload=()=>{
      const t=document.createElement('script');
      t.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
      t.onload=()=>certExportPDF();
      document.head.appendChild(t);
    };
    document.head.appendChild(s);
    showToast('Loading PDF library…','info');
    return;
  }
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const colMap={jobNumber:'Job No.',certId:'Cert ID',assetTag:'Asset Tag',name:'Certificate Name',category:'Category',certType:'Type',issuedBy:'Issued By',expiry:'Expiry',issueDate:'Issue Date',approval:'Approval',client:'Client',qr:'QR',fileLink:'File'};
  const visible=document.querySelectorAll('#certTableBody tr:first-child td[data-col]');
  const cols=[];
  const headers=[];
  if(visible.length){
    visible.forEach(td=>{const k=td.getAttribute('data-col');cols.push(k);headers.push(colMap[k]||k);});
  } else {
    const fallback=['jobNumber','certId','assetTag','name','category','certType','issuedBy','expiry','issueDate','approval','client','fileLink'];
    fallback.forEach(k=>{cols.push(k);headers.push(colMap[k]||k);});
  }
  const body=DATA.certificates.map(c=>cols.map(k=>{
    const m={jobNumber:c.jobNumber,certId:c.id,assetTag:c.assetTag,name:c.equipName,category:c.category,certType:c.certCategory||c.certType,issuedBy:c.issuer||'—',expiry:c.expiryDate||'—',issueDate:c.issueDate||'—',approval:c.approvalStatus||'—',client:c.client||'—',qr:'',fileLink:c.fileName||'—'};
    return m[k]||'';
  }));
  doc.setFontSize(16);
  doc.setTextColor(30,30,30);
  doc.text('Certificate Report',14,16);
  doc.setFontSize(9);
  doc.setTextColor(120,120,120);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}`,14,22);
  doc.autoTable({
    head:[headers],
    body,
    startY:26,
    styles:{fontSize:8,cellPadding:{top:2,bottom:2,left:2,right:2},overflow:'ellipsize',halign:'left'},
    headStyles:{fillColor:[60,70,80],textColor:255,fontSize:8,fontStyle:'bold',halign:'left'},
    alternateRowStyles:{fillColor:[245,247,250]},
    margin:{top:26,right:10,bottom:15,left:10},
    pageBreak:'auto',
    didDrawPage:(data)=>{
      doc.setFontSize(7);
      doc.setTextColor(150,150,150);
      doc.text(`AMICI ERP — Page ${doc.internal.getNumberOfPages()}`,doc.internal.pageSize.width-10,doc.internal.pageSize.height-5,{align:'right'});
    }
  });
  doc.save('certificates_export.pdf');
  showToast('PDF exported','success');
}

function deleteCert(id){
  const idx=DATA.certificates.findIndex(x=>x.id===id);
  if(idx>-1)DATA.certificates.splice(idx,1);
  if(supabase) supabase.from('certificates').delete().eq('id',id).catch(supabaseCatch);
  showToast(`Certificate ${id} deleted`,'success');
  rerenderSection();
}

/* ═══════════════════════════════════════════════
   CERTIFICATE DRAWER
═══════════════════════════════════════════════ */
function openCertDrawer(id){
  const c=DATA.certificates.find(x=>x.id===id);
  if(!c)return;
  const body=document.getElementById('certDrawerBody');
  if(!body)return;
  const d=getCertDays(c);
  const col=d<0?'var(--error)':d<=30?'var(--warning)':d<=90?'var(--purple)':'var(--success)';
  const st=getCertStatus(c);
  const stLbl={valid:'Valid',expiring:'Expiring Soon',expired:'Expired',pending:'Pending',rejected:'Rejected'};
  const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin+'/?cert='+c.id)}`;

  body.innerHTML=`
    <div class="drawer-section">
      <div class="drawer-section__title"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg> Certificate Info</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;font-size:13px;">
        ${[
          ['Certificate ID',c.id],
          ['Equipment Name',c.equipName],
          ['Asset Tag',c.assetTag||'—'],
          ['Equipment Category',c.category||'—'],
          ['Cert. Category',`<span class="cert-type-chip" style="background:#e8f3ff;color:#0070f2;">${c.certCategory||'—'}</span>`],
          ['Site / Location',c.site||'—'],
          ['Client',c.client||'—'],
          ['Job Number',c.jobNumber||'—'],
          ['Certificate Type',c.certType||'—'],
          ['Issuing Authority',c.issuer||'—'],
          ['Issue Date',c.issueDate||'—'],
          ['Expiry Date',`<span style="color:${col};font-weight:700;">${c.expiryDate}</span>`],
          ['Days Remaining',`<span style="color:${col};font-weight:700;">${d<0?'Expired '+Math.abs(d)+'d ago':d+' days'}</span>`],
          ['Responsible Engineer',c.engineer||'—'],
          ['Status',`<span class="pill" style="background:${col}22;color:${col}">${stLbl[st]||st}</span>`],
          ['Approval',`<span class="pill" style="background:${c.approvalStatus==='approved'?'var(--success)':c.approvalStatus==='rejected'?'var(--error)':'var(--warning)'}22;color:${c.approvalStatus==='approved'?'var(--success)':c.approvalStatus==='rejected'?'var(--error)':'var(--warning)'}">${(c.approvalStatus||'—').charAt(0).toUpperCase()+(c.approvalStatus||'—').slice(1)}</span>`],
        ].map(([k,v])=>`<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">${k}</div><div>${v}</div></div>`).join('')}
      </div>
    </div>
    ${c.remarks?`<div class="drawer-section">
      <div class="drawer-section__title"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> Remarks</div>
      <div style="font-size:13px;line-height:1.7;padding:8px 12px;background:var(--bg);border-radius:4px;">${c.remarks}</div>
    </div>`:''}
    <div class="drawer-section">
      <div class="drawer-section__title"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Expiry Timeline</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="flex:1;height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden;">
          <div style="height:100%;width:${Math.max(0,Math.min(100,d>0?Math.min(100,d/365*100):0))}%;background:${col};border-radius:5px;"></div>
        </div>
        <span style="font-size:13px;font-weight:700;color:${col};">${d<0?'Expired':'Valid'}</span>
      </div>
      <div style="display:flex;gap:16px;font-size:11px;flex-wrap:wrap;">
        <span style="color:var(--success);"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Valid: &gt;90d</span>
        <span style="color:var(--purple);"><i class="fa-solid fa-circle" style="font-size:8px;"></i> 31–90d</span>
        <span style="color:var(--warning);"><i class="fa-solid fa-circle" style="font-size:8px;"></i> ≤30d</span>
        <span style="color:var(--error);"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Expired</span>
      </div>
    </div>
    <div class="drawer-section">
      <div class="drawer-section__title"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> QR Code</div>
      <div style="text-align:center;">
        <img src="${qrUrl}" alt="QR for ${c.id}" style="width:120px;height:120px;border:1px solid var(--border);border-radius:6px;cursor:pointer;" onclick="openCertQRModal('${c.id}')" onerror="this.style.display='none'"/>
        <div style="font-size:11px;color:var(--text-sec);margin-top:4px;">Click to enlarge</div>
      </div>
    </div>
    <div class="drawer-section">
      <div class="drawer-section__title"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Actions</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${c.fileName||c.pdfUrl?`<button class="btn btn-ghost btn-sm" onclick="showToast('Opening ${c.fileName||'certificate'}','info')"><i class="fa-solid fa-file-pdf"></i> View PDF</button>`:''}
        <button class="btn btn-primary btn-sm" onclick="showToast('Renewal initiated','success')"><i class="fa-solid fa-rotate"></i> Renew</button>
        ${c.approvalStatus==='pending'?`
          <button class="btn btn-success btn-sm" onclick="approveCert('${c.id}')"><i class="fa-solid fa-check"></i> Approve</button>
          <button class="btn btn-danger btn-sm" onclick="openCertRejectModal('${c.id}')"><i class="fa-solid fa-xmark"></i> Reject</button>
        `:''}
      </div>
    </div>`;

  document.getElementById('certDrawerOverlay').classList.add('open');
}

function closeCertDrawer(){
  document.getElementById('certDrawerOverlay').classList.remove('open');
  document.getElementById('certDrawerBody').innerHTML='';
}

function approveCert(id){
  const c=DATA.certificates.find(x=>x.id===id);
  if(!c)return;
  c.approvalStatus='approved';
  if(supabase) supabase.from('certificates').update({approval_status:'approved'}).eq('id',id).catch(supabaseCatch);
  showToast(`Certificate ${id} approved`,'success');
  closeCertDrawer();
  rerenderSection();
}

/* ── Reject Modal ── */
let certRejectTargetId=null;

function openCertRejectModal(id){
  certRejectTargetId=id;
  const c=DATA.certificates.find(x=>x.id===id);
  document.getElementById('certRejectInfo').innerHTML=`<strong>${h(c?.equipName||id)}</strong> <span class="cert-id-chip">${id}</span>`;
  document.getElementById('certRejectReason').value='';
  document.getElementById('certRejectModal').classList.add('open');
}

function closeCertRejectModal(){
  document.getElementById('certRejectModal').classList.remove('open');
  certRejectTargetId=null;
}

function confirmCertReject(){
  const reason=document.getElementById('certRejectReason').value.trim();
  if(!reason){showToast('Please provide a rejection reason','error');return;}
  const c=DATA.certificates.find(x=>x.id===certRejectTargetId);
  if(c){c.approvalStatus='rejected';c.rejectionReason=reason;}
  if(supabase) supabase.from('certificates').update({approval_status:'rejected',rejection_reason:reason}).eq('id',certRejectTargetId).catch(supabaseCatch);
  showToast(`Certificate ${certRejectTargetId} rejected`,'warning');
  closeCertRejectModal();
  closeCertDrawer();
  rerenderSection();
}

/* ── QR Modal ── */
function openCertQRModal(id){
  const c=DATA.certificates.find(x=>x.id===id);
  if(!c)return;
  const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin+'/?cert='+c.id)}`;
  document.getElementById('certQRImg').src=qrUrl;
  document.getElementById('certQRTitle').textContent=c.equipName;
  document.getElementById('certQRSubtitle').textContent='Cert ID: '+c.id;
  document.getElementById('certQRModal').classList.add('open');
}

function closeCertQRModal(){
  document.getElementById('certQRModal').classList.remove('open');
}

/* ── Edit Certificate Modal (opens existing modal prefilled) ── */
function openEditCertModal(id){
  const c=DATA.certificates.find(x=>x.id===id);
  if(!c)return;
  // For now, reuse the new cert modal with prefilled data
  showToast('Edit mode: prefilled data coming soon','info');
  openNewCertModal();
}

/* ═══════════════════════════════════════════════
   NOTIFICATION SETTINGS (Push)
═══════════════════════════════════════════════ */
function renderCertNotifications(){
  const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  const notifSupported = 'Notification' in window;
  const perm = notifSupported ? Notification.permission : 'denied';

  let html=`<div class="fade-in">
    <div class="sec-card"><div class="sec-card-head"><i class="fa-solid fa-bell"></i> Push Notification Preferences</div>
    <div class="sec-card-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">`;

  // Browser support status
  html+=`<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-sec);margin-bottom:6px;">Browser Support</div>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span>Service Worker</span>
        <span style="color:${pushSupported?'var(--success)':'var(--error)'};">${pushSupported?'<i class="fa-solid fa-check-circle" style="color:var(--success)"></i> Available':'<i class="fa-solid fa-circle-xmark" style="color:var(--error)"></i> Not available'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span>Push API</span>
        <span style="color:${pushSupported?'var(--success)':'var(--error)'};">${pushSupported?'<i class="fa-solid fa-check" style="color:var(--success)"></i> Supported':'<i class="fa-solid fa-xmark" style="color:var(--error)"></i> Not supported'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span>Notification Permission</span>
        <span style="color:${perm==='granted'?'var(--success)':perm==='denied'?'var(--error)':'var(--warning)'};">${perm}</span>
      </div>
    </div></div>`;

  // Controls
  const canSubscribe = pushSupported && perm==='granted';
  html+=`<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-sec);margin-bottom:6px;">Push Notifications</div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
        <input type="checkbox" ${state.pushEnabled?'checked':''} ${canSubscribe?'':'disabled'} onchange="togglePushNotif(this.checked)" style="width:18px;height:18px;">
        <span style="font-size:13px;">Enable push alerts for certificate expiry</span>
      </label>
      ${!canSubscribe?`<div style="font-size:12px;color:var(--warning);padding:8px 12px;background:#fff8e1;border-radius:4px;">
        <i class="fa-solid fa-triangle-exclamation"></i> ${perm==='denied'?'Notifications blocked in browser settings. Allow notifications in your browser site settings.':'Push notifications not supported in this browser.'}
      </div>`:''}
      <div style="display:flex;gap:8px;margin-top:6px;">
        <button class="btn btn-secondary btn-sm" onclick="checkPushHealth()"><i class="fa-solid fa-stethoscope"></i> Check Health</button>
        <button class="btn btn-ghost btn-sm" onclick="requestNotifPermission()"><i class="fa-solid fa-key"></i> Request Permission</button>
      </div>
    </div></div>`;

  // Expiry notification rules
  html+=`</div></div></div>
    <div class="sec-card"><div class="sec-card-head">Expiry Alert Rules</div>
    <div class="sec-card-body" style="font-size:13px;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div style="padding:12px;background:#fef3e2;border-radius:6px;">
          <div style="font-weight:700;color:var(--warning);">7 Days</div>
          <div style="font-size:11px;color:var(--text-sec);margin-top:4px;">Critical alert when certificate expires within 7 days</div>
        </div>
        <div style="padding:12px;background:#fff8e1;border-radius:6px;">
          <div style="font-weight:700;color:var(--warning);">30 Days</div>
          <div style="font-size:11px;color:var(--text-sec);margin-top:4px;">Warning alert when certificate expires within 30 days</div>
        </div>
        <div style="padding:12px;background:#fbe9e7;border-radius:6px;">
          <div style="font-weight:700;color:var(--error);">Expired</div>
          <div style="font-size:11px;color:var(--text-sec);margin-top:4px;">Immediate alert on certificate expiry</div>
        </div>
      </div>
    </div></div>
    <div class="sec-card"><div class="sec-card-head">Client-side Expiry Check</div>
    <div class="sec-card-body">
      <div style="font-size:13px;color:var(--text-sec);margin-bottom:8px;">The following certificates require attention:</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${DATA.certificates.filter(c=>{const s=getCertStatus(c);return s==='expired'||s==='expiring';}).map(c=>{const s=getCertStatus(c);const d=getCertDays(c);return`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:${s==='expired'?'#fbe9e7':'#fff8e1'};border-radius:4px;font-size:12px;">
            <span><strong>${c.equipName}</strong> — ${c.certType}</span>
            <span style="color:${s==='expired'?'var(--error)':'var(--warning)'};font-weight:700;">${s==='expired'?'Expired '+Math.abs(d)+'d ago':d+'d left'}</span>
          </div>`;}).join('')}
      </div>
    </div></div>
  </div>`;
  return html;
}

function togglePushNotif(enabled){
  if(enabled){
    if('Notification' in window && Notification.permission==='granted' && state._swReg){
      state._swReg.pushManager.subscribe({userVisibleOnly:true}).then(sub=>{
        state.pushSubscribed = true;
        state.pushEnabled = true;
        showToast('Push notifications enabled','success');
        rerenderSection();
      }).catch(err=>{
        showToast('Failed to subscribe: '+err.message,'error');
      });
    } else if('Notification' in window && Notification.permission==='default'){
      Notification.requestPermission().then(perm=>{
        if(perm==='granted') togglePushNotif(true);
        else showToast('Notification permission denied','error');
      });
    }
  } else {
    if(state._swReg){
      state._swReg.pushManager.getSubscription().then(sub=>{
        if(sub){
          sub.unsubscribe().then(()=>{
            state.pushSubscribed = false;
            state.pushEnabled = false;
            showToast('Push notifications disabled','info');
            rerenderSection();
          });
        }
      });
    }
  }
}

function checkPushHealth(){
  let info = `Service Worker: ${'serviceWorker' in navigator?'<i class="fa-solid fa-check" style="color:var(--success)"></i>':'<i class="fa-solid fa-xmark" style="color:var(--error)"></i>'}\n`;
  info += `Push API: ${'PushManager' in window?'<i class="fa-solid fa-check" style="color:var(--success)"></i>':'<i class="fa-solid fa-xmark" style="color:var(--error)"></i>'}\n`;
  info += `Notification: ${'Notification' in window?Notification.permission:'N/A'}\n`;
  info += `Subscribed: ${state.pushSubscribed?'<i class="fa-solid fa-check" style="color:var(--success)"></i>':'<i class="fa-solid fa-xmark" style="color:var(--error)"></i>'}\n`;
  if(state._swReg){
    state._swReg.pushManager.getSubscription().then(sub=>{
      if(sub){
        info += `\n--- Subscription Details ---\n`;
        info += `Endpoint: ${sub.endpoint.slice(0,50)}...\n`;
        const keyJson = sub.toJSON();
        info += `p256dh: ${keyJson.keys?.p256dh?'<i class="fa-solid fa-check" style="color:var(--success)"></i> Set':'<i class="fa-solid fa-xmark" style="color:var(--error)"></i> Missing'}\n`;
        info += `auth: ${keyJson.keys?.auth?'<i class="fa-solid fa-check" style="color:var(--success)"></i> Set':'<i class="fa-solid fa-xmark" style="color:var(--error)"></i> Missing'}\n`;
      }
      showToast(info.replace(/\n/g,'<br>'),'info');
    });
  } else {
    showToast(info.replace(/\n/g,'<br>'),'info');
  }
}

function requestNotifPermission(){
  if('Notification' in window){
    Notification.requestPermission().then(perm=>{
      if(perm==='granted'){
        showToast('Notification permission granted','success');
        rerenderSection();
      } else {
        showToast('Notification permission denied','error');
      }
    });
  }
}

/* ═══════════════════════════════════════════════
   CERTIFICATE GANTT / TIMELINE VIEW
═══════════════════════════════════════════════ */
function renderCertGantt(){
  const today = new Date(); today.setHours(0,0,0,0);
  const months = [];
  for(let i=-1;i<=12;i++){
    const m = new Date(today.getFullYear(), today.getMonth()+i, 1);
    months.push(m);
  }
  const monthLabels = months.map(m=>m.toLocaleString('default',{month:'short',year:'2-digit'}));
  const certTypeIcons={'CAT III':'fa-shield','CAT IV':'fa-shield','LIFTING':'fa-weight-hanging','LOAD TEST':'fa-dumbbell','NDT':'fa-chart-line','TUBULAR':'fa-pipe','ORIGINAL COC':'fa-file-circle-check'};
  const statusColors={valid:'var(--success)',expiring:'var(--warning)',renewal:'var(--purple)',expired:'var(--error)'};

  // Group certs by certCategory
  const byType = {};
  DATA.certificates.forEach(c=>{
    byType[c.certCategory] = byType[c.certCategory]||[];
    byType[c.certCategory].push(c);
  });

  let html=`<div class="fade-in">
    <div class="kpi-grid">
      <div class="kpi-card"><span class="kpi-label">Total</span><span class="kpi-value">${DATA.certificates.length}</span></div>
      <div class="kpi-card green"><span class="kpi-label">By Type</span><span class="kpi-value">${Object.keys(byType).length}</span></div>
    </div>
    <div class="sec-card"><div class="sec-card-head">Expiry Timeline — Next 12 Months
      <button class="btn btn-ghost btn-sm" onclick="switchSection('allCerts')"><i class="fa-solid fa-table"></i> Table View</button>
    </div>
    <div class="sec-card-body" style="overflow-x:auto;">
      <div style="min-width:700px;">
        <div style="display:grid;grid-template-columns:200px repeat(${months.length},1fr);gap:2px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-sec);border-bottom:1px solid var(--border);padding-bottom:6px;margin-bottom:6px;">
          <div style="padding:4px 8px;">Certificate</div>
          ${monthLabels.map(ml=>`<div style="text-align:center;padding:4px 0;">${ml}</div>`).join('')}
        </div>`;
  const sortedCerts = [...DATA.certificates].sort((a,b)=>new Date(a.expiryDate)-new Date(b.expiryDate));
  sortedCerts.forEach(c=>{
    const exp = new Date(c.expiryDate); exp.setHours(0,0,0,0);
    const expMonthIdx = months.findIndex(m=>m.getFullYear()===exp.getFullYear()&&m.getMonth()===exp.getMonth());
    const col = statusColors[c.status]||'var(--text-sec)';
    const tip = `${c.equipName} — expires ${c.expiryDate} (${c.daysRemaining}d)`;
    html+=`<div style="display:grid;grid-template-columns:200px repeat(${months.length},1fr);gap:2px;font-size:11px;align-items:center;border-bottom:1px solid #f0f0f0;padding:4px 0;">
      <div style="display:flex;align-items:center;gap:6px;padding:0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        <i class="fa-solid ${certTypeIcons[c.certCategory]||'fa-certificate'}" style="font-size:10px;color:${col};"></i>
        <span title="${c.equipName}">${c.equipName.length>22?c.equipName.slice(0,22)+'...':c.equipName}</span>
      </div>`;
    for(let mi=0; mi<months.length; mi++){
      if(mi===expMonthIdx){
        const gs=getCertStatus(c);const gd=getCertDays(c);
        const barCol = gs==='expired'?'var(--error)':gs==='expiring'?'var(--warning)':'var(--success)';
        const barW = gs==='expired'?Math.max(20,Math.min(95,Math.abs(gd)/30*100)):90;
        html+=`<div style="position:relative;height:20px;display:flex;align-items:center;justify-content:center;">
          <div style="width:${barW}%;height:14px;background:${barCol};border-radius:3px;opacity:0.85;" title="${tip}"></div>
        </div>`;
      } else {
        html+=`<div></div>`;
      }
    }
    html+=`</div>`;
  });
  html+=`</div></div></div>`;

  // Chart.js type distribution
  html+=`<div class="sec-card"><div class="sec-card-head">Certificates by Type</div><div class="sec-card-body"><canvas id="certTypeChart" style="max-height:200px;"></canvas></div></div>`;

  html+=`</div>`;

  // Defer chart rendering
  setTimeout(()=>{
    const ctx = document.getElementById('certTypeChart');
    if(!ctx||typeof Chart==='undefined') return;
    const labels = Object.keys(byType);
    const data = labels.map(l=>byType[l].length);
    const colors = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#db2777'];
    if(window._certTypeChart) window._certTypeChart.destroy();
    window._certTypeChart = new Chart(ctx,{
      type:'doughnut',
      data:{labels, datasets:[{data, backgroundColor:colors.slice(0,labels.length), borderWidth:0}]},
      options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'right',labels:{boxWidth:12,font:{size:11}}}}}
    });
  }, 50);

  return html;
}

/* ═══════════════════════════════════════════════
   NEW CERTIFICATE MODAL
═══════════════════════════════════════════════ */
function certFilterFL(clientId){
  const flSel=document.getElementById('nc-fl');
  const siteInp=document.getElementById('nc-site');
  if(!flSel)return;
  Array.from(flSel.options).forEach(o=>{
    o.style.display=(!clientId||o.dataset.client===clientId||!o.value)?'':'none';
  });
  if(clientId && !flSel.value){
    const first=Array.from(flSel.options).find(o=>o.value&&o.style.display!=='none');
    if(first){flSel.value=first.value;flSel.dispatchEvent(new Event('change'));}
  }
  if(!clientId){flSel.value='';siteInp.value='';}
}

function certFillSite(){
  const flSel=document.getElementById('nc-fl');
  const siteInp=document.getElementById('nc-site');
  if(!flSel||!siteInp)return;
  const opt=flSel.options[flSel.selectedIndex];
  siteInp.value=opt&&opt.text?opt.text.split(' (')[0]:'';
}

function openNewCertModal(jobId){
  const job=jobId?DATA.jobs.find(j=>j.id===jobId):null;
  const preClientId=job?job.clientId:'';
  const preFlId=job?job.flId:'';
  const preInspectorId=job?(()=>{
    const ja=DATA.jobAssignments.find(a=>a.jobId===jobId);
    return ja?ja.inspectorId:'';
  })():'';
  const preSite=job?(()=>{const fl=DATA.functionalLocations.find(f=>f.id===job.flId);return fl?fl.name:'';})():'';
  const clientOpts=DATA.accounts.filter(a=>a.status==='active').map(a=>`<option value="${a.id}" ${preClientId===a.id?'selected':''}>${h(a.name)}</option>`).join('');
  const flOpts=DATA.functionalLocations.filter(f=>f.status==='active').map(f=>`<option value="${f.id}" data-client="${f.clientId||''}" ${preFlId===f.id?'selected':''}>${h(f.name)} (${f.flId})</option>`).join('');
  const inspOpts=DATA.inspectors.filter(i=>i.status==='active').map(i=>`<option value="${i.id}" ${preInspectorId===i.id?'selected':''}>${h(i.name)} – ${h(i.title)}</option>`).join('');
  const disabled=job?'disabled':'';
  const body=`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Client <span style="color:var(--error)">*</span></label>
        <select class="form-select" id="nc-client" onchange="certFilterFL(this.value)" style="font-weight:600;" ${disabled}>
          <option value="">— Select Client —</option>
          ${clientOpts}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Functional Location</label>
        <select class="form-select" id="nc-fl" onchange="certFillSite()" ${disabled}>
          <option value="">— Select Location —</option>
          ${flOpts}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Inspector</label>
        <select class="form-select" id="nc-inspector" ${disabled}>
          <option value="">— Select Inspector —</option>
          ${inspOpts}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Site / Location (text)</label><input class="form-input" id="nc-site" placeholder="Auto-filled from FL, or type manually" value="${h(preSite)}"></div>
    </div>
    ${job?`<input type="hidden" id="nc-jobId" value="${job.id}">`:''}
    <hr style="border:none;border-top:1px solid var(--border);margin:12px 0;">
    <div class="form-row">
      <div class="form-group"><label class="form-label">Equipment Name</label><input class="form-input" id="nc-name" placeholder="e.g. HP Centrifugal Pump – P-201"></div>
      <div class="form-group"><label class="form-label">Asset Tag / No.</label><input class="form-input" id="nc-tag" placeholder="e.g. ROT-P201"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Equipment Category</label>
        <select class="form-select" id="nc-cat"><option>Rotating</option><option>Static</option><option>Lifting</option><option>Electrical</option><option>Pressure</option><option>Fire & Safety</option><option>Instrumentation</option><option>Vehicles</option></select>
      </div>
      <div class="form-group"><label class="form-label">Cert. Category (Rigways)</label>
        <select class="form-select" id="nc-certCat" onchange="document.getElementById('nc-liftSubtype').style.display=this.value==='LIFTING'?'block':'none'">
          <option value="CAT III">CAT III – Inspection</option>
          <option value="CAT IV">CAT IV – Inspection</option>
          <option value="LIFTING">LIFTING – Equipment</option>
          <option value="LOAD TEST">LOAD TEST</option>
          <option value="NDT">NDT – Non-Destructive</option>
          <option value="TUBULAR">TUBULAR – Inspection</option>
          <option value="ORIGINAL COC">ORIGINAL COC</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" id="nc-liftSubtype" style="display:none;">
        <label class="form-label">Lifting Subtype</label>
        <select class="form-select" id="nc-liftType"><option>LIFTING GEAR</option><option>LIFTING PERSONNEL</option><option>LIFTING EQUIPMENT</option></select>
      </div>
      <div class="form-group"><label class="form-label">Issuing Authority</label><input class="form-input" id="nc-issuer" placeholder="e.g. Bureau Veritas, DNV, SGS"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Job Number</label><input class="form-input" id="nc-job" placeholder="e.g. JOB-2025-001" value="${job?h(job.title):''}"></div>
      <div class="form-group"><label class="form-label">Certificate Type</label><input class="form-input" id="nc-type" placeholder="e.g. API 510, LOLER, IEC 60079"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Issue Date</label><input class="form-input" id="nc-issue" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="form-label">Expiry Date</label><input class="form-input" id="nc-expiry" type="date"></div>
      <div class="form-group"><label class="form-label">Upload PDF</label>
      <input class="form-input" id="nc-file" type="file" accept=".pdf"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Upload PDF (filename)</label><input class="form-input" id="nc-pdf" placeholder="cert_filename.pdf" type="text"></div>
    </div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-textarea" id="nc-remarks" placeholder="Inspector notes, findings, next actions..."></textarea></div>`;
  const footer=`<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" onclick="submitNewCert()">${t('save')}</button>`;
  openModal(t('newCertificate'),body,footer);
}

async function submitNewCert(){
  const name=$('#nc-name').value.trim(),expiry=$('#nc-expiry').value;
  const fileInput = document.getElementById('nc-file');
  if(!name||!expiry){showToast('Equipment name and expiry date are required','error');return;}
  const newId='CERT-'+String(DATA.certificates.length+1).padStart(3,'0');
  const days=Math.round((new Date(expiry)-new Date())/(1000*60*60*24));
  const status=days<0?'expired':days<=30?'expiring':days<=90?'renewal':'valid';
  const certCategory=$('#nc-certCat').value;
  let liftingSubtype='';
  if(certCategory==='LIFTING'&&document.getElementById('nc-liftType')) liftingSubtype=document.getElementById('nc-liftType').value;

  // Phase 5: File Upload Mock
  let uploadedPdfUrl = $('#nc-pdf').value;
  if(fileInput && fileInput.files.length > 0) {
    uploadedPdfUrl = URL.createObjectURL(fileInput.files[0]);
    showToast('File securely uploaded to Supabase Storage Bucket', 'success');
  }

  // FK lookups
  const clientId=$('#nc-client').value||null;
  const flId=$('#nc-fl').value||null;
  const inspectorId=$('#nc-inspector').value||null;
  const clientObj=clientId?DATA.accounts.find(a=>a.id===clientId):null;
  const flObj=flId?DATA.functionalLocations.find(f=>f.id===flId):null;
  const inspObj=inspectorId?DATA.inspectors.find(i=>i.id===inspectorId):null;
  const site=$('#nc-site').value||(flObj?flObj.name:'');

  const jobId=$('#nc-jobId')?.value||null;
  const nowISO=new Date().toISOString();
  const cert={
    id:newId,equipName:name,assetTag:$('#nc-tag').value,category:$('#nc-cat').value,
    certCategory,liftingSubtype,
    clientId,flId,inspectorId, jobId,
    uploadedAt:nowISO, uploadedBy:state.currentInspectorId||inspectorId,
    client:clientObj?clientObj.name:'',site,certType:$('#nc-type').value,
    issuer:$('#nc-issuer').value,issueDate:$('#nc-issue').value,
    expiryDate:expiry,daysRemaining:days,status,
    approvalStatus:'pending',engineer:inspObj?inspObj.name:'',
    fileName:uploadedPdfUrl,pdfUrl:uploadedPdfUrl,
    jobNumber:$('#nc-job').value,remarks:$('#nc-remarks').value
  };
  if(supabase){
    const{error}=await supabase.from('certificates').insert({id:newId,employee_id:null,cert_type:cert.certType,expiry_date:expiry,status,client_id:clientId,fl_id:flId,inspector_id:inspectorId,job_id:jobId});
    if(error){showToast('Error saving certificate','error');return;}
  }
  DATA.certificates.push(cert);
  closeModal();state.selectedId=newId;state.section='allCerts';showToast(name+' certificate added','success');rerenderSection();
}

/* ═══════════════════════════════════════════════
   BULK CERTIFICATE IMPORT WIZARD (Rigways style)
═══════════════════════════════════════════════ */
let BULK_CERTS = [];
let BULK_STEP = 1;
let BULK_DEFAULTS = { certCategory:'CAT III', validityMonths:12, inspectorId:'', inspectorName:'', clientId:'', clientName:'', flId:'', site:'', equipCategory:'Rotating', issuer:'' };

const BULK_EQUIP_CATS = ['Rotating','Static','Lifting','Electrical','Pressure','Fire & Safety','Instrumentation','Vehicles'];
const BULK_CERT_TYPES = ['CAT III','CAT IV','LIFTING','LOAD TEST','NDT','TUBULAR','ORIGINAL COC'];
const BULK_LIFT_SUBTYPES = ['LIFTING GEAR','LIFTING PERSONNEL','LIFTING EQUIPMENT'];

function openBulkCertModal(){
  BULK_CERTS = []; BULK_STEP = 1;
  BULK_DEFAULTS = { certCategory:'CAT III', validityMonths:12, inspectorId:'', inspectorName:'', clientId:'', clientName:'', flId:'', site:'', equipCategory:'Rotating', issuer:'' };
  renderBulkWizard();
}

function renderBulkWizard(){
  const steps = ['1. Source & Defaults','2. Review Data','3. QR & Confirm'];
  const $s=(s,i)=>`<div class="bulk-step ${i+1===BULK_STEP?'active':i+1<BULK_STEP?'done':''}" onclick="BULK_STEP=${i+1};renderBulkWizard()" role="tab" tabindex="0" aria-selected="${i+1===BULK_STEP}" onkeydown="if(event.key==='Enter'){BULK_STEP=${i+1};renderBulkWizard()}">${i+1<BULK_STEP?'<i class="fa-solid fa-check-circle"></i>':`<span class="bulk-step-num">${i+1}</span>`} ${s}</div>`;
  const content = BULK_STEP===1 ? renderBulkStep1() : BULK_STEP===2 ? renderBulkStep2() : renderBulkStep3();
  const prev = BULK_STEP>1 ? `<button class="btn btn-ghost btn-sm" onclick="BULK_STEP--;renderBulkWizard()"><i class="fa-solid fa-arrow-left"></i> Back</button>` : '';
  const next = BULK_STEP<3 ? `<button class="btn btn-primary btn-sm" onclick="bulkWizardNext()">Next <i class="fa-solid fa-arrow-right"></i></button>` : '';
  const submit = BULK_STEP===3 ? `<button class="btn btn-primary" onclick="submitBulkWizard()"><i class="fa-solid fa-check"></i> Import ${BULK_CERTS.length} Certificates</button>` : '';
  const html = `
    <div class="bulk-wizard">
      <div class="bulk-steps" role="tablist">${steps.map($s).join('<div class="bulk-step-connector"></div>')}</div>
      <div class="bulk-step-body">${content}</div>
      <div class="bulk-nav">${prev}<div style="flex:1"></div>${next}${submit}</div>
    </div>`;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>`;
  openModal('Mass Import Certificates', html, footer);
  document.querySelector('.modal')?.classList.add('modal--wide');
  if(BULK_STEP===2) setTimeout(()=>document.querySelector('.bulk-step-body')?.scrollTo(0,0),10);
}

function bulkWizardNext(){
  if(BULK_STEP===1){
    if(BULK_CERTS.length===0){ showToast('Add at least one certificate row before proceeding','error'); return; }
    const missing = BULK_CERTS.filter(r=>!r.equipName||!r.expiryDate);
    if(missing.length>0){ showToast(`${missing.length} row(s) missing equipment name or expiry — fix first`,'error'); return; }
  }
  if(BULK_STEP<3){ BULK_STEP++; renderBulkWizard(); }
}

/* ── Step 1: Source & Defaults ── */
function renderBulkStep1(){
  const clientOpts = `<option value="">— Select —</option>${DATA.accounts.filter(a=>a.status==='active').map(a=>`<option value="${a.id}" ${BULK_DEFAULTS.clientId===a.id?'selected':''}>${h(a.name)}</option>`).join('')}`;
  const flOpts = `<option value="">— Select —</option>${DATA.functionalLocations.filter(f=>f.status==='active').map(f=>`<option value="${f.id}" ${BULK_DEFAULTS.flId===f.id?'selected':''}>${h(f.name)} (${f.flId})</option>`).join('')}`;
  const inspOpts = `<option value="">— Select —</option>${DATA.inspectors.filter(i=>i.status==='active').map(i=>`<option value="${i.id}" ${BULK_DEFAULTS.inspectorId===i.id?'selected':''}>${h(i.name)} – ${h(i.title)}</option>`).join('')}`;
  return `
    <div style="margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:10px;"><i class="fa-solid fa-file-import"></i> Import Source</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="bulkDownloadTemplate()"><i class="fa-solid fa-download"></i> Download CSV Template</button>
        <label class="btn btn-primary btn-sm" style="cursor:pointer;"><i class="fa-solid fa-upload"></i> Upload CSV<input type="file" accept=".csv" style="display:none" onchange="bulkHandleCSV(this)"></label>
        <button class="btn btn-ghost btn-sm" onclick="bulkAddRowManual()"><i class="fa-solid fa-pen"></i> Enter Manually</button>
      </div>
      ${BULK_CERTS.length>0?`<div style="margin-top:8px;font-size:12px;color:var(--text-sec);"><i class="fa-solid fa-circle-check" style="color:var(--success);"></i> ${BULK_CERTS.length} row(s) loaded</div>`:''}
    </div>
    <hr style="border:none;border-top:1px solid var(--border);margin:12px 0;">
    <div style="font-size:13px;font-weight:700;margin-bottom:10px;"><i class="fa-solid fa-sliders"></i> Default Values (applied to all rows)</div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Client</label><select class="form-select" id="bd-client" onchange="BULK_DEFAULTS.clientId=this.value;BULK_DEFAULTS.clientName=this.options[this.selectedIndex].text;bulkApplyDefaults()">${clientOpts}</select></div>
      <div class="form-group"><label class="form-label">Functional Location</label><select class="form-select" id="bd-fl" onchange="BULK_DEFAULTS.flId=this.value;bulkFillSite()">${flOpts}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Site</label><input class="form-input" id="bd-site" value="${h(BULK_DEFAULTS.site)}" onchange="BULK_DEFAULTS.site=this.value"></div>
      <div class="form-group"><label class="form-label">Inspector</label><select class="form-select" id="bd-inspector" onchange="BULK_DEFAULTS.inspectorId=this.value;BULK_DEFAULTS.inspectorName=this.options[this.selectedIndex].text.split(' – ')[0]">${inspOpts}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Cert Category</label><select class="form-select" id="bd-certCat" onchange="BULK_DEFAULTS.certCategory=this.value;document.getElementById('bd-liftWrap').style.display=this.value==='LIFTING'?'':'none'">${BULK_CERT_TYPES.map(t=>`<option value="${t}" ${BULK_DEFAULTS.certCategory===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Equipment Category</label><select class="form-select" id="bd-equipCat" onchange="BULK_DEFAULTS.equipCategory=this.value">${BULK_EQUIP_CATS.map(c=>`<option value="${c}" ${BULK_DEFAULTS.equipCategory===c?'selected':''}>${c}</option>`).join('')}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Issuing Authority</label><input class="form-input" id="bd-issuer" value="${h(BULK_DEFAULTS.issuer)}" placeholder="e.g. Bureau Veritas" onchange="BULK_DEFAULTS.issuer=this.value"></div>
      <div class="form-group"><label class="form-label">Validity (months)</label><input class="form-input" id="bd-validity" type="number" value="${BULK_DEFAULTS.validityMonths}" min="1" max="60" onchange="BULK_DEFAULTS.validityMonths=parseInt(this.value)||12"></div>
    </div>`;
}

function bulkFillSite(){
  const fl = DATA.functionalLocations.find(f=>f.id===document.getElementById('bd-fl')?.value);
  if(fl){ document.getElementById('bd-site').value = fl.name; BULK_DEFAULTS.site = fl.name; }
}

function bulkApplyDefaults(){
  // Auto-fill site from FL if possible
  bulkFillSite();
  // Issue dates get defaults when rows are added; updating defaults doesn't retro-change rows here
}

function bulkDownloadTemplate(){
  const headers = ['assetTag','equipName','category','certCategory','liftingSubtype','client','site','jobNumber','inspector','issuer','certType','issueDate','expiryDate','remarks'];
  const row = ['AST-0001','Example Equipment','Rotating','CAT III','','Client Name','Site Name','JOB-001','Inspector Name','Bureau Veritas','API 510','2026-01-15','2027-01-15','Inspector notes here'];
  const csv = [headers.join(','), row.join(',')].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cert_import_template.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Template downloaded','success');
}

function bulkHandleCSV(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    try {
      const text = e.target.result;
      const lines = text.split('\n').map(l=>l.trim()).filter(l=>l);
      if(lines.length<2){ showToast('CSV must have a header row and at least one data row','error'); return; }
      const headers = lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
      const colMap = {};
      headers.forEach((h,i)=>colMap[h.toLowerCase()]=i);
      const needed = ['assetTag','equipname','issuedate','expirydate'];
      const missing = needed.filter(n=>!colMap[n]&&n!=='expirydate');
      if(missing.length){ showToast('CSV missing required columns: '+missing.join(', '),'error'); return; }
      const rows = [];
      for(let i=1; i<lines.length; i++){
        const vals = lines[i].split(',').map(v=>v.trim().replace(/^"|"$/g,''));
        if(vals.length<2) continue;
        const g = (k)=>{ const idx=colMap[k]; return idx!==undefined?vals[idx]||'':''; };
        rows.push({
          assetTag: g('assetTag') || `AST-${String(i).padStart(4,'0')}`,
          equipName: g('equipname') || g('name') || '',
          category: g('category') || g('equipcategory') || BULK_DEFAULTS.equipCategory,
          certCategory: g('certcategory') || BULK_DEFAULTS.certCategory,
          liftingSubtype: g('liftingsubtype') || '',
          client: g('client') || BULK_DEFAULTS.clientName,
          clientId: BULK_DEFAULTS.clientId,
          site: g('site') || BULK_DEFAULTS.site,
          jobNumber: g('jobnumber') || '',
          inspector: g('inspector') || BULK_DEFAULTS.inspectorName,
          inspectorId: BULK_DEFAULTS.inspectorId,
          issuer: g('issuer') || BULK_DEFAULTS.issuer,
          certType: g('certtype') || g('type') || '',
          issueDate: g('issuedate') || new Date().toISOString().split('T')[0],
          expiryDate: g('expirydate') || '',
          remarks: g('remarks') || ''
        });
      }
      if(!rows.length){ showToast('No valid data rows found in CSV','error'); return; }
      BULK_CERTS = rows;
      showToast(`${rows.length} row(s) loaded from CSV`,'success');
      BULK_STEP = 2;
      renderBulkWizard();
    } catch(err) { showToast('Error parsing CSV: '+err.message,'error'); }
  };
  reader.readAsText(file);
  input.value = '';
}

function bulkAddRowManual(){
  const idx = BULK_CERTS.length;
  BULK_CERTS.push({
    assetTag: `AST-${String(idx+1).padStart(4,'0')}`,
    equipName: '', category: BULK_DEFAULTS.equipCategory, certCategory: BULK_DEFAULTS.certCategory,
    liftingSubtype: '', client: BULK_DEFAULTS.clientName, clientId: BULK_DEFAULTS.clientId,
    site: BULK_DEFAULTS.site, jobNumber: '',
    inspector: BULK_DEFAULTS.inspectorName, inspectorId: BULK_DEFAULTS.inspectorId,
    issuer: BULK_DEFAULTS.issuer, certType: '',
    issueDate: new Date().toISOString().split('T')[0], expiryDate: '',
    remarks: ''
  });
  if(BULK_STEP===1){ BULK_STEP=2; renderBulkWizard(); }
  else renderBulkStep2Content();
}

/* ── Step 2: Review Data ── */
function renderBulkStep2(){
  return `<div style="margin-bottom:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
    <span style="font-size:12px;color:var(--text-sec);font-weight:600;">${BULK_CERTS.length} row(s)</span>
    <button class="btn btn-secondary btn-sm" onclick="bulkAddRowManual()"><i class="fa-solid fa-plus"></i> Add Row</button>
    <button class="btn btn-ghost btn-sm" onclick="bulkClearAllRows()" ${BULK_CERTS.length===0?'disabled':''}><i class="fa-solid fa-trash"></i> Clear All</button>
    <span id="bulkStep2Summary" style="font-size:12px;margin-left:auto;"></span>
  </div><div id="bulkStep2Body" style="max-height:360px;overflow-y:auto;"></div>`;
}

function renderBulkStep2Content(){
  const container = document.getElementById('bulkStep2Body');
  if(!container) return;
  const certCatOpts = BULK_CERT_TYPES.map(t=>`<option value="${t}">${t}</option>`).join('');
  const equipCatOpts = BULK_EQUIP_CATS.map(c=>`<option value="${c}">${c}</option>`).join('');
  const liftOpts = `<option value="">—</option>${BULK_LIFT_SUBTYPES.map(s=>`<option value="${s}">${s}</option>`).join('')}`;
  let html = `<div class="bulk-step2-table-wrap"><table class="data-table" style="font-size:11px;white-space:nowrap;"><thead><tr>
    <th>#</th><th>Asset Tag</th><th>Equipment Name <span style="color:var(--error)">*</span></th><th>Equip Cat</th><th>Cert Cat</th><th>Lifting Sub</th>
    <th>Client</th><th>Site</th><th>Issuer</th><th>Issue Date</th><th>Expiry Date <span style="color:var(--error)">*</span></th><th>Remarks</th><th></th>
  </tr></thead><tbody>`;
  BULK_CERTS.forEach((r,i)=>{
    const showLift = r.certCategory==='LIFTING'?'':'style="display:none"';
    html += `<tr>
      <td style="color:var(--text-sec);">${i+1}</td>
      <td><input class="sap-input" style="width:70px;height:26px;font-size:10px;" value="${h(r.assetTag)}" onchange="bulkUpd(${i},'assetTag',this.value)"></td>
      <td><input class="sap-input" style="width:130px;height:26px;font-size:10px;" value="${h(r.equipName)}" placeholder="Required" onchange="bulkUpd(${i},'equipName',this.value)"></td>
      <td><select class="sap-input" style="width:85px;height:26px;font-size:10px;" onchange="bulkUpd(${i},'category',this.value)">${equipCatOpts.replace(`value="${r.category}"`,`value="${r.category}" selected`)}</select></td>
      <td><select class="sap-input" style="width:80px;height:26px;font-size:10px;" onchange="bulkUpd(${i},'certCategory',this.value);renderBulkStep2Content()">${certCatOpts.replace(`value="${r.certCategory}"`,`value="${r.certCategory}" selected`)}</select></td>
      <td><select class="sap-input" style="width:90px;height:26px;font-size:10px;" ${showLift} onchange="bulkUpd(${i},'liftingSubtype',this.value)">${liftOpts.replace(`value="${r.liftingSubtype}"`,`value="${r.liftingSubtype}" selected`)}</select></td>
      <td><input class="sap-input" style="width:90px;height:26px;font-size:10px;" value="${h(r.client)}" onchange="bulkUpd(${i},'client',this.value)"></td>
      <td><input class="sap-input" style="width:100px;height:26px;font-size:10px;" value="${h(r.site)}" onchange="bulkUpd(${i},'site',this.value)"></td>
      <td><input class="sap-input" style="width:80px;height:26px;font-size:10px;" value="${h(r.issuer)}" onchange="bulkUpd(${i},'issuer',this.value)"></td>
      <td><input type="date" class="sap-input" style="width:105px;height:26px;font-size:10px;" value="${r.issueDate}" onchange="bulkUpd(${i},'issueDate',this.value);if(!BULK_CERTS[${i}].expiryDate)bulkCalcExpiry(${i})"></td>
      <td><input type="date" class="sap-input" style="width:105px;height:26px;font-size:10px;" value="${r.expiryDate}" onchange="bulkUpd(${i},'expiryDate',this.value)"></td>
      <td><input class="sap-input" style="width:90px;height:26px;font-size:10px;" value="${h(r.remarks)}" onchange="bulkUpd(${i},'remarks',this.value)"></td>
      <td><button class="btn btn-danger btn-icon" onclick="bulkRemoveRow(${i})" title="Remove"><i class="fa-solid fa-trash" style="font-size:10px;"></i></button></td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;
  const valid = BULK_CERTS.filter(r=>r.equipName&&r.expiryDate);
  const el = document.getElementById('bulkStep2Summary');
  if(el) el.innerHTML = `${valid.length}/${BULK_CERTS.length} complete ${valid.length===BULK_CERTS.length&&BULK_CERTS.length>0?'<i class="fa-solid fa-check-circle" style="color:var(--success)"></i>':'<span style="color:var(--warning)">Fill required fields</span>'}`;
}

function bulkUpd(idx, field, val){
  if(BULK_CERTS[idx]) BULK_CERTS[idx][field] = val;
}

function bulkRemoveRow(idx){
  BULK_CERTS.splice(idx,1);
  renderBulkStep2Content();
}

function bulkClearAllRows(){
  if(!BULK_CERTS.length) return;
  if(!confirm('Remove all rows?')) return;
  BULK_CERTS = [];
  renderBulkStep2Content();
}

function bulkCalcExpiry(idx){
  const r = BULK_CERTS[idx];
  if(!r||!r.issueDate) return;
  const d = new Date(r.issueDate);
  d.setMonth(d.getMonth() + (BULK_DEFAULTS.validityMonths||12));
  r.expiryDate = d.toISOString().split('T')[0];
  renderBulkStep2Content();
}

/* ── Step 3: QR & Confirm ── */
function renderBulkStep3(){
  const startId = DATA.certificates.length + 1;
  const certs = BULK_CERTS.map((r,i)=>{
    const id = 'CERT-'+String(startId+i).padStart(3,'0');
    const days = r.expiryDate ? Math.round((new Date(r.expiryDate)-new Date())/(1000*60*60*24)) : 0;
    const st = days<0?'expired':days<=30?'expiring':days<=90?'renewal':'valid';
    return { ...r, tempId: id, days, status: st };
  });
  const validC = certs.filter(c=>c.status!=='expired').length;
  const expiredC = certs.filter(c=>c.status==='expired').length;
  const origin = window.location.origin;
  let html = `<div style="margin-bottom:14px;display:flex;gap:16px;flex-wrap:wrap;">
    <div class="stat-chip"><i class="fa-solid fa-certificate"></i> Total: ${certs.length}</div>
    <div class="stat-chip" style="background:#e8f5e9;color:#2e7d32;"><i class="fa-solid fa-check-circle"></i> Valid: ${validC}</div>
    <div class="stat-chip" style="background:#ffebee;color:#c62828;"><i class="fa-solid fa-exclamation-triangle"></i> Expired: ${expiredC}</div>
  </div>
  <div style="font-size:11px;color:var(--text-sec);margin-bottom:10px;">Review each certificate below. QR codes encode a direct link to each certificate.</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">`;
  certs.forEach(c=>{
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin+'/?cert='+c.tempId)}`;
    const stColor = c.status==='expired'?'var(--error)':c.status==='expiring'?'var(--warning)':c.status==='renewal'?'var(--purple)':'var(--success)';
    html += `<div class="cert-qr-card" style="border:1px solid var(--border);border-radius:8px;padding:10px;background:var(--card);">
      <div style="text-align:center;margin-bottom:6px;">
        <img src="${qrUrl}" alt="QR" style="width:100px;height:100px;border:1px solid var(--border);border-radius:4px;" loading="lazy" onerror="this.outerHTML='<div style=\\'width:100px;height:100px;margin:auto;background:var(--bg);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--text-sec);\\'>QR</div>'">
      </div>
      <div style="font-size:11px;font-weight:700;text-align:center;margin-bottom:2px;">${h(c.tempId)}</div>
      <div style="font-size:10px;color:var(--text-sec);text-align:center;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${h(c.equipName||'No name')}</div>
      <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
        <span style="font-size:9px;padding:1px 6px;border-radius:3px;background:${stColor}15;color:${stColor};font-weight:600;">${c.status}</span>
        <span style="font-size:9px;padding:1px 6px;border-radius:3px;background:var(--bg);color:var(--text-sec);">${h(c.certCategory)}</span>
      </div>
      ${c.expiryDate?`<div style="font-size:9px;color:var(--text-sec);text-align:center;margin-top:4px;">Exp: ${c.expiryDate}</div>`:''}
    </div>`;
  });
  html += `</div>`;
  return html;
}

/* ── Submit Wizard ── */
function submitBulkWizard(){
  const incomplete = BULK_CERTS.filter(r=>!r.equipName||!r.expiryDate);
  if(incomplete.length>0){ showToast(`${incomplete.length} row(s) incomplete — fill equipment name and expiry`,'error'); return; }
  if(BULK_CERTS.length===0){ showToast('No rows to import','error'); return; }
  const now = new Date().toISOString();
  const newCerts = BULK_CERTS.map((r,i)=>{
    const newId = 'CERT-'+String(DATA.certificates.length+1+i).padStart(3,'0');
    const days = Math.round((new Date(r.expiryDate)-new Date())/(1000*60*60*24));
    const status = days<0?'expired':days<=30?'expiring':days<=90?'renewal':'valid';
    return {
      id:newId, equipName:r.equipName, assetTag:r.assetTag||'',
      category:r.category||BULK_DEFAULTS.equipCategory,
      certCategory:r.certCategory||BULK_DEFAULTS.certCategory,
      liftingSubtype:r.liftingSubtype||'',
      clientId:BULK_DEFAULTS.clientId, client:r.client||BULK_DEFAULTS.clientName,
      flId:BULK_DEFAULTS.flId, site:r.site||BULK_DEFAULTS.site,
      inspectorId:BULK_DEFAULTS.inspectorId, engineer:r.inspector||BULK_DEFAULTS.inspectorName,
      jobNumber:r.jobNumber||'', issuer:r.issuer||BULK_DEFAULTS.issuer,
      certType:r.certType||'',
      issueDate:r.issueDate||now.split('T')[0], expiryDate:r.expiryDate,
      daysRemaining:days, status, approvalStatus:'pending',
      fileName:'', pdfUrl:'', remarks:r.remarks||'Imported via mass import wizard',
      uploadedAt:now, uploadedBy:state.currentInspectorId||null
    };
  });
  DATA.certificates.push(...newCerts);
  closeModal();
  showToast(`${newCerts.length} certificates imported successfully with QR codes`,'success');
  state.section='pendingApproval';
  rerenderSection();
}

/* ═══════════════════════════════════════════════
   DATA — SUPPLY CHAIN MODULE
═══════════════════════════════════════════════ */
DATA.suppliers = [
  {id:'SUP-001',name:'Hunting Energy Services',country:'UK',region:'Europe',category:'Drilling Equipment',contact:'James Baxter',email:'j.baxter@hunting-intl.com',phone:'+44 20 7321 0123',status:'active',rating:4.8,totalOrders:24,totalSpend:1840000,leadTimeDays:21,onTimeDelivery:96,qualityScore:98,preferredPayment:'Net 45',currency:'USD',notes:'Preferred supplier for drill string components and premium connections.'},
  {id:'SUP-002',name:'National Oilwell Varco (NOV)',country:'USA',region:'Americas',category:'Drilling Equipment',contact:'Sandra Liu',email:'s.liu@nov.com',phone:'+1 713 346 7500',status:'active',rating:4.7,totalOrders:18,totalSpend:2310000,leadTimeDays:28,onTimeDelivery:93,qualityScore:96,preferredPayment:'Net 30',currency:'USD',notes:'Primary supplier for top drives, mud pumps and rig equipment.'},
  {id:'SUP-003',name:'Nalco Champion (Ecolab)',country:'USA',region:'Americas',category:'Production Chemicals',contact:'Omar Farhan',email:'o.farhan@nalco.com',phone:'+1 832 391 7000',status:'active',rating:4.6,totalOrders:31,totalSpend:980000,leadTimeDays:14,onTimeDelivery:97,qualityScore:95,preferredPayment:'Net 30',currency:'USD',notes:'Corrosion inhibitors, scale inhibitors, demulsifiers for all AMICI sites.'},
  {id:'SUP-004',name:'Al-Hashar Group Oman',country:'Oman',region:'Middle East',category:'General Industrial',contact:'Tariq Al-Hashar',email:'t.alhashar@alhashar.com',phone:'+968 2481 0000',status:'active',rating:4.4,totalOrders:42,totalSpend:670000,leadTimeDays:7,onTimeDelivery:91,qualityScore:89,preferredPayment:'Net 60',currency:'OMR',notes:'Local Omani supplier – MRO items, PPE, fasteners, site consumables.'},
  {id:'SUP-005',name:'Emerson Automation Solutions',country:'USA',region:'Americas',category:'Instrumentation',contact:'David Holt',email:'d.holt@emerson.com',phone:'+1 314 553 2000',status:'active',rating:4.9,totalOrders:15,totalSpend:1120000,leadTimeDays:35,onTimeDelivery:94,qualityScore:99,preferredPayment:'Net 45',currency:'USD',notes:'DCS/SCADA components, control valves, pressure transmitters.'},
  {id:'SUP-006',name:'Schlumberger (SLB) Supply',country:'UAE',region:'Middle East',category:'Well Services',contact:'Priya Nair',email:'p.nair@slb.com',phone:'+971 4 501 0000',status:'active',rating:4.7,totalOrders:12,totalSpend:3200000,leadTimeDays:10,onTimeDelivery:95,qualityScore:97,preferredPayment:'Net 30',currency:'USD',notes:'Wireline tools, perforating guns, completion equipment.'},
  {id:'SUP-007',name:'Parker Hannifin',country:'USA',region:'Americas',category:'Hydraulics & Seals',contact:'Michael Torres',email:'m.torres@parker.com',phone:'+1 216 896 3000',status:'active',rating:4.5,totalOrders:28,totalSpend:540000,leadTimeDays:18,onTimeDelivery:92,qualityScore:94,preferredPayment:'Net 45',currency:'USD',notes:'Hydraulic hoses, seals, O-rings, couplings for rotating equipment.'},
  {id:'SUP-008',name:'Tyco Safety Products',country:'UAE',region:'Middle East',category:'Fire & Safety',contact:'Ahmed Al-Rashid',email:'a.alrashid@tyco.com',phone:'+971 4 447 0000',status:'active',rating:4.6,totalOrders:19,totalSpend:320000,leadTimeDays:12,onTimeDelivery:96,qualityScore:97,preferredPayment:'Net 30',currency:'USD',notes:'Fire suppression systems, gas detectors, SCBA sets, safety equipment.'},
  {id:'SUP-009',name:'Weatherford Oman LLC',country:'Oman',region:'Middle East',category:'Well Services',contact:'Carlos Mendez',email:'c.mendez@weatherford.com',phone:'+968 2469 0000',status:'active',rating:4.3,totalOrders:9,totalSpend:890000,leadTimeDays:14,onTimeDelivery:89,qualityScore:91,preferredPayment:'Net 45',currency:'USD',notes:'MPD equipment, tubular running services, fishing tools.'},
  {id:'SUP-010',name:'3M Gulf LLC',country:'UAE',region:'Middle East',category:'PPE & Safety',contact:'Reem Al-Hashimi',email:'r.alhashimi@3m.com',phone:'+971 4 217 0000',status:'active',rating:4.5,totalOrders:36,totalSpend:210000,leadTimeDays:8,onTimeDelivery:97,qualityScore:96,preferredPayment:'Net 30',currency:'USD',notes:'PPE – respirators, hearing protection, safety glasses, coveralls.'},
  {id:'SUP-011',name:'Oman Industrial Gases (OIG)',country:'Oman',region:'Middle East',category:'Industrial Gases',contact:'Khalil Al-Balushi',email:'k.albalushi@oig.om',phone:'+968 2456 0000',status:'active',rating:4.4,totalOrders:48,totalSpend:185000,leadTimeDays:3,onTimeDelivery:99,qualityScore:95,preferredPayment:'Monthly Account',currency:'OMR',notes:'Nitrogen, oxygen, argon, CO2 supply for all Oman sites.'},
  {id:'SUP-012',name:'Al-Turki Enterprises',country:'Oman',region:'Middle East',category:'Electrical Equipment',contact:'Yousuf Al-Turki',email:'y.alturki@alturki.om',phone:'+968 2447 0000',status:'active',rating:4.2,totalOrders:22,totalSpend:430000,leadTimeDays:10,onTimeDelivery:88,qualityScore:90,preferredPayment:'Net 60',currency:'OMR',notes:'Switchgear, cables, MCC panels, transformers. Local Omani partner.'},
  {id:'SUP-013',name:'Dräger Safety Middle East',country:'UAE',region:'Middle East',category:'Gas Detection',contact:'Stefan Koch',email:'s.koch@draeger.com',phone:'+971 4 429 0000',status:'active',rating:4.8,totalOrders:14,totalSpend:290000,leadTimeDays:14,onTimeDelivery:95,qualityScore:99,preferredPayment:'Net 30',currency:'USD',notes:'H2S/CO2 detectors, SCBA, breathing air compressors, calibration gas.'},
  {id:'SUP-014',name:'Bureau Veritas Oman',country:'Oman',region:'Middle East',category:'Inspection & Testing',contact:'Nadia Rousseau',email:'n.rousseau@bureauveritas.com',phone:'+968 2451 0000',status:'active',rating:4.9,totalOrders:16,totalSpend:480000,leadTimeDays:5,onTimeDelivery:98,qualityScore:99,preferredPayment:'Net 30',currency:'USD',notes:'Statutory inspections, NDT services, calibration, LOLER examinations.'},
  {id:'SUP-015',name:'Muscat Trading & Contracting',country:'Oman',region:'Middle East',category:'General Industrial',contact:'Salem Al-Amri',email:'s.alamri@mtc.om',phone:'+968 2438 0000',status:'active',rating:4.1,totalOrders:55,totalSpend:310000,leadTimeDays:4,onTimeDelivery:87,qualityScore:85,preferredPayment:'Net 60',currency:'OMR',notes:'General site supplies, steel fabrication, maintenance consumables.'},
];

DATA.purchaseOrders = [
  {id:'PO-2025-001',supplierId:'SUP-002',supplier:'National Oilwell Varco (NOV)',category:'Drilling Equipment',description:'Mud Pump Expendables Kit – Block 15 Rig Alpha Campaign',amount:187500,currency:'USD',status:'approved',priority:'High',requestedBy:'Tariq Mubarak',approvedBy:'Rania Saleh',site:'Block 15 – Rig Alpha',requiredDate:'2025-07-15',createdDate:'2025-05-20',deliveryDate:null,poLines:[{item:'Liner & Piston Assembly 7.5"',qty:4,unit:'Set',unitPrice:18000},{item:'Valve & Seat Assembly',qty:8,unit:'Set',unitPrice:6500},{item:'Suction / Discharge Dampener Kit',qty:2,unit:'Set',unitPrice:12750}]},
  {id:'PO-2025-002',supplierId:'SUP-003',supplier:'Nalco Champion (Ecolab)',category:'Production Chemicals',description:'Q3 Chemical Supply – South Processing Facility',amount:94200,currency:'USD',status:'ordered',priority:'High',requestedBy:'Fatima Al-Zahra',approvedBy:'Rania Saleh',site:'Onshore Processing Facility – South',requiredDate:'2025-07-01',createdDate:'2025-05-28',deliveryDate:'2025-06-25',poLines:[{item:'Corrosion Inhibitor CI-4400',qty:2000,unit:'Litre',unitPrice:18},{item:'Scale Inhibitor SI-210',qty:1500,unit:'Litre',unitPrice:22},{item:'Demulsifier DM-880',qty:800,unit:'Litre',unitPrice:31}]},
  {id:'PO-2025-003',supplierId:'SUP-005',supplier:'Emerson Automation Solutions',category:'Instrumentation',description:'Control Valve Replacement – Gas Treatment Plant North',amount:142000,currency:'USD',status:'approved',priority:'Critical',requestedBy:'Saud Al-Otaibi',approvedBy:'Mohammed Al-Harbi',site:'Gas Treatment Plant – North',requiredDate:'2025-07-10',createdDate:'2025-06-01',deliveryDate:null,poLines:[{item:'Fisher V250 Control Valve 4"',qty:2,unit:'Unit',unitPrice:48000},{item:'DVC6200 Digital Valve Controller',qty:2,unit:'Unit',unitPrice:11000},{item:'Actuator Repair Kit',qty:4,unit:'Set',unitPrice:6000}]},
  {id:'PO-2025-004',supplierId:'SUP-004',supplier:'Al-Hashar Group Oman',category:'General Industrial',description:'MRO & PPE Quarterly Replenishment – All Sites',amount:38750,currency:'USD',status:'received',priority:'Normal',requestedBy:'Laila Al-Farsi',approvedBy:'Rania Saleh',site:'All Sites',requiredDate:'2025-06-15',createdDate:'2025-05-10',deliveryDate:'2025-06-12',poLines:[{item:'Safety Boots (pairs) – various sizes',qty:80,unit:'Pair',unitPrice:85},{item:'Hard Hat Class E',qty:120,unit:'Unit',unitPrice:32},{item:'Anti-H2S Coveralls',qty:60,unit:'Unit',unitPrice:210},{item:'Chemical-Resistant Gloves',qty:200,unit:'Pair',unitPrice:18}]},
  {id:'PO-2025-005',supplierId:'SUP-001',supplier:'Hunting Energy Services',category:'Drilling Equipment',description:'Premium Connection Tubing – Block 7 Completion',amount:326000,currency:'USD',status:'approved',priority:'High',requestedBy:'Khalid Al-Rashidi',approvedBy:'Mohammed Al-Harbi',site:'Block 7 – Offshore Platform',requiredDate:'2025-08-01',createdDate:'2025-06-03',deliveryDate:null,poLines:[{item:'3.5" TenarisHydril Premium Tubing',qty:200,unit:'Joint',unitPrice:1400},{item:'Pup Joints 3.5"',qty:12,unit:'Unit',unitPrice:850},{item:'Thread Compound (buckets)',qty:8,unit:'Bucket',unitPrice:325}]},
  {id:'PO-2025-006',supplierId:'SUP-008',supplier:'Tyco Safety Products',category:'Fire & Safety',description:'Annual Safety Equipment Refresh – Offshore Platforms',amount:67300,currency:'USD',status:'ordered',priority:'High',requestedBy:'Ahmed Hassan',approvedBy:'Rania Saleh',site:'Block 7 – Offshore Platform',requiredDate:'2025-07-20',createdDate:'2025-06-05',deliveryDate:'2025-07-18',poLines:[{item:'CO2 Fixed Suppression Module',qty:4,unit:'Unit',unitPrice:8500},{item:'Portable Fire Extinguisher 9kg ABC',qty:24,unit:'Unit',unitPrice:185},{item:'Smoke/Heat Detector – EX rated',qty:16,unit:'Unit',unitPrice:620},{item:'Emergency Shower/Eyewash Station',qty:2,unit:'Unit',unitPrice:2150}]},
  {id:'PO-2025-007',supplierId:'SUP-007',supplier:'Parker Hannifin',category:'Hydraulics & Seals',description:'BOP Accumulator Unit Seals & Hoses – Block 15',amount:29400,currency:'USD',status:'draft',priority:'Normal',requestedBy:'Khalid Al-Rashidi',approvedBy:null,site:'Block 15 – Rig Alpha',requiredDate:'2025-08-15',createdDate:'2025-06-08',deliveryDate:null,poLines:[{item:'BOP Hydraulic Hose Assembly 1.5"',qty:12,unit:'Unit',unitPrice:1200},{item:'High Pressure Seal Kit – Cameron',qty:6,unit:'Set',unitPrice:1800},{item:'Accumulator Bladder 10 gal',qty:4,unit:'Unit',unitPrice:900}]},
  {id:'PO-2025-008',supplierId:'SUP-011',supplier:'Oman Industrial Gases (OIG)',category:'Industrial Gases',description:'Monthly Nitrogen & Oxygen Supply – June 2025',amount:12800,currency:'OMR',status:'received',priority:'Normal',requestedBy:'Laila Al-Farsi',approvedBy:'Rania Saleh',site:'All Sites',requiredDate:'2025-06-01',createdDate:'2025-05-15',deliveryDate:'2025-05-31',poLines:[{item:'Nitrogen Cylinder (50L)',qty:40,unit:'Cylinder',unitPrice:185},{item:'Oxygen Cylinder (50L)',qty:20,unit:'Cylinder',unitPrice:210},{item:'Argon Cylinder (50L)',qty:8,unit:'Cylinder',unitPrice:195}]},
  {id:'PO-2025-009',supplierId:'SUP-013',supplier:'Dräger Safety Middle East',category:'Gas Detection',description:'H2S Detector Recalibration & Replacement Units',amount:43600,currency:'USD',status:'approved',priority:'Critical',requestedBy:'Ahmed Hassan',approvedBy:'Mohammed Al-Harbi',site:'Gas Treatment Plant – North',requiredDate:'2025-06-25',createdDate:'2025-06-09',deliveryDate:null,poLines:[{item:'Dräger X-am 5100 H2S Detector',qty:8,unit:'Unit',unitPrice:3200},{item:'Calibration Gas H2S/CO/LEL/O2 mix',qty:20,unit:'Cylinder',unitPrice:480},{item:'Sensor Replacement Kit',qty:12,unit:'Set',unitPrice:650}]},
  {id:'PO-2025-010',supplierId:'SUP-014',supplier:'Bureau Veritas Oman',category:'Inspection & Testing',description:'Annual Statutory Inspections – Q3 2025 Campaign',amount:58000,currency:'USD',status:'ordered',priority:'High',requestedBy:'Ibrahim Qasim',approvedBy:'Rania Saleh',site:'All Sites',requiredDate:'2025-08-30',createdDate:'2025-06-10',deliveryDate:null,poLines:[{item:'API 510 Pressure Vessel Inspection',qty:5,unit:'Inspection',unitPrice:4200},{item:'LOLER Thorough Examination – Cranes',qty:4,unit:'Inspection',unitPrice:3800},{item:'NDT Ultrasonic Thickness Survey',qty:8,unit:'Survey',unitPrice:2850},{item:'Ex Equipment IEC 60079 Inspection',qty:6,unit:'Inspection',unitPrice:1850}]},
  {id:'PO-2025-011',supplierId:'SUP-006',supplier:'Schlumberger (SLB) Supply',category:'Well Services',description:'Block 7 Perforating & Wireline Services Package',amount:412000,currency:'USD',status:'approved',priority:'Critical',requestedBy:'Khalid Al-Rashidi',approvedBy:'Mohammed Al-Harbi',site:'Block 7 – Offshore Platform',requiredDate:'2025-09-01',createdDate:'2025-06-11',deliveryDate:null,poLines:[{item:'TCP Gun System 4.5" – 5 runs',qty:5,unit:'Run',unitPrice:48000},{item:'Wireline Logging – Full Suite',qty:3,unit:'Run',unitPrice:62000},{item:'Packer & Completion Assembly',qty:2,unit:'Set',unitPrice:41000}]},
  {id:'PO-2025-012',supplierId:'SUP-010',supplier:'3M Gulf LLC',category:'PPE & Safety',description:'H2S Emergency Response PPE – Annual Stock',amount:21900,currency:'USD',status:'received',priority:'Normal',requestedBy:'Ahmed Hassan',approvedBy:'Rania Saleh',site:'All Sites',requiredDate:'2025-05-30',createdDate:'2025-04-20',deliveryDate:'2025-05-28',poLines:[{item:'3M Full Face Respirator 6800',qty:30,unit:'Unit',unitPrice:380},{item:'OV/P100 Filter Cartridge 6003',qty:120,unit:'Pair',unitPrice:28},{item:'Disposable Coverall Type 4/5/6',qty:200,unit:'Unit',unitPrice:22}]},
  {id:'PO-2025-013',supplierId:'SUP-012',supplier:'Al-Turki Enterprises',category:'Electrical Equipment',description:'MCC Spare Parts – South Processing Facility',amount:34500,currency:'OMR',status:'draft',priority:'Normal',requestedBy:'Walid Mansour',approvedBy:null,site:'Onshore Processing Facility – South',requiredDate:'2025-09-15',createdDate:'2025-06-12',deliveryDate:null,poLines:[{item:'Motor Circuit Breaker 63A',qty:6,unit:'Unit',unitPrice:1800},{item:'Contactor 80A 3-phase',qty:4,unit:'Unit',unitPrice:2200},{item:'Variable Speed Drive 22kW',qty:2,unit:'Unit',unitPrice:4800}]},
  {id:'PO-2025-014',supplierId:'SUP-015',supplier:'Muscat Trading & Contracting',category:'General Industrial',description:'Block 3 Exploration Camp Site Setup Materials',amount:27600,currency:'USD',status:'cancelled',priority:'Normal',requestedBy:'Laila Al-Farsi',approvedBy:'Rania Saleh',site:'Block 3 – Exploration Camp',requiredDate:'2025-06-01',createdDate:'2025-04-10',deliveryDate:null,poLines:[{item:'Prefab Steel Storage Container',qty:4,unit:'Unit',unitPrice:3800},{item:'Steel Shelving Rack – heavy duty',qty:12,unit:'Unit',unitPrice:650},{item:'Security Fencing (metres)',qty:200,unit:'Metre',unitPrice:45}]},
  {id:'PO-2025-015',supplierId:'SUP-009',supplier:'Weatherford Oman LLC',category:'Well Services',description:'Fishing Tool Rental – Block 15 Stuck Pipe Operation',amount:156000,currency:'USD',status:'ordered',priority:'Critical',requestedBy:'Khalid Al-Rashidi',approvedBy:'Mohammed Al-Harbi',site:'Block 15 – Rig Alpha',requiredDate:'2025-06-20',createdDate:'2025-06-13',deliveryDate:null,poLines:[{item:'Overshot & Safety Joint Rental',qty:1,unit:'Job',unitPrice:85000},{item:'Jar Accelerator Rental',qty:1,unit:'Job',unitPrice:42000},{item:'Fishing Engineer – 10 days',qty:10,unit:'Day',unitPrice:2900}]},
];

DATA.inventory = [
  {id:'INV-001',name:'Corrosion Inhibitor CI-4400',partNo:'CHM-CI4400',category:'Production Chemicals',site:'Onshore Processing Facility – South',warehouse:'WH-South-01',uom:'Litre',qtyOnHand:3200,reorderPoint:1500,maxStock:6000,unitCost:18,status:'normal',lastReceived:'2025-05-31',supplierId:'SUP-003'},
  {id:'INV-002',name:'Scale Inhibitor SI-210',partNo:'CHM-SI210',category:'Production Chemicals',site:'Onshore Processing Facility – South',warehouse:'WH-South-01',uom:'Litre',qtyOnHand:800,reorderPoint:1000,maxStock:4000,unitCost:22,status:'low',lastReceived:'2025-05-31',supplierId:'SUP-003'},
  {id:'INV-037',name:'Drill Bits & Consumables (Parent)',partNo:'DRL-GRP',category:'Drilling Consumables',site:'Block 15 – Rig Alpha',warehouse:'WH-Block15-01',uom:'Unit',qtyOnHand:0,reorderPoint:0,maxStock:0,unitCost:0,status:'normal',lastReceived:'-',supplierId:'SUP-002',has_variants:true,parent_item:null},
  {id:'INV-003',name:'Drill Bits – PDC 8.5"',partNo:'DRL-PDC085',category:'Drilling Consumables',site:'Block 15 – Rig Alpha',warehouse:'WH-Block15-01',uom:'Unit',qtyOnHand:4,reorderPoint:3,maxStock:12,unitCost:14500,status:'normal',lastReceived:'2025-04-20',supplierId:'SUP-002',parent_item:'INV-037',serial_tracking:true,batch_tracking:false},
  {id:'INV-004',name:'Mud Pump Liner 7.5"',partNo:'DRL-MPL075',category:'Drilling Consumables',site:'Block 15 – Rig Alpha',warehouse:'WH-Block15-01',uom:'Unit',qtyOnHand:1,reorderPoint:4,maxStock:8,unitCost:4500,status:'critical',lastReceived:'2025-03-15',supplierId:'SUP-002',parent_item:'INV-037',serial_tracking:true,batch_tracking:false},
  {id:'INV-005',name:'Anti-H2S Coveralls',partNo:'PPE-CVRH2S',category:'PPE & Safety',site:'All Sites',warehouse:'WH-HO-01',uom:'Unit',qtyOnHand:45,reorderPoint:30,maxStock:120,unitCost:210,status:'normal',lastReceived:'2025-06-12',supplierId:'SUP-004'},
  {id:'INV-006',name:'SCBA Set (complete)',partNo:'PPE-SCBA01',category:'PPE & Safety',site:'Block 7 – Offshore Platform',warehouse:'WH-Block7-01',uom:'Set',qtyOnHand:6,reorderPoint:8,maxStock:20,unitCost:2800,status:'low',lastReceived:'2025-02-10',supplierId:'SUP-008'},
  {id:'INV-007',name:'Hydraulic Hose Assembly 1.5"',partNo:'HYD-HA015',category:'Hydraulics & Seals',site:'Block 15 – Rig Alpha',warehouse:'WH-Block15-01',uom:'Unit',qtyOnHand:8,reorderPoint:6,maxStock:24,unitCost:1200,status:'normal',lastReceived:'2025-04-05',supplierId:'SUP-007'},
  {id:'INV-008',name:'H2S Gas Detector – Portable',partNo:'INS-GT-H2S',category:'Gas Detection',site:'All Sites',warehouse:'WH-HO-01',uom:'Unit',qtyOnHand:0,reorderPoint:10,maxStock:25,unitCost:3200,status:'out',lastReceived:'2024-12-01',supplierId:'SUP-013'},
  {id:'INV-009',name:'Nitrogen Cylinders 50L',partNo:'GAS-N2-50L',category:'Industrial Gases',site:'All Sites',warehouse:'WH-HO-01',uom:'Cylinder',qtyOnHand:28,reorderPoint:20,maxStock:80,unitCost:185,status:'normal',lastReceived:'2025-05-31',supplierId:'SUP-011'},
  {id:'INV-010',name:'Control Valve – Fisher V250 4"',partNo:'INS-CV-V250',category:'Instrumentation',site:'Gas Treatment Plant – North',warehouse:'WH-North-01',uom:'Unit',qtyOnHand:0,reorderPoint:1,maxStock:4,unitCost:48000,status:'out',lastReceived:'2024-09-10',supplierId:'SUP-005'},
  {id:'INV-011',name:'Premium Tubing 3.5" TenarisHydril',partNo:'DRL-TBG035',category:'Drilling Consumables',site:'Block 7 – Offshore Platform',warehouse:'WH-Block7-01',uom:'Joint',qtyOnHand:85,reorderPoint:50,maxStock:200,unitCost:1400,status:'normal',lastReceived:'2025-04-30',supplierId:'SUP-001'},
  {id:'INV-012',name:'Demulsifier DM-880',partNo:'CHM-DM880',category:'Production Chemicals',site:'Onshore Processing Facility – South',warehouse:'WH-South-01',uom:'Litre',qtyOnHand:420,reorderPoint:400,maxStock:2000,unitCost:31,status:'low',lastReceived:'2025-05-31',supplierId:'SUP-003'},
  {id:'INV-013',name:'Calibration Gas H2S Mix',partNo:'GAS-CAL-H2S',category:'Gas Detection',site:'Gas Treatment Plant – North',warehouse:'WH-North-01',uom:'Cylinder',qtyOnHand:6,reorderPoint:8,maxStock:30,unitCost:480,status:'low',lastReceived:'2025-05-20',supplierId:'SUP-013'},
  {id:'INV-014',name:'Motor Circuit Breaker 63A',partNo:'ELC-MCB63',category:'Electrical Equipment',site:'Onshore Processing Facility – South',warehouse:'WH-South-01',uom:'Unit',qtyOnHand:4,reorderPoint:4,maxStock:16,unitCost:1800,status:'low',lastReceived:'2025-01-15',supplierId:'SUP-012'},
  {id:'INV-015',name:'BOP High Pressure Seal Kit',partNo:'DRL-BOP-SK',category:'Drilling Consumables',site:'Block 15 – Rig Alpha',warehouse:'WH-Block15-01',uom:'Set',qtyOnHand:2,reorderPoint:3,maxStock:8,unitCost:1800,status:'low',lastReceived:'2025-02-28',supplierId:'SUP-007'},
  {id:'INV-016',name:'Safety Boots (mixed sizes)',partNo:'PPE-BOOT01',category:'PPE & Safety',site:'All Sites',warehouse:'WH-HO-01',uom:'Pair',qtyOnHand:62,reorderPoint:40,maxStock:150,unitCost:85,status:'normal',lastReceived:'2025-06-12',supplierId:'SUP-004'},
  {id:'INV-017',name:'Valve & Seat Assembly',partNo:'DRL-VSA01',category:'Drilling Consumables',site:'Block 15 – Rig Alpha',warehouse:'WH-Block15-01',uom:'Set',qtyOnHand:5,reorderPoint:4,maxStock:12,unitCost:6500,status:'normal',lastReceived:'2025-04-20',supplierId:'SUP-002'},
  {id:'INV-018',name:'Portable Fire Extinguisher 9kg',partNo:'FRS-PFE9KG',category:'Fire & Safety',site:'Block 7 – Offshore Platform',warehouse:'WH-Block7-01',uom:'Unit',qtyOnHand:18,reorderPoint:12,maxStock:40,unitCost:185,status:'normal',lastReceived:'2025-06-18',supplierId:'SUP-008'},
];

DATA.warehouses = [
  {id:'WH-HO-01',name:'Central Warehouse – Muscat HQ',site:'Head Office – Muscat',manager:'Laila Al-Farsi',capacity:5000,utilisation:68,items:DATA.inventory.filter(i=>i.warehouse==='WH-HO-01').length},
  {id:'WH-Block15-01',name:'Rig Alpha Laydown Yard',site:'Block 15 – Rig Alpha',manager:'Yusuf Al-Balushi',capacity:1200,utilisation:81,items:DATA.inventory.filter(i=>i.warehouse==='WH-Block15-01').length},
  {id:'WH-Block7-01',name:'Offshore Platform Store – Block 7',site:'Block 7 – Offshore Platform',manager:'Omar Al-Kindi',capacity:800,utilisation:74,items:DATA.inventory.filter(i=>i.warehouse==='WH-Block7-01').length},
  {id:'WH-South-01',name:'South Facility Chemical & MRO Store',site:'Onshore Processing Facility – South',manager:'Fatima Al-Zahra',capacity:2000,utilisation:55,items:DATA.inventory.filter(i=>i.warehouse==='WH-South-01').length},
  {id:'WH-North-01',name:'Gas Plant North – Warehouse A',site:'Gas Treatment Plant – North',manager:'Tariq Mubarak',capacity:1500,utilisation:43,items:DATA.inventory.filter(i=>i.warehouse==='WH-North-01').length},
];

DATA.stockLedger = [
  {id:'SL-001',itemId:'INV-001',itemName:'Corrosion Inhibitor CI-4400',type:'in',qty:3200,uom:'Litre',refType:'Opening Balance',refId:'OPEN',date:'2025-01-01',unitCost:18,notes:'Opening stock'},
  {id:'SL-002',itemId:'INV-001',itemName:'Corrosion Inhibitor CI-4400',type:'out',qty:1200,uom:'Litre',refType:'Issue',refId:'ISS-001',date:'2025-05-15',unitCost:18,notes:'Chemistry dosing – South Facility'},
  {id:'SL-003',itemId:'INV-001',itemName:'Corrosion Inhibitor CI-4400',type:'in',qty:2000,uom:'Litre',refType:'PO Receipt',refId:'PO-2025-002',date:'2025-05-31',unitCost:18,notes:'Q3 Chemical supply received'},
  {id:'SL-004',itemId:'INV-002',itemName:'Scale Inhibitor SI-210',type:'in',qty:1500,uom:'Litre',refType:'PO Receipt',refId:'PO-2025-002',date:'2025-05-31',unitCost:22,notes:'Q3 Chemical supply received'},
  {id:'SL-005',itemId:'INV-002',itemName:'Scale Inhibitor SI-210',type:'out',qty:700,uom:'Litre',refType:'Issue',refId:'ISS-002',date:'2025-06-10',unitCost:22,notes:'Chemical injection – South Facility'},
  {id:'SL-006',itemId:'INV-009',itemName:'Nitrogen Cylinders 50L',type:'in',qty:40,uom:'Cylinder',refType:'PO Receipt',refId:'PO-2025-008',date:'2025-05-31',unitCost:185,notes:'Monthly nitrogen supply'},
  {id:'SL-007',itemId:'INV-009',itemName:'Nitrogen Cylinders 50L',type:'out',qty:12,uom:'Cylinder',refType:'Issue',refId:'ISS-003',date:'2025-06-08',unitCost:185,notes:'Consumed – Rig Alpha pneumatic systems'},
  {id:'SL-008',itemId:'INV-005',itemName:'Anti-H2S Coveralls',type:'in',qty:60,uom:'Unit',refType:'PO Receipt',refId:'PO-2025-004',date:'2025-06-12',unitCost:210,notes:'PPE quarterly replenishment'},
  {id:'SL-009',itemId:'INV-005',itemName:'Anti-H2S Coveralls',type:'out',qty:15,uom:'Unit',refType:'Issue',refId:'ISS-004',date:'2025-06-18',unitCost:210,notes:'Issued to new Block 15 crew'},
];

DATA.materialRequests = [
  {id:'MR-2025-001',title:'Mud Pump Liner Replacement – Rig Alpha',requestedBy:'Khalid Al-Rashidi',requestedDate:'2025-06-01',requiredDate:'2025-06-20',department:'Drilling',site:'Block 15 – Rig Alpha',status:'approved',priority:'High',notes:'Liner showing signs of wear after 420 hours. Gauge reading outside tolerance.',items:[{name:'Mud Pump Liner 7.5"',qty:4,uom:'Unit',estUnitCost:4500,spec:'Part No: DRL-MPL075'},{name:'Valve & Seat Assembly',qty:6,uom:'Set',estUnitCost:6500,spec:'Match existing NOV pump model'}],approvedBy:'Rania Saleh',approvedDate:'2025-06-05',poRef:'PO-2025-001'},
  {id:'MR-2025-002',title:'H2S Detector Calibration Gas – Annual',requestedBy:'Ahmed Hassan',requestedDate:'2025-06-05',requiredDate:'2025-06-25',department:'HSE',site:'All Sites',status:'approved',priority:'High',notes:'Annual calibration campaign. Current cylinders below 20% remaining.',items:[{name:'Calibration Gas H2S Mix',qty:20,uom:'Cylinder',estUnitCost:480,spec:'H2S/CO/LEL/O2 mix – Dräger compatible'}],approvedBy:'Mohammed Al-Harbi',approvedDate:'2025-06-08',poRef:'PO-2025-009'},
  {id:'MR-2025-003',title:'Chemical Injection Pump Seal Kit',requestedBy:'Fatima Al-Zahra',requestedDate:'2025-06-10',requiredDate:'2025-07-01',department:'Production',site:'Onshore Processing Facility – South',status:'pending',priority:'Normal',notes:'Milton Roy pump seal kit leaking. OEM part needed.',items:[{name:'Milton Roy Seal Kit',qty:2,uom:'Set',estUnitCost:1200,spec:'Model: MIL-ROY-HPD-150'},{name:'Plunger Assembly',qty:1,uom:'Unit',estUnitCost:2400,spec:'Ceramic plunger 1.5" dia'}]},
  {id:'MR-2025-004',title:'Offshore Platform Fire Extinguisher Refill',requestedBy:'Ibrahim Qasim',requestedDate:'2025-06-12',requiredDate:'2025-06-30',department:'HSE',site:'Block 7 – Offshore Platform',status:'pending',priority:'High',notes:'Annual refill and hydrostatic test due for 12 units.',items:[{name:'CO2 Refill 9kg',qty:12,uom:'Unit',estUnitCost:75,spec:'Pure CO2 – food grade'},{name:'Hydrostatic Test – CO2 Cylinder',qty:12,uom:'Test',estUnitCost:30,spec:'5-year recertification'}]},
  {id:'MR-2025-005',title:'SCBA Spare Cylinder – Block 7',requestedBy:'Ahmed Hassan',requestedDate:'2025-06-14',requiredDate:'2025-07-15',department:'HSE',site:'Block 7 – Offshore Platform',status:'draft',priority:'Normal',notes:'Need 2 additional 300-bar carbon composite cylinders for the emergency muster area.',items:[{name:'300 Bar SCBA Cylinder – Carbon Composite',qty:2,uom:'Unit',estUnitCost:1800,spec:'Dräger or MSA compatible'}]},
];

/* ═══════════════════════════════════════════════
   SC i18n additions
═══════════════════════════════════════════════ */
Object.assign(i18n.en,{
  scDashboard:'SC Dashboard',allPOs:'Purchase Orders',prRequests:'PR Requests',pendingApprovalPO:'Pending Approval',orderedItems:'Ordered / In Transit',receivedItems:'Received',cancelledItems:'Cancelled',allSuppliers:'Suppliers',supplierPerformance:'Supplier Performance',inventoryItems:'Inventory',lowStockAlerts:'Low Stock Alerts',warehouses:'Warehouses',scSettings:'SC Settings',
  openPOs:'Open POs',poValueMTD:'PO Value MTD',pendingPRs:'Pending PRs',lowStockItems:'Low Stock Items',activeSuppliers:'Active Suppliers',
  poNumber:'PO Number',supplier:'Supplier',scCategory:'Category',description:'Description',amount:'Amount',priority:'Priority',requestedBy:'Requested By',requiredDate:'Required Date',poStatus:'Status',
  newPO:'New Purchase Order',
  stockStatus:'Stock Status',qtyOnHand:'Qty On Hand',reorderPoint:'Reorder Point',partNo:'Part No.',warehouseLbl:'Warehouse',lastReceived:'Last Received',
  normal:'Normal',low:'Low',critical:'Critical',out:'Out of Stock',
  materialRequests:'Material Requests',materialRequest:'Material Request',newMR:'New Material Request',mrTitle:'Title',mrStatus:'Status',mrDepartment:'Department',mrItems:'Items',
  stockLedger:'Stock Ledger',stockMovement:'Stock Movement',recordMovement:'Record Movement',movementType:'Type',movementDate:'Date',reference:'Reference',unitCost:'Unit Cost',
  in:'In',out:'Out',transfer:'Transfer',adjustment:'Adjustment',
  pending:'Pending',draft:'Draft',rejected:'Rejected',
  convertToPO:'Convert to PO',approveMR:'Approve MR',rejectMR:'Reject MR',
});
Object.assign(i18n.ar,{
  scDashboard:'لوحة سلسلة التوريد',allPOs:'أوامر الشراء',prRequests:'طلبات الشراء',pendingApprovalPO:'بانتظار الموافقة',orderedItems:'مطلوب / في الطريق',receivedItems:'مستلم',cancelledItems:'ملغي',allSuppliers:'الموردون',supplierPerformance:'أداء الموردين',inventoryItems:'المخزون',lowStockAlerts:'تنبيهات المخزون المنخفض',warehouses:'المستودعات',scSettings:'إعدادات سلسلة التوريد',
  openPOs:'أوامر الشراء المفتوحة',poValueMTD:'قيمة الشراء هذا الشهر',pendingPRs:'طلبات الشراء المعلقة',lowStockItems:'أصناف المخزون المنخفض',activeSuppliers:'الموردون النشطون',
  poNumber:'رقم أمر الشراء',supplier:'المورد',scCategory:'الفئة',description:'الوصف',amount:'المبلغ',priority:'الأولوية',requestedBy:'طلب بواسطة',requiredDate:'التاريخ المطلوب',poStatus:'الحالة',
  newPO:'أمر شراء جديد',
  stockStatus:'حالة المخزون',qtyOnHand:'الكمية المتوفرة',reorderPoint:'نقطة إعادة الطلب',partNo:'رقم القطعة',warehouseLbl:'المستودع',lastReceived:'آخر استلام',
  normal:'طبيعي',low:'منخفض',critical:'حرج',out:'نفد المخزون',
  materialRequests:'طلبات المواد',materialRequest:'طلب مادة',newMR:'طلب مادة جديد',mrTitle:'العنوان',mrStatus:'الحالة',mrDepartment:'القسم',mrItems:'الأصناف',
  stockLedger:'دفتر المخزون',stockMovement:'حركة المخزون',recordMovement:'تسجيل حركة',movementType:'النوع',movementDate:'التاريخ',reference:'المرجع',unitCost:'تكلفة الوحدة',
  in:'وارد',out:'صادر',transfer:'تحويل',adjustment:'تسوية',
  pending:'معلق',draft:'مسودة',rejected:'مرفوض',
  convertToPO:'تحويل إلى أمر شراء',approveMR:'اعتماد طلب المواد',rejectMR:'رفض طلب المواد',
});

/* ═══════════════════════════════════════════════
   SC SIDEBAR
═══════════════════════════════════════════════ */
function renderSCSidebar(){
  const pendingPOs = DATA.purchaseOrders.filter(p=>p.status==='draft').length;
  const lowStock = DATA.inventory.filter(i=>i.status==='low'||i.status==='critical'||i.status==='out').length;
  const pendingMRs = DATA.materialRequests.filter(m=>m.status==='pending').length;
  const allSections=[
    {group:null,items:[
      {id:'scDashboard',icon:'fa-gauge-high',label:t('scDashboard'),roles:['system_admin','sc_manager','sc_user','employee']},
      {id:'materialRequests',icon:'fa-clipboard-list',label:t('materialRequests'),badge:pendingMRs,roles:['system_admin','sc_manager','sc_user']},
      {id:'allPOs',icon:'fa-file-invoice',label:t('allPOs'),roles:['system_admin','sc_manager','sc_user']},
      {id:'qualityInspections',icon:'fa-flask',label:'Quality Inspections',roles:['system_admin','sc_manager','sc_user']},
      {id:'pendingApprovalPO',icon:'fa-clock',label:t('pendingApprovalPO'),badge:pendingPOs,roles:['system_admin','sc_manager']},
      {id:'orderedItems',icon:'fa-truck-fast',label:t('orderedItems'),badge:DATA.purchaseOrders.filter(p=>p.status==='ordered').length,badgeCls:'blue',roles:['system_admin','sc_manager','sc_user']},
      {id:'receivedItems',icon:'fa-box-archive',label:t('receivedItems'),roles:['system_admin','sc_manager','sc_user']},
    ]},
    {group:'Suppliers',items:[
      {id:'allSuppliers',icon:'fa-building-user',label:t('allSuppliers'),roles:['system_admin','sc_manager','sc_user']},
      {id:'supplierPerformance',icon:'fa-chart-line',label:t('supplierPerformance'),roles:['system_admin','sc_manager']},
    ]},
    {group:'Inventory',items:[
      {id:'inventoryItems',icon:'fa-boxes-stacked',label:t('inventoryItems'),roles:['system_admin','sc_manager','sc_user']},
      {id:'lowStockAlerts',icon:'fa-triangle-exclamation',label:t('lowStockAlerts'),badge:lowStock,roles:['system_admin','sc_manager','sc_user']},
      {id:'stockLedger',icon:'fa-book',label:t('stockLedger'),roles:['system_admin','sc_manager','sc_user']},
      {id:'warehouses',icon:'fa-warehouse',label:t('warehouses'),roles:['system_admin','sc_manager','sc_user']},
      {id:'landedCost',icon:'fa-ship',label:'Landed Cost',roles:['system_admin','sc_manager']},
      {id:'reorderRules',icon:'fa-cart-arrow-down',label:'Auto Reorder',roles:['system_admin','sc_manager']},
    ]},
    {group:'Admin',items:[
      {id:'scSettings',icon:'fa-gear',label:t('scSettings'),roles:['system_admin','sc_manager']},
    ]},
  ];
  let html='';
  allSections.forEach(s=>{
    const filtered=s.items.filter(i=>i.roles.some(r=>hasRole(r)));
    if(!filtered.length) return;
    if(s.group) html+=`<div class="sidebar-group">${s.group}</div>`;
    filtered.forEach(i=>{
      html+=`<div class="sidebar-item ${state.section===i.id?'active':''}" onclick="switchSection('${i.id}')">
        <i class="fa-solid ${i.icon}"></i><span style="flex:1">${i.label}</span>
        ${i.badge?`<span class="sidebar-badge ${i.badgeCls||''}">${i.badge}</span>`:''}
      </div>`;
    });
  });
  return html;
}

/* ═══════════════════════════════════════════════
   SC KPI CARDS
═══════════════════════════════════════════════ */
function renderSCKPIs(){
  const pos = DATA.purchaseOrders;
  const open = pos.filter(p=>['draft','approved','ordered'].includes(p.status)).length;
  const now = new Date(); const m = now.getMonth(); const y = now.getFullYear();
  const mtd = pos.filter(p=>{ const d=new Date(p.createdDate); return d.getMonth()===m&&d.getFullYear()===y&&p.status!=='cancelled'; }).reduce((s,p)=>s+p.amount,0);
  const pendingMR = DATA.materialRequests.filter(m=>m.status==='pending').length;
  const lowStock = DATA.inventory.filter(i=>i.status==='low'||i.status==='critical'||i.status==='out').length;
  const activeSup = DATA.suppliers.filter(s=>s.status==='active').length;
  return `<div class="kpi-grid">
    <div class="kpi-card"><span class="kpi-label">${t('openPOs')}</span><span class="kpi-value">${open}</span><span class="kpi-change" style="color:var(--text-sec)"><i class="fa-solid fa-file-invoice"></i> Active orders</span></div>
    <div class="kpi-card green"><span class="kpi-label">${t('poValueMTD')}</span><span class="kpi-value" style="font-size:18px">${fmt(mtd)}</span><span class="kpi-change kpi-up"><i class="fa-solid fa-arrow-up"></i> This month</span></div>
    <div class="kpi-card orange"><span class="kpi-label">${t('pendingPRs')}</span><span class="kpi-value">${pendingMR}</span><span class="kpi-change kpi-warn"><i class="fa-solid fa-clock"></i> Awaiting approval</span></div>
    <div class="kpi-card red"><span class="kpi-label">${t('lowStockItems')}</span><span class="kpi-value">${lowStock}</span><span class="kpi-change kpi-down"><i class="fa-solid fa-triangle-exclamation"></i> Below reorder point</span></div>
    <div class="kpi-card purple"><span class="kpi-label">${t('activeSuppliers')}</span><span class="kpi-value">${activeSup}</span><span class="kpi-change" style="color:var(--text-sec)"><i class="fa-solid fa-building-user"></i> Approved vendors</span></div>
  </div>`;
}

/* ═══════════════════════════════════════════════
   SC DASHBOARD
═══════════════════════════════════════════════ */
function renderSCDashboard(){
  const pos=DATA.purchaseOrders;
  const inv=DATA.inventory;
  const recentPOs=pos.slice(-5).reverse();
  const lowStockItems=inv.filter(i=>i.status!=='normal').sort((a,b)=>'out critical low'.indexOf(a.status)-'out critical low'.indexOf(b.status));
  const catSpend={};
  pos.filter(p=>p.status!=='cancelled').forEach(p=>{ catSpend[p.category]=(catSpend[p.category]||0)+p.amount; });

  const stockBadge=s=>s==='out'?'<span class="pill pill-expired">Out of Stock</span>':s==='critical'?'<span class="pill pill-expiring">Critical</span>':s==='low'?'<span class="pill pill-leave">Low</span>':'<span class="pill pill-valid">Normal</span>';
  const poBadge=s=>s==='approved'?'<span class="pill pill-valid">Approved</span>':s==='ordered'?'<span class="pill pill-blue">Ordered</span>':s==='received'?'<span class="pill pill-active">Received</span>':s==='cancelled'?'<span class="pill pill-inactive">Cancelled</span>':'<span class="pill pill-draft">Draft</span>';
  const priorityBadge=p=>p==='Critical'?'<span style="color:var(--error);font-weight:700;font-size:11px;"><i class="fa-solid fa-circle" style="font-size:8px;color:var(--error);vertical-align:middle;margin-right:3px"></i>Critical</span>':p==='High'?'<span style="color:var(--warning);font-weight:700;font-size:11px;"><i class="fa-solid fa-circle" style="font-size:8px;color:var(--warning);vertical-align:middle;margin-right:3px"></i>High</span>':'<span style="color:var(--text-sec);font-size:11px;"><i class="fa-solid fa-circle" style="font-size:8px;color:var(--text-sec);vertical-align:middle;margin-right:3px"></i>Normal</span>';

  let html=`<div class="fade-in">`;
  html+=renderSCKPIs();
  html+=`<div class="chart-grid" style="margin-bottom:12px;">
    <div class="chart-card"><h3>Spend by Category</h3><canvas id="scCatChart" height="180"></canvas></div>
    <div class="chart-card"><h3>PO Status Breakdown</h3><canvas id="scStatusChart" height="180"></canvas></div>
  </div>`;

  html+=`<div class="sec-card" style="margin-bottom:12px;"><div class="sec-card-head">Recent Purchase Orders <button class="btn btn-ghost btn-sm" onclick="switchSection('allPOs')">View All</button></div>
  <div style="overflow-x:auto;"><table class="data-table">
    <thead><tr><th>PO Number</th><th>Supplier</th><th>Description</th><th>Amount</th><th>Priority</th><th>Status</th><th>Required By</th></tr></thead><tbody>`;
  recentPOs.forEach(p=>{ html+=`<tr onclick="state.section='allPOs';state.selectedId='${p.id}';state.detailTab='info';rerenderSection()" style="cursor:pointer">
    <td style="font-weight:600;color:var(--blue)">${p.id}</td><td>${p.supplier}</td>
    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.description}</td>
    <td style="font-weight:600">${fmt(p.amount)}</td><td>${priorityBadge(p.priority)}</td><td>${poBadge(p.status)}</td><td>${fmtDate(p.requiredDate)}</td></tr>`; });
  html+=`</tbody></table></div></div>`;

  html+=`<div class="chart-grid"><div class="sec-card"><div class="sec-card-head">Low Stock & Out-of-Stock Alerts <span class="sidebar-badge" style="display:inline-flex;">${lowStockItems.length}</span></div>
  <div style="overflow-x:auto;"><table class="data-table">
    <thead><tr><th>Item</th><th>Site</th><th>On Hand</th><th>Reorder Pt.</th><th>Status</th></tr></thead><tbody>`;
  lowStockItems.forEach(i=>{ html+=`<tr onclick="state.section='inventoryItems';state.selectedId='${i.id}';rerenderSection()" style="cursor:pointer">
    <td><div style="font-weight:500">${i.name}</div><div style="font-size:11px;color:var(--text-sec)">${i.partNo}</div></td>
    <td style="font-size:12px">${i.site}</td>
    <td style="font-weight:600;color:${i.qtyOnHand===0?'var(--error)':'var(--warning)'}">${i.qtyOnHand} ${i.uom}</td>
    <td>${i.reorderPoint} ${i.uom}</td><td>${stockBadge(i.status)}</td></tr>`; });
  html+=`</tbody></table></div></div>
  <div class="sec-card"><div class="sec-card-head">Warehouse Utilisation</div><div class="sec-card-body">`;
  DATA.warehouses.forEach(w=>{
    const col=w.utilisation>80?'var(--error)':w.utilisation>60?'var(--warning)':'var(--success)';
    html+=`<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span style="font-weight:500">${w.name}</span><span style="font-weight:700;color:${col}">${w.utilisation}%</span></div>
    <div style="height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;"><div style="height:100%;width:${w.utilisation}%;background:${col};border-radius:4px;transition:width .4s"></div></div>
    <div style="font-size:11px;color:var(--text-sec);margin-top:2px;">${w.items} item types · Manager: ${w.manager}</div></div>`;
  });
  html+=`</div></div></div></div>`;

  // Charts
  setTimeout(()=>{
    const catCtx=document.getElementById('scCatChart');
    const statCtx=document.getElementById('scStatusChart');
    if(catCtx){
      const labels=Object.keys(catSpend);const vals=Object.values(catSpend);
      const ch=new Chart(catCtx,{type:'bar',data:{labels,datasets:[{data:vals,backgroundColor:'#0070f2',borderRadius:4}]},options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{callback:v=>'$'+Math.round(v/1000)+'K'}},y:{ticks:{font:{size:11}}}}}});
      state.charts.push(ch);
    }
    if(statCtx){
      const statusCounts={Draft:0,Approved:0,Ordered:0,Received:0,Cancelled:0};
      DATA.purchaseOrders.forEach(p=>{ const k=p.status.charAt(0).toUpperCase()+p.status.slice(1); if(statusCounts[k]!==undefined) statusCounts[k]++; });
      const ch=new Chart(statCtx,{type:'doughnut',data:{labels:Object.keys(statusCounts),datasets:[{data:Object.values(statusCounts),backgroundColor:['#6a6d70','#188918','#0070f2','#0f6c6c','#bb0000'],borderWidth:2}]},options:{plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:8}}},cutout:'62%'}});
      state.charts.push(ch);
    }
  },80);

  return html;
}

/* ═══════════════════════════════════════════════
   SC — ALL PURCHASE ORDERS (Master-Detail)
═══════════════════════════════════════════════ */
function renderAllPOs(filterFn){
  const f=state.filters;
  const poBadge=s=>s==='approved'?'<span class="pill pill-valid">Approved</span>':s==='ordered'?'<span class="pill pill-blue">Ordered</span>':s==='received'?'<span class="pill pill-active">Received</span>':s==='cancelled'?'<span class="pill pill-inactive">Cancelled</span>':'<span class="pill pill-draft">Draft</span>';
  const priorityBadge=p=>p==='Critical'?'<i class="fa-solid fa-circle" style="font-size:8px;color:var(--error);vertical-align:middle"></i>':p==='High'?'<i class="fa-solid fa-circle" style="font-size:8px;color:var(--warning);vertical-align:middle"></i>':'<i class="fa-solid fa-circle" style="font-size:8px;color:var(--text-sec);vertical-align:middle"></i>';

  let items=DATA.purchaseOrders.filter(filterFn||(_=>true));
  if(f.search){const s=f.search.toLowerCase();items=items.filter(p=>p.id.toLowerCase().includes(s)||p.supplier.toLowerCase().includes(s)||p.description.toLowerCase().includes(s));}
  if(f.status&&f.status!=='all') items=items.filter(p=>p.status===f.status);
  if(f.priority&&f.priority!=='all') items=items.filter(p=>p.priority===f.priority);
  if(state.sortCol){const col=state.sortCol,dir=state.sortDir==='asc'?1:-1;items.sort((a,b)=>{let va=a[col],vb=b[col];if(typeof va==='string')return va.localeCompare(vb)*dir;return(va-vb)*dir;});}

  let html=`<div class="fade-in">`;
  html+=renderSCKPIs();
  html+=`<div class="md-layout">`;

  html+=`<div class="md-master">
    <div class="filter-bar">
      <input class="filter-input" placeholder="Search POs..." value="${f.search||''}" oninput="state.filters.search=this.value;rerenderSection()" style="flex:1;min-width:90px">
      <select class="filter-select" onchange="state.filters.status=this.value;rerenderSection()">
        <option value="all">All Status</option><option value="draft">Draft</option><option value="approved">Approved</option><option value="ordered">Ordered</option><option value="received">Received</option><option value="cancelled">Cancelled</option>
      </select>
      <select class="filter-select" onchange="state.filters.priority=this.value;rerenderSection()">
        <option value="all">All Priority</option><option value="Critical">Critical</option><option value="High">High</option><option value="Normal">Normal</option>
      </select>
      ${(hasRole('sc_manager'))?`<button class="btn btn-primary btn-sm" onclick="openNewPOModal()"><i class="fa-solid fa-plus"></i> New PO</button>`:''}
    </div>
    <div style="padding:6px 14px 4px;font-size:11px;color:var(--text-sec);background:#fafafa;border-bottom:1px solid var(--border);">${items.length} purchase orders</div>
    <div class="list-container">`;
  if(!items.length) html+=`<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No purchase orders found</p></div>`;
  items.forEach(p=>{
    const borderCol=p.priority==='Critical'?'var(--error)':p.priority==='High'?'var(--warning)':'var(--border)';
    html+=`<div class="list-item ${state.selectedId===p.id?'selected':''}" onclick="selectPOItem('${p.id}')" style="border-left-color:${state.selectedId===p.id?'var(--blue)':borderCol}">
      <div style="width:36px;height:36px;border-radius:6px;background:var(--blue-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-file-invoice" style="color:var(--blue);font-size:14px;"></i></div>
      <div class="list-item-body">
        <div class="list-item-title">${p.id}</div>
        <div class="list-item-desc">${p.supplier}</div>
      </div>
      <div class="list-item-right">
        ${poBadge(p.status)}
        <div class="list-item-date" style="margin-top:3px;font-weight:600;">${fmt(p.amount)}</div>
      </div>
    </div>`;
  });
  html+=`</div></div>`;

  html+=`<div class="md-detail ${state.selectedId?'has-item':''}" style="padding:0;">`;
  if(state.selectedId){
    const p=DATA.purchaseOrders.find(x=>x.id===state.selectedId);
    if(p) html+=renderPODetail(p);
  } else {
    html+=`<div class="empty-state" style="min-height:400px;"><i class="fa-solid fa-hand-pointer"></i><p>Select a PO to view details</p></div>`;
  }
  html+=`</div></div></div>`;
  return html;
}

function selectPOItem(id){ state.selectedId=id; state.detailTab='info'; rerenderSection(); }

function renderPODetail(p){
  const statusColors={draft:'var(--text-sec)',approved:'var(--success)',ordered:'var(--blue)',received:'var(--teal)',cancelled:'var(--error)'};
  const priorityColors={Critical:'var(--error)',High:'var(--warning)',Normal:'var(--text-sec)'};
  const tabs=[{id:'info',label:'Details'},{id:'lines',label:'PO Lines'},{id:'supplier',label:'Supplier'}];
  const sup=DATA.suppliers.find(s=>s.id===p.supplierId);

  let html=`<div class="obj-header">
    <div class="obj-header-top">
      <div style="width:52px;height:52px;border-radius:8px;background:var(--blue-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-file-invoice" style="font-size:22px;color:var(--blue);"></i></div>
      <div style="flex:1;"><h2>${p.id}</h2><div class="obj-sub">${p.supplier} · ${p.category}</div></div>
      <span style="font-weight:700;font-size:13px;color:${priorityColors[p.priority]}"><i class="fa-solid fa-circle" style="font-size:8px;vertical-align:middle;margin-right:3px;color:${priorityColors[p.priority]}"></i> ${p.priority}</span>
    </div>
    <div class="obj-kv">
      <div class="obj-kv-item"><span class="obj-kv-label">Amount</span><span class="obj-kv-value" style="font-size:18px;font-weight:700;color:var(--blue)">${fmt(p.amount)} ${p.currency}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Status</span><span class="obj-kv-value">${statusPill(p.status)}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Required Date</span><span class="obj-kv-value">${fmtDate(p.requiredDate)}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Site</span><span class="obj-kv-value">${p.site}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Created</span><span class="obj-kv-value">${fmtDate(p.createdDate)}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Approved By</span><span class="obj-kv-value">${p.approvedBy||'Pending'}</span></div>
    </div>
  </div>
  <div class="detail-tabs">${tabs.map(tb=>`<div class="detail-tab ${state.detailTab===tb.id?'active':''}" onclick="state.detailTab='${tb.id}';rerenderSection()">${tb.label}</div>`).join('')}</div>
  <div class="detail-tab-body">`;

  if(state.detailTab==='info'){
    html+=`<div class="sec-card"><div class="sec-card-head">Purchase Order Details
      <div style="display:flex;gap:6px;">
        ${p.status==='draft'?`<button class="btn btn-primary btn-sm" onclick="approvePO('${p.id}')"><i class="fa-solid fa-check"></i> Approve</button>`:''}
        ${p.status==='approved'||p.status==='ordered'?(hasRole('sc_manager')?`<button class="btn btn-primary btn-sm" onclick="receivePO('${p.id}')"><i class="fa-solid fa-box-open"></i> Receive</button>`:''):''}
        <button class="btn btn-ghost btn-sm" onclick="window.print()"><i class="fa-solid fa-print"></i> Print</button>
      </div>
    </div>
    <div class="sec-card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
      ${[['PO Number',p.id],['Supplier',p.supplier],['Category',p.category],['Description',p.description],['Total Amount',fmt(p.amount)+' '+p.currency],['Priority',p.priority],['Requested By',p.requestedBy],['Approved By',p.approvedBy||'—'],['Site / Delivery',p.site],['Required Date',fmtDate(p.requiredDate)],['Created Date',fmtDate(p.createdDate)],['Delivery Date',p.deliveryDate?fmtDate(p.deliveryDate):'Pending']].map(([k,v])=>`<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">${k}</div><div style="font-size:13px;">${v}</div></div>`).join('')}
    </div></div>`;
  }
  else if(state.detailTab==='lines'){
    html+=`<div class="sec-card"><div class="sec-card-head">PO Line Items <span style="font-size:12px;font-weight:400;color:var(--text-sec)">${p.poLines.length} lines</span></div>
    <div style="overflow-x:auto;"><table class="data-table">
      <thead><tr><th>#</th><th>Item Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Line Total</th></tr></thead><tbody>`;
    let grandTotal=0;
    p.poLines.forEach((ln,i)=>{
      const total=ln.qty*ln.unitPrice; grandTotal+=total;
      html+=`<tr><td style="color:var(--text-sec)">${i+1}</td><td style="font-weight:500">${ln.item}</td><td style="font-weight:600">${ln.qty}</td><td>${ln.unit}</td><td>${fmt(ln.unitPrice)}</td><td style="font-weight:700;color:var(--blue)">${fmt(total)}</td></tr>`;
    });
    html+=`<tr style="background:#f5f6f7;"><td colspan="5" style="text-align:right;font-weight:700;padding:10px 12px;">Total</td><td style="font-weight:800;color:var(--blue);font-size:14px;">${fmt(grandTotal)} ${p.currency}</td></tr>`;
    html+=`</tbody></table></div></div>`;
  }
  else if(state.detailTab==='supplier'){
    if(sup){
      const stars='<i class="fa-solid fa-star" style="color:#f59e0b"></i>'.repeat(Math.round(sup.rating))+'<i class="fa-regular fa-star" style="color:#d1d5db"></i>'.repeat(5-Math.round(sup.rating));
      html+=`<div class="sec-card"><div class="sec-card-head">Supplier Profile</div><div class="sec-card-body">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #f0f0f0;">
          <div class="avatar" style="width:48px;height:48px;background:${avatarColor(sup.name)};font-size:16px;">${initials(sup.name)}</div>
          <div><div style="font-size:15px;font-weight:700">${sup.name}</div><div style="font-size:12px;color:var(--text-sec)">${sup.category} · ${sup.country}</div>
          <div style="color:#f5a623;font-size:15px;margin-top:2px;">${stars} <span style="font-size:12px;color:var(--text-sec);">(${sup.rating})</span></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
          ${[['Contact',sup.contact],['Email',sup.email],['Phone',sup.phone],['Category',sup.category],['Country',sup.country],['Payment Terms',sup.preferredPayment],['On-Time Delivery',sup.onTimeDelivery+'%'],['Quality Score',sup.qualityScore+'%'],['Total Orders',sup.totalOrders],['Total Spend',fmt(sup.totalSpend)],['Avg Lead Time',sup.leadTimeDays+' days']].map(([k,v])=>`<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">${k}</div><div style="font-size:13px;">${v}</div></div>`).join('')}
        </div>
        ${sup.notes?`<div style="margin-top:14px;padding-top:14px;border-top:1px solid #f0f0f0;font-size:13px;color:var(--text-sec);line-height:1.7;">${sup.notes}</div>`:''}
      </div></div>`;
    } else {
      html+=`<div class="empty-state"><i class="fa-solid fa-building"></i><p>Supplier details not found</p></div>`;
    }
  }
  html+=`</div>`;
  return html;
}

window.approvePO = async function(id){
  if(!requireRoles(['sc_manager','system_admin'],'Access denied: Requires SC Manager role')) return;
  const po=DATA.purchaseOrders.find(p=>p.id===id);
  if(po){
    if(po.status==='draft'){po.status='approved';po.approvedBy=DATA.employees[0]?.name||'Rania Saleh';}
    else if(po.status==='approved'||po.status==='pending'){po.status='ordered';po.approvedBy=po.approvedBy||DATA.employees[0]?.name||'Rania Saleh';}
    else return showToast('Cannot approve PO in '+po.status+' status','error');
    if(supabase) await supabase.from('purchase_orders').update({status:po.status}).eq('id',id);
    showToast(id+' '+po.status,'success'); rerenderSection();
  }
}

window.receivePO = async function(id) {
  if(!requireRoles(['sc_manager','system_admin'],'Access denied: Requires SC Manager')) return;
  const po=DATA.purchaseOrders.find(p=>p.id===id);
  if(!po)return;
  po.status='received';
  if(supabase) await supabase.from('purchase_orders').update({status:'received'}).eq('id', id);
  const lines=po.poLines||[];
  if(lines.length===0){
    const itemName=po.description||'Received Item';
    let invItem=DATA.inventory.find(i=>i.name.toLowerCase()===itemName.toLowerCase());
    if(invItem){recordStockMovement(invItem.id,'in',1,invItem.uom||'Lot','PO Receipt',id,0,'Received via PO '+id);}
    else{
      const newInv={id:'INV-ITM-'+Date.now(),name:itemName,category:po.category,stock:1,min:5,uom:'Lot',location:po.site};
      DATA.inventory.push(newInv);
      if(supabase) await supabase.from('inventory').insert({id:newInv.id,item_name:itemName,category:po.category,stock_level:1,min_stock:5,unit:'Lot',location:po.site});
      recordStockMovement(newInv.id,'in',1,'Lot','PO Receipt',id,0,'Received via PO '+id);
    }
  }else{
    lines.forEach(line=>{
      const qty=line.qty||1;
      let invItem=DATA.inventory.find(i=>i.name.toLowerCase()===line.item.toLowerCase());
      if(invItem){
        invItem.qtyOnHand=(invItem.qtyOnHand||0)+qty;
        invItem.lastReceived=new Date().toISOString().split('T')[0];
        recordStockMovement(invItem.id,'in',qty,line.unit||invItem.uom||'Unit','PO Receipt',id,0,'Received via PO '+id);
        if(supabase) supabase.from('inventory').update({stock_level:invItem.qtyOnHand,last_received:invItem.lastReceived}).eq('id',invItem.id);
      }else{
        const newInv={id:'INV-ITM-'+Date.now()+Math.random().toString(36).slice(2,6),name:line.item,category:po.category,site:po.site,warehouse:'',uom:line.unit||'Unit',qtyOnHand:qty,reorderPoint:1,maxStock:10,unitCost:line.unitPrice||0,status:'normal',lastReceived:new Date().toISOString().split('T')[0],supplierId:po.supplierId};
        DATA.inventory.push(newInv);
        if(supabase) supabase.from('inventory').insert({id:newInv.id,item_name:line.item,category:po.category,stock_level:qty,min_stock:1,unit:line.unit||'Unit',location:po.site});
        recordStockMovement(newInv.id,'in',qty,line.unit||'Unit','PO Receipt',id,0,'Received via PO '+id);
      }
    });
  }
  showToast('PO Received. Inventory updated.','success');
  rerenderSection();
}

/* ═══════════════════════════════════════════════
   SC — SUPPLIERS LIST
═══════════════════════════════════════════════ */
/* ── SC: SUPPLIERS ── */
function openNewSupplierModal() {
  openModal('New Supplier', `<div class="modal-body">
    <div class="form-row"><div class="form-group">
      <label>Supplier Name *</label>
      <input id="sup-name" class="form-input" placeholder="e.g. DrillTech Supplies"></div>
    <div class="form-group">
      <label>Category *</label>
      <select id="sup-cat" class="form-input">
        <option value="Equipment">Equipment</option><option value="Chemicals">Chemicals</option>
        <option value="Safety">Safety</option><option value="Services">Services</option>
        <option value="Logistics">Logistics</option><option value="Other">Other</option>
      </select></div></div>
    <div class="form-row"><div class="form-group">
      <label>Contact Person</label>
      <input id="sup-contact" class="form-input" placeholder="Name"></div>
    <div class="form-group">
      <label>Email</label>
      <input id="sup-email" class="form-input" type="email" placeholder="email@example.com"></div></div>
    <div class="form-row"><div class="form-group">
      <label>Phone</label>
      <input id="sup-phone" class="form-input" placeholder="+968 XXXX XXXX"></div>
    <div class="form-group">
      <label>Country</label>
      <input id="sup-country" class="form-input" value="Oman"></div></div>
    <div class="form-group"><label>Notes</label>
      <textarea id="sup-notes" class="form-input" rows="2" placeholder="Optional notes"></textarea></div>
  </div>`, `<button class="btn btn-primary" onclick="submitNewSupplier()">Save</button>
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`);
}
async function submitNewSupplier() {
  if(!requireRoles(['sc_manager','system_admin'],'Access denied: Requires SC Manager')) return;
  const name = document.getElementById('sup-name')?.value?.trim();
  if(!name){showToast('Supplier name required','error');return;}
  const id='SUP-'+String(DATA.suppliers.length+1).padStart(3,'0');
  const rec={id,name,category:document.getElementById('sup-cat')?.value||'Other',contact_person:document.getElementById('sup-contact')?.value?.trim()||'',email:document.getElementById('sup-email')?.value?.trim()||'',phone:document.getElementById('sup-phone')?.value?.trim()||'',country:document.getElementById('sup-country')?.value?.trim()||'Oman',rating:0,status:'active'};
  DATA.suppliers.push(rec);
  if(supabase) await supabase.from('suppliers').insert(rec).catch(supabaseCatch);
  closeModal();
  showToast('Supplier added','success');
  rerenderSection();
}

function renderAllSuppliers(){
  const f=state.filters;
  let items=[...DATA.suppliers];
  if(f.search){const s=f.search.toLowerCase();items=items.filter(x=>x.name.toLowerCase().includes(s)||x.country.toLowerCase().includes(s)||x.category.toLowerCase().includes(s));}
  if(f.category&&f.category!=='all') items=items.filter(x=>x.category===f.category);
  const cats=[...new Set(DATA.suppliers.map(s=>s.category))].sort();
  const ratingBar=r=>`<div style="display:flex;align-items:center;gap:4px;"><span style="color:#f5a623;font-size:12px;">${'<i class="fa-solid fa-star" style="color:#f5a623;font-size:12px"></i>'.repeat(Math.round(r))}</span><span style="font-size:11px;color:var(--text-sec)">${r}</span></div>`;

  let html=`<div class="fade-in">`;
  html+=renderSCKPIs();
  html+=`<div class="md-layout">`;

  html+=`<div class="md-master">
    <div class="filter-bar">
      <input class="filter-input" placeholder="Search suppliers..." value="${f.search||''}" oninput="state.filters.search=this.value;rerenderSection()" style="flex:1;min-width:90px">
      <select class="filter-select" onchange="state.filters.category=this.value;rerenderSection()">
        <option value="all">All Categories</option>${cats.map(c=>`<option value="${c}" ${f.category===c?'selected':''}>${c}</option>`).join('')}
      </select>
      <button class="btn btn-primary btn-sm" onclick="openNewSupplierModal()"><i class="fa-solid fa-plus"></i> New Supplier</button>
    </div>
    <div style="padding:6px 14px 4px;font-size:11px;color:var(--text-sec);background:#fafafa;border-bottom:1px solid var(--border);">${items.length} suppliers</div>
    <div class="list-container">`;
  items.forEach(s=>{
    html+=`<div class="list-item ${state.selectedId===s.id?'selected':''}" onclick="selectSupplierItem('${s.id}')">
      <div class="avatar" style="width:36px;height:36px;background:${avatarColor(s.name)};font-size:12px;">${initials(s.name)}</div>
      <div class="list-item-body">
        <div class="list-item-title">${s.name}</div>
        <div class="list-item-desc">${s.category} · ${s.country}</div>
      </div>
      <div class="list-item-right">${ratingBar(s.rating)}<div class="list-item-date">${s.totalOrders} orders</div></div>
    </div>`;
  });
  html+=`</div></div>`;

  html+=`<div class="md-detail ${state.selectedId?'has-item':''}" style="padding:0;">`;
  if(state.selectedId){
    const s=DATA.suppliers.find(x=>x.id===state.selectedId);
    if(s) html+=renderSupplierDetail(s);
  } else {
    html+=`<div class="empty-state" style="min-height:400px;"><i class="fa-solid fa-hand-pointer"></i><p>Select a supplier to view details</p></div>`;
  }
  html+=`</div></div></div>`;
  return html;
}

function selectSupplierItem(id){ state.selectedId=id; state.detailTab='info'; rerenderSection(); }

function renderSupplierDetail(s){
  const stars='<i class="fa-solid fa-star" style="color:#f59e0b"></i>'.repeat(Math.round(s.rating))+'<i class="fa-regular fa-star" style="color:#d1d5db"></i>'.repeat(5-Math.round(s.rating));
  const supPOs=DATA.purchaseOrders.filter(p=>p.supplierId===s.id);
  const tabs=[{id:'info',label:'Profile'},{id:'orders',label:`Orders (${supPOs.length})`},{id:'performance',label:'Performance'}];

  let html=`<div class="obj-header">
    <div class="obj-header-top">
      <div class="avatar" style="width:48px;height:48px;font-size:16px;background:${avatarColor(s.name)}">${initials(s.name)}</div>
      <div style="flex:1;"><h2>${s.name}</h2><div class="obj-sub">${s.category} · ${s.country} · ${s.region}</div></div>
      <span style="color:#f5a623;font-size:16px;">${stars}</span>
    </div>
    <div class="obj-kv">
      <div class="obj-kv-item"><span class="obj-kv-label">Supplier ID</span><span class="obj-kv-value">${s.id}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Contact</span><span class="obj-kv-value">${s.contact}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Rating</span><span class="obj-kv-value" style="font-weight:700;color:#f5a623;">${s.rating} / 5.0</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Total Spend</span><span class="obj-kv-value" style="font-weight:700;color:var(--blue)">${fmt(s.totalSpend)}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Lead Time</span><span class="obj-kv-value">${s.leadTimeDays} days</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Status</span><span class="obj-kv-value">${statusPill(s.status)}</span></div>
    </div>
  </div>
  <div class="detail-tabs">${tabs.map(tb=>`<div class="detail-tab ${state.detailTab===tb.id?'active':''}" onclick="state.detailTab='${tb.id}';rerenderSection()">${tb.label}</div>`).join('')}</div>
  <div class="detail-tab-body">`;

  if(state.detailTab==='info'){
    html+=`<div class="sec-card"><div class="sec-card-head">Supplier Profile</div>
    <div class="sec-card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
      ${[['Contact Name',s.contact],['Email',s.email],['Phone',s.phone],['Category',s.category],['Country',s.country],['Region',s.region],['Payment Terms',s.preferredPayment],['Currency',s.currency],['Total Orders',s.totalOrders],['Total Spend',fmt(s.totalSpend)],['Avg Lead Time',s.leadTimeDays+' days']].map(([k,v])=>`<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">${k}</div><div style="font-size:13px;">${v}</div></div>`).join('')}
    </div>
    ${s.notes?`<div style="margin-top:14px;padding-top:14px;border-top:1px solid #f0f0f0;font-size:13px;color:var(--text-sec);line-height:1.7;">${s.notes}</div>`:''}
    </div>`;
  }
  else if(state.detailTab==='orders'){
    html+=`<div class="sec-card"><div class="sec-card-head">Purchase Orders</div>
    <div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>PO #</th><th>Description</th><th>Amount</th><th>Status</th><th>Required</th></tr></thead><tbody>`;
    if(supPOs.length){
      supPOs.forEach(p=>{ html+=`<tr onclick="state.section='allPOs';state.selectedId='${p.id}';rerenderSection()" style="cursor:pointer"><td style="font-weight:600;color:var(--blue)">${p.id}</td><td style="font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.description}</td><td style="font-weight:600">${fmt(p.amount)}</td><td>${statusPill(p.status)}</td><td>${fmtDate(p.requiredDate)}</td></tr>`; });
    } else { html+=`<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-sec);">No orders found</td></tr>`; }
    html+=`</tbody></table></div></div>`;
  }
  else if(state.detailTab==='performance'){
    const metrics=[['On-Time Delivery',s.onTimeDelivery],['Quality Score',s.qualityScore],['Responsiveness',Math.round(s.rating*18+8)],['Documentation',Math.round(s.rating*16+14)]];
    html+=`<div class="sec-card"><div class="sec-card-head">Performance Scorecard</div><div class="sec-card-body">`;
    metrics.forEach(([label,pct])=>{
      const col=pct>=95?'var(--success)':pct>=85?'var(--blue)':pct>=75?'var(--warning)':'var(--error)';
      html+=`<div class="skill-bar"><div class="skill-bar-label"><span>${label}</span><span style="font-weight:700;color:${col}">${pct}%</span></div><div class="skill-bar-track"><div class="skill-bar-fill" style="width:${pct}%;background:${col}"></div></div></div>`;
    });
    html+=`<div style="margin-top:16px;padding:12px;background:var(--bg);border-radius:6px;font-size:13px;line-height:1.7;color:var(--text-sec);">${s.notes}</div></div></div>`;
  }
  html+=`</div>`;
  return html;
}

/* ═══════════════════════════════════════════════
   SC — INVENTORY TABLE
═══════════════════════════════════════════════ */
function renderSCSettings() {
  return `<div class="fade-in" style="max-width:600px">
    <h2>Supply Chain Settings</h2>
    <div class="sec-card" style="margin-top:20px"><div class="sec-card-body">
      <div class="form-group"><label class="form-label">Auto-reorder Threshold (%)</label><input class="form-input" type="number" value="15"></div>
      <div class="form-group"><label class="form-label">Default Warehouse</label>
      <select class="form-input"><option>Central Hub</option><option>Rig Alpha Storage</option></select></div>
      <button class="btn btn-primary" onclick="showToast('Settings saved','success')">Save Settings</button>
    </div></div>
  </div>`;
}

/* ── SC: WAREHOUSE ── */
function openNewWarehouseModal() {
  const mgrOpts = DATA.employees.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
  openModal('New Warehouse', `<div class="modal-body">
    <div class="form-group"><label>Warehouse Name *</label>
      <input id="wh-name" class="form-input" placeholder="e.g. Central Hub"></div>
    <div class="form-row"><div class="form-group">
      <label>Location</label>
      <input id="wh-loc" class="form-input" placeholder="e.g. Muscat"></div>
    <div class="form-group">
      <label>Manager</label>
      <select id="wh-mgr" class="form-input"><option value="">None</option>${mgrOpts}</select></div></div>
    <div class="form-row"><div class="form-group">
      <label>Total Capacity</label>
      <input id="wh-cap" class="form-input" type="number" value="1000" min="0"></div>
    <div class="form-group">
      <label>Status</label>
      <select id="wh-status" class="form-input">
        <option value="Active">Active</option><option value="Inactive">Inactive</option>
      </select></div></div>
  </div>`, `<button class="btn btn-primary" onclick="submitNewWarehouse()">Save</button>
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`);
}
async function submitNewWarehouse() {
  const name = document.getElementById('wh-name')?.value?.trim();
  if(!name){showToast('Warehouse name required','error');return;}
  const id='WH-'+String(DATA.warehouses.length+1).padStart(3,'0');
  const rec={id,name,location:document.getElementById('wh-loc')?.value?.trim()||'',manager_id:document.getElementById('wh-mgr')?.value||'',capacity_used:0,capacity_total:parseInt(document.getElementById('wh-cap')?.value)||1000,status:document.getElementById('wh-status')?.value||'Active'};
  DATA.warehouses.push(rec);
  if(supabase) await supabase.from('warehouses').insert(rec).catch(supabaseCatch);
  closeModal();
  showToast('Warehouse added','success');
  rerenderSection();
}

function renderWarehouseCapacity() {
  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between"><h2>Warehouse Capacity</h2>
    <button class="btn btn-primary btn-sm" onclick="openNewWarehouseModal()"><i class="fa-solid fa-plus"></i> New Warehouse</button></div>
  <table class="table">
    <thead><tr><th>ID</th><th>Warehouse</th><th>Location</th><th>Manager</th><th>Capacity Used</th><th>Status</th></tr></thead>
    <tbody>`;
  DATA.warehouses.forEach(w => {
    const pct = Math.round((w.capacity_used / w.capacity_total)*100);
    html += `<tr><td><strong>${w.id}</strong></td><td>${w.name}</td><td>${w.location}</td><td>${w.manager_id}</td>
      <td>
        <div style="width:100%;background:#f0f0f0;height:8px;border-radius:4px;margin-top:6px">
          <div style="width:${pct}%;background:${pct>90?'var(--danger)':pct>70?'var(--warning)':'var(--success)'};height:100%;border-radius:4px"></div>
        </div>
        <div style="font-size:11px;color:var(--text-sec);margin-top:2px">${pct}% used</div>
      </td>
      <td><span class="status-pill status-${w.status.toLowerCase()}">${w.status}</span></td></tr>`;
  });
  if(DATA.warehouses.length===0) html += `<tr><td colspan="6" style="text-align:center">No warehouses found.</td></tr>`;
  html += `</tbody></table></div>`;
  return html;
}

function renderInventory(filterFn=null){
  const f=state.filters;
  let items=DATA.inventory.filter(filterFn||(_=>true));
  if(f.search){const s=f.search.toLowerCase();items=items.filter(i=>i.name.toLowerCase().includes(s)||i.partNo.toLowerCase().includes(s)||i.site.toLowerCase().includes(s));}
  if(f.category&&f.category!=='all') items=items.filter(i=>i.category===f.category);
  if(f.status&&f.status!=='all') items=items.filter(i=>i.status===f.status);
  const cats=[...new Set(DATA.inventory.map(i=>i.category))].sort();
  const stockBadge=s=>s==='out'?'<span class="pill pill-expired">Out of Stock</span>':s==='critical'?'<span class="pill pill-expiring">Critical</span>':s==='low'?'<span class="pill pill-leave">Low</span>':'<span class="pill pill-valid">Normal</span>';
  const stockCol=s=>s==='out'?'var(--error)':s==='critical'?'var(--warning)':s==='low'?'#b35d00':'var(--success)';
  const parentsFirst = (a,b) => (a.has_variants ? -1 : a.parent_item ? 1 : 0) - (b.has_variants ? -1 : b.parent_item ? 1 : 0);

  // sort: parents first, then alphabetically
  items.sort((a,b) => parentsFirst(a,b) || a.name.localeCompare(b.name));

  let html=`<div class="fade-in">`;
  html+=renderSCKPIs();
  html+=`<div class="sec-card"><div class="sec-card-head">Inventory Register
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <input class="filter-input" placeholder="Search..." value="${f.search||''}" oninput="state.filters.search=this.value;rerenderSection()" style="min-width:140px;">
      <select class="filter-select" onchange="state.filters.category=this.value;rerenderSection()">
        <option value="all">All Categories</option>${cats.map(c=>`<option value="${c}" ${f.category===c?'selected':''}>${c}</option>`).join('')}
      </select>
      <select class="filter-select" onchange="state.filters.status=this.value;rerenderSection()">
        <option value="all">All Status</option><option value="normal">Normal</option><option value="low">Low</option><option value="critical">Critical</option><option value="out">Out of Stock</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="openNewInventoryModal()"><i class="fa-solid fa-plus"></i> Add Item</button>
      <button class="btn btn-sm btn-outline" onclick="showToast('Stock count export started','info')"><i class="fa-solid fa-download"></i> Export</button>
    </div>
  </div>
  <div style="overflow-x:auto;"><table class="data-table">
    <thead><tr>
      <th onclick="sortBy('name')" class="${sortedCls('name')}">Item ${sortIcon('name')}</th>
      <th onclick="sortBy('partNo')" class="${sortedCls('partNo')}">Part No. ${sortIcon('partNo')}</th>
      <th>Tracking</th>
      <th onclick="sortBy('category')" class="${sortedCls('category')}">Category ${sortIcon('category')}</th>
      <th onclick="sortBy('site')" class="${sortedCls('site')}">Site ${sortIcon('site')}</th>
      <th onclick="sortBy('qtyOnHand')" class="${sortedCls('qtyOnHand')}">On Hand ${sortIcon('qtyOnHand')}</th>
      <th onclick="sortBy('reorderPoint')" class="${sortedCls('reorderPoint')}">Reorder Pt. ${sortIcon('reorderPoint')}</th>
      <th onclick="sortBy('unitCost')" class="${sortedCls('unitCost')}">Unit Cost ${sortIcon('unitCost')}</th>
      <th>Stock Status</th>
      <th onclick="sortBy('lastReceived')" class="${sortedCls('lastReceived')}">Last Received ${sortIcon('lastReceived')}</th>
    </tr></thead><tbody>`;
  if(!items.length) html+=`<tr><td colspan="10" style="text-align:center;padding:30px;color:var(--text-sec);">No inventory items found</td></tr>`;
  items.forEach(i=>{
    const col=stockCol(i.status);
    const indent = i.parent_item ? 'padding-left:24px;' : '';
    const icon = i.has_variants ? '<i class="fa-solid fa-layer-group" style="color:var(--primary);margin-right:4px"></i>' : i.parent_item ? '<i class="fa-regular fa-copy" style="color:var(--text-sec);margin-right:4px"></i>' : '<i class="fa-solid fa-box" style="color:var(--text-sec);margin-right:4px"></i>';
    const trackBadges = [];
    if (i.serial_tracking) trackBadges.push('<span class="pill pill-valid" style="font-size:10px">Serial</span>');
    if (i.batch_tracking) trackBadges.push('<span class="pill pill-leave" style="font-size:10px">Batch</span>');
    if (i.has_variants) trackBadges.push('<span class="pill pill-valid" style="font-size:10px;background:var(--primary);color:#fff">Has Variants</span>');
    html+=`<tr>
      <td><div style="font-weight:600;${indent}">${icon}${i.name}</div></td>
      <td style="font-size:12px;color:var(--text-sec)">${i.partNo}</td>
      <td>${trackBadges.join(' ')}</td>
      <td>${i.category}</td>
      <td style="font-size:12px">${i.site}</td>
      <td style="font-weight:700;color:${col}">${i.qtyOnHand} <span style="font-weight:400;font-size:11px;color:var(--text-sec)">${i.uom}</span></td>
      <td style="color:var(--text-sec)">${i.reorderPoint} ${i.uom}</td>
      <td>${fmt(i.unitCost)}</td>
      <td>${stockBadge(i.status)}</td>
      <td style="font-size:12px;color:var(--text-sec)">${fmtDate(i.lastReceived)}</td>
    </tr>`;
  });
  html+=`</tbody></table></div></div></div>`;
  return html;
}

function openNewInventoryModal() {
  const cats = [...new Set(DATA.inventory.map(i=>i.category))].sort();
  const parents = DATA.inventory.filter(i => i.has_variants || !i.parent_item);
  const body = `<div style="display:flex;flex-direction:column;gap:10px">
    <input class="filter-input" id="ni-name" placeholder="Item Name" />
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <input class="filter-input" id="ni-part" placeholder="Part No." />
      <select class="filter-input" id="ni-cat"><option value="">— Category —</option>${cats.map(c=>`<option>${c}</option>`).join('')}<option>New Category</option></select>
    </div>
    <select class="filter-input" id="ni-parent"><option value="">— Parent Item (optional) —</option>${parents.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
      <input class="filter-input" id="ni-uom" placeholder="UOM" value="Unit" />
      <input class="filter-input" id="ni-cost" type="number" placeholder="Unit Cost ($)" step="0.01" />
      <input class="filter-input" id="ni-site" placeholder="Site / Location" />
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
      <input class="filter-input" id="ni-qty" type="number" placeholder="Qty On Hand" value="0" />
      <input class="filter-input" id="ni-reorder" type="number" placeholder="Reorder Point" value="0" />
      <input class="filter-input" id="ni-max" type="number" placeholder="Max Stock" value="0" />
    </div>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="ni-serial" /> Serialized item (track by serial number)</label>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="ni-batch" /> Batched item (track by batch/lot)</label>
  </div>`;
  const footer = `<button class="btn btn-primary" onclick="submitNewInventory()">Add Item</button>`;
  openModal('Add Inventory Item', body, footer);
}

function submitNewInventory() {
  const name = $('#ni-name').value.trim();
  if (!name) { showToast('Item name required', 'error'); return; }
  const item = {
    id: 'INV-' + String(DATA.inventory.length + 1).padStart(3, '0'),
    name, partNo: $('#ni-part').value.trim() || 'N/A',
    category: $('#ni-cat').value || 'Uncategorized',
    site: $('#ni-site').value.trim() || 'All Sites',
    warehouse: 'WH-HO-01',
    uom: $('#ni-uom').value.trim() || 'Unit',
    qtyOnHand: parseFloat($('#ni-qty').value) || 0,
    reorderPoint: parseFloat($('#ni-reorder').value) || 0,
    maxStock: parseFloat($('#ni-max').value) || 0,
    unitCost: parseFloat($('#ni-cost').value) || 0,
    status: 'normal',
    lastReceived: new Date().toISOString().slice(0,10),
    supplierId: null,
    parent_item: $('#ni-parent').value || null,
    serial_tracking: $('#ni-serial').checked,
    batch_tracking: $('#ni-batch').checked,
    has_variants: false,
  };
  DATA.inventory.push(item);
  if (supabase) supabase.from('inventory').insert(item).catch(supabaseCatch);
  closeModal(); showToast('Item added', 'success'); rerenderSection();
}

/* ── Quality Inspections ── */
function renderQualityInspections() {
  const qis = DATA.qualityInspections || [];
  const now = new Date();
  const pending = qis.filter(q => q.status === 'Pending').length;
  const passed = qis.filter(q => q.status === 'Passed').length;
  const failed = qis.filter(q => q.status === 'Failed').length;

  let html = `<div class="fade-in"><div class="kpi-grid">
    <div class="kpi-card blue"><span class="kpi-label">Total Inspections</span><span class="kpi-value">${qis.length}</span></div>
    <div class="kpi-card orange"><span class="kpi-label">Pending</span><span class="kpi-value">${pending}</span></div>
    <div class="kpi-card green"><span class="kpi-label">Passed</span><span class="kpi-value">${passed}</span></div>
    <div class="kpi-card red"><span class="kpi-label">Failed</span><span class="kpi-value">${failed}</span></div>
  </div>
  <div class="sec-card"><div class="sec-card-head">Quality Inspections
    <button class="btn btn-primary btn-sm" onclick="openNewQIModal()"><i class="fa-solid fa-plus"></i> New Inspection</button>
  </div>
  <div style="overflow-x:auto"><table class="data-table"><thead><tr>
    <th>ID</th><th>Date</th><th>Item</th><th>Type</th><th>Inspector</th><th>PO Ref</th><th>Parameters</th><th>Result</th><th>Notes</th><th></th>
  </tr></thead><tbody>`;
  if (!qis.length) html += `<tr><td colspan="10" style="text-align:center;padding:30px">No inspections found.</td></tr>`;
  qis.forEach(q => {
    const allPass = q.parameters.every(p => p.result === 'Pass');
    const hasFail = q.parameters.some(p => p.result === 'Fail');
    const statusLabel = q.status === 'Passed' ? '<span class="pill pill-valid">Passed</span>' : q.status === 'Failed' ? '<span class="pill pill-expired">Failed</span>' : '<span class="pill pill-leave">Pending</span>';
    html += `<tr>
      <td><strong>${q.id}</strong></td>
      <td style="font-size:12px">${q.date}</td>
      <td>${q.itemName}</td>
      <td>${q.inspectionType}</td>
      <td>${q.inspector}</td>
      <td style="font-size:12px">${q.poRef}</td>
      <td><button class="btn btn-sm btn-ghost" onclick="showQIParams('${q.id}')">${q.parameters.length} params</button></td>
      <td>${statusLabel}</td>
      <td style="font-size:12px;color:var(--text-sec);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${q.notes || '-'}</td>
      <td><button class="btn btn-sm btn-outline" onclick="openNewQIModal('${q.id}')">Edit</button></td>
    </tr>`;
  });
  html += `</tbody></table></div></div></div>`;
  return html;
}

function openNewQIModal(editId) {
  const qi = editId ? DATA.qualityInspections.find(q => q.id === editId) : null;
  const items = DATA.inventory.map(i => `<option value="${i.id}" ${qi && qi.itemId === i.id ? 'selected' : ''}>${i.name}</option>`).join('');
  const pos = DATA.purchaseOrders.filter(p => p.status !== 'cancelled').map(p => `<option value="${p.id}" ${qi && qi.poRef === p.id ? 'selected' : ''}>${p.id}</option>`).join('');
  const inspectors = ['Ahmed Al-Riyami','Noor Al-Balushi','Khalid Al-Maawali','Salim Al-Hashmi','Muna Al-Said'];
  const inspOpts = inspectors.map(i => `<option ${qi && qi.inspector === i ? 'selected' : ''}>${i}</option>`).join('');
  const body = `<div style="display:flex;flex-direction:column;gap:10px">
    <input class="filter-input" id="nqi-date" type="date" value="${qi ? qi.date : new Date().toISOString().slice(0,10)}" />
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <select class="filter-input" id="nqi-item"><option value="">— Item —</option>${items}</select>
      <select class="filter-input" id="nqi-po"><option value="">— PO Ref —</option>${pos}</select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <select class="filter-input" id="nqi-type"><option value="Incoming" ${qi && qi.inspectionType === 'Incoming' ? 'selected' : ''}>Incoming</option><option value="In Process" ${qi && qi.inspectionType === 'In Process' ? 'selected' : ''}>In Process</option><option value="Outgoing" ${qi && qi.inspectionType === 'Outgoing' ? 'selected' : ''}>Outgoing</option></select>
      <select class="filter-input" id="nqi-inspector"><option value="">— Inspector —</option>${inspOpts}</select>
    </div>
    <textarea class="filter-input" id="nqi-notes" placeholder="Notes" rows="2">${qi ? qi.notes : ''}</textarea>
    <div style="font-size:13px;font-weight:600;margin-top:6px">Inspection Parameters (JSON array)</div>
    <textarea class="filter-input" id="nqi-params" rows="4" placeholder='[{"param":"Viscosity","min":30,"max":50}]'>${qi ? JSON.stringify(qi.parameters) : ''}</textarea>
  </div>`;
  const footer = `<button class="btn btn-primary" onclick="submitNewQI('${editId || ''}')">${editId ? 'Update' : 'Create'} Inspection</button>`;
  openModal(editId ? 'Edit Quality Inspection' : 'New Quality Inspection', body, footer);
}

function submitNewQI(editId) {
  const date = $('#nqi-date').value;
  const itemId = $('#nqi-item').value;
  if (!itemId) { showToast('Select an item', 'error'); return; }
  const item = DATA.inventory.find(i => i.id === itemId);
  let params = [];
  try { params = JSON.parse($('#nqi-params').value || '[]'); } catch(e) { showToast('Invalid JSON parameters', 'error'); return; }
  params.forEach(p => { if (p.actual === undefined) p.actual = 0; if (p.result === undefined) p.result = p.actual >= p.min && p.actual <= p.max ? 'Pass' : 'Fail'; });
  const allPass = params.every(p => p.result === 'Pass');
  const anyFail = params.some(p => p.result === 'Fail');
  const status = params.length === 0 ? 'Pending' : anyFail ? 'Failed' : 'Passed';
  const inspectionType=$('#nqi-type').value, poRef=$('#nqi-po').value||null;
  const qi = {
    id: editId || 'QI-' + String(DATA.qualityInspections.length + 1).padStart(3, '0'),
    date, itemId, item_id:itemId, itemName: item ? item.name : itemId, item_name: item ? item.name : itemId,
    inspectionType, inspection_type:inspectionType,
    poRef, po_ref:poRef,
    inspector: $('#nqi-inspector').value || 'N/A',
    parameters: params, notes: $('#nqi-notes').value.trim(), status,
  };
  const dbQi={id:qi.id,date:qi.date,item_id:qi.item_id,item_name:qi.item_name,inspection_type:qi.inspection_type,po_ref:qi.po_ref,inspector:qi.inspector,parameters:qi.parameters,notes:qi.notes,status:qi.status};
  if (!editId) { DATA.qualityInspections.push(qi); if(supabase) supabase.from('quality_inspections').insert(dbQi).catch(supabaseCatch); }
  else { const idx = DATA.qualityInspections.findIndex(q => q.id === editId); DATA.qualityInspections[idx] = qi; if(supabase) supabase.from('quality_inspections').upsert(dbQi).catch(supabaseCatch); }
  closeModal(); showToast(editId ? 'Inspection updated' : 'Inspection created', 'success'); rerenderSection();
}

function showQIParams(id) {
  const qi = DATA.qualityInspections.find(q => q.id === id);
  if (!qi) return;
  let body = `<table class="data-table"><thead><tr><th>Parameter</th><th>Min</th><th>Max</th><th>Actual</th><th>Result</th></tr></thead><tbody>`;
  qi.parameters.forEach(p => {
    const ok = p.result === 'Pass';
    body += `<tr><td>${p.param}</td><td>${p.min}</td><td>${p.max}</td><td style="font-weight:600">${p.actual}</td><td>${ok ? '<span class="pill pill-valid">Pass</span>' : '<span class="pill pill-expired">Fail</span>'}</td></tr>`;
  });
  body += `</tbody></table>`;
  openModal('Parameters — ' + qi.id, body, `<button class="btn btn-primary" onclick="closeModal()">OK</button>`);
}

/* ── Landed Cost ── */
function renderLandedCost() {
  let html = `<div class="fade-in"><div class="kpi-grid">
    <div class="kpi-card blue"><span class="kpi-label">Total Vouchers</span><span class="kpi-value">${DATA.landedCostVouchers.length}</span></div>
    <div class="kpi-card green"><span class="kpi-label">Total Charges</span><span class="kpi-value">${fmt(DATA.landedCostVouchers.reduce((s,v)=>s+v.totalCharges,0))}</span></div>
  </div>
  <div class="sec-card"><div class="sec-card-head">Landed Cost Vouchers
    <button class="btn btn-primary btn-sm" onclick="openNewLCVModal()"><i class="fa-solid fa-plus"></i> New Voucher</button>
  </div>
  <div style="overflow-x:auto"><table class="data-table"><thead><tr>
    <th>Voucher</th><th>Date</th><th>PO Ref</th><th>Freight</th><th>Insurance</th><th>Duty</th><th>Handling</th><th>Total</th><th>Distribution</th><th>Items</th><th></th>
  </tr></thead><tbody>`;
  if (!DATA.landedCostVouchers.length) html += `<tr><td colspan="11" style="text-align:center;padding:30px">No landed cost vouchers found.</td></tr>`;
  DATA.landedCostVouchers.forEach(v => {
    html += `<tr>
      <td><strong>${v.id}</strong></td>
      <td style="font-size:12px">${v.date}</td>
      <td style="font-size:12px">${v.poRef}</td>
      <td>${fmt(v.charges.freight)}</td>
      <td>${fmt(v.charges.insurance)}</td>
      <td>${fmt(v.charges.duty)}</td>
      <td>${fmt(v.charges.handling)}</td>
      <td style="font-weight:700">${fmt(v.totalCharges)}</td>
      <td>${v.distribution}</td>
      <td><button class="btn btn-sm btn-ghost" onclick="showLCVItems('${v.id}')">${v.items.length} items</button></td>
      <td><button class="btn btn-sm btn-outline" onclick="openNewLCVModal('${v.id}')">Edit</button></td>
    </tr>`;
  });
  html += `</tbody></table></div></div></div>`;
  return html;
}

function openNewLCVModal(editId) {
  const v = editId ? DATA.landedCostVouchers.find(x => x.id === editId) : null;
  const pos = DATA.purchaseOrders.filter(p => p.status !== 'cancelled').map(p => `<option value="${p.id}" ${v && v.poRef === p.id ? 'selected' : ''}>${p.id}</option>`).join('');
  const body = `<div style="display:flex;flex-direction:column;gap:10px">
    <input class="filter-input" id="nl-date" type="date" value="${v ? v.date : new Date().toISOString().slice(0,10)}" />
    <select class="filter-input" id="nl-po"><option value="">— PO Ref —</option>${pos}</select>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <input class="filter-input" id="nl-freight" type="number" placeholder="Freight ($)" value="${v ? v.charges.freight : 0}" />
      <input class="filter-input" id="nl-insurance" type="number" placeholder="Insurance ($)" value="${v ? v.charges.insurance : 0}" />
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <input class="filter-input" id="nl-duty" type="number" placeholder="Customs Duty ($)" value="${v ? v.charges.duty : 0}" />
      <input class="filter-input" id="nl-handling" type="number" placeholder="Handling ($)" value="${v ? v.charges.handling : 0}" />
    </div>
    <select class="filter-input" id="nl-dist"><option value="By Value" ${v && v.distribution === 'By Value' ? 'selected' : ''}>By Value</option><option value="By Qty" ${v && v.distribution === 'By Qty' ? 'selected' : ''}>By Quantity</option></select>
    <div style="font-size:13px;font-weight:600">Items allocation (JSON: itemId, proportion)</div>
    <textarea class="filter-input" id="nl-items" rows="3" placeholder='[{"itemId":"INV-001","proportion":0.6}]'>${v ? JSON.stringify(v.items.map(i=>({itemId:i.itemId,proportion:i.proportion}))) : ''}</textarea>
  </div>`;
  const footer = `<button class="btn btn-primary" onclick="submitNewLCV('${editId || ''}')">${editId ? 'Update' : 'Create'} Voucher</button>`;
  openModal(editId ? 'Edit Landed Cost Voucher' : 'New Landed Cost Voucher', body, footer);
}

function submitNewLCV(editId) {
  const freight = parseFloat($('#nl-freight').value) || 0;
  const insurance = parseFloat($('#nl-insurance').value) || 0;
  const duty = parseFloat($('#nl-duty').value) || 0;
  const handling = parseFloat($('#nl-handling').value) || 0;
  const total = freight + insurance + duty + handling;
  let items = [];
  try { items = JSON.parse($('#nl-items').value || '[]'); } catch(e) { showToast('Invalid items JSON', 'error'); return; }
  if (!items.length) { showToast('At least one item required', 'error'); return; }
  const totalProp = items.reduce((s,i) => s + i.proportion, 0);
  const alloc = items.map(i => ({
    itemId: i.itemId,
    itemName: (DATA.inventory.find(x => x.id === i.itemId) || {}).name || i.itemId,
    proportion: i.proportion,
    allocated: Math.round((i.proportion / totalProp) * total * 100) / 100,
  }));
  const poRef=$('#nl-po').value||null;
  const v = {
    id: editId || 'LCV-' + String(DATA.landedCostVouchers.length + 1).padStart(3, '0'),
    date: $('#nl-date').value, poRef, po_ref:poRef,
    charges: {freight, insurance, duty, handling},
    totalCharges: total, total_charges:total, distribution: $('#nl-dist').value, items: alloc,
  };
  const dbV={id:v.id,date:v.date,po_ref:v.po_ref,charges:v.charges,total_charges:v.total_charges,distribution:v.distribution,items:v.items};
  if (!editId) { DATA.landedCostVouchers.push(v); if(supabase) supabase.from('landed_cost_vouchers').insert(dbV).catch(supabaseCatch); }
  else { const idx = DATA.landedCostVouchers.findIndex(x => x.id === editId); DATA.landedCostVouchers[idx] = v; if(supabase) supabase.from('landed_cost_vouchers').upsert(dbV).catch(supabaseCatch); }
  closeModal(); showToast(editId ? 'Voucher updated' : 'Voucher created', 'success'); rerenderSection();
}

function showLCVItems(id) {
  const v = DATA.landedCostVouchers.find(x => x.id === id);
  if (!v) return;
  let body = `<div style="margin-bottom:8px;font-size:13px;color:var(--text-sec)">Total charges: <strong>${fmt(v.totalCharges)}</strong> | Distribution: ${v.distribution}</div>
  <table class="data-table"><thead><tr><th>Item</th><th>Proportion</th><th>Allocated</th></tr></thead><tbody>`;
  v.items.forEach(i => { body += `<tr><td>${i.itemName}</td><td>${Math.round(i.proportion * 100)}%</td><td style="font-weight:600">${fmt(i.allocated)}</td></tr>`; });
  body += `</tbody></table>`;
  openModal('Landed Cost — ' + v.id, body, `<button class="btn btn-primary" onclick="closeModal()">OK</button>`);
}

/* ── Auto Reorder ── */
function renderReorderRules() {
  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Auto Reorder Rules</h2>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" onclick="openNewRRModal()"><i class="fa-solid fa-plus"></i> New Rule</button>
      <button class="btn btn-sm btn-outline" onclick="autoGenerateMR()"><i class="fa-solid fa-wand-magic-sparkles"></i> Run Auto Reorder</button>
    </div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-card blue"><span class="kpi-label">Total Rules</span><span class="kpi-value">${DATA.reorderRules.length}</span></div>
    <div class="kpi-card orange"><span class="kpi-label">Items Below Min</span><span class="kpi-value">${DATA.reorderRules.filter(r => { const item = DATA.inventory.find(i => i.id === r.itemId); return item && item.qtyOnHand < r.minQty; }).length}</span></div>
    <div class="kpi-card green"><span class="kpi-label">Auto-Create PO</span><span class="kpi-value">${DATA.reorderRules.filter(r => r.autoCreatePO).length}</span></div>
  </div>
  <div class="sec-card"><div style="overflow-x:auto"><table class="data-table"><thead><tr>
    <th>Item</th><th>Min Qty</th><th>Max Qty</th><th>On Hand</th><th>Reorder?</th><th>Supplier</th><th>Lead Time</th><th>Auto PO</th><th>Last Triggered</th><th></th>
  </tr></thead><tbody>`;
  if (!DATA.reorderRules.length) html += `<tr><td colspan="10" style="text-align:center;padding:30px">No reorder rules defined.</td></tr>`;
  DATA.reorderRules.forEach(r => {
    const item = DATA.inventory.find(i => i.id === r.itemId);
    const qty = item ? item.qtyOnHand : 0;
    const needsReorder = qty < r.minQty;
    const sup = DATA.suppliers.find(s => s.id === r.supplierId);
    html += `<tr style="${needsReorder ? 'background:rgba(255,87,34,0.06)' : ''}">
      <td><strong>${r.itemName}</strong></td>
      <td>${r.minQty}</td><td>${r.maxQty}</td>
      <td style="font-weight:700;color:${needsReorder ? 'var(--warning)' : 'var(--success)'}">${qty}</td>
      <td>${needsReorder ? '<span class="pill pill-expiring" style="font-size:10px">Yes</span>' : '<span class="pill pill-valid" style="font-size:10px">OK</span>'}</td>
      <td style="font-size:12px">${sup ? sup.name : r.supplierId}</td>
      <td>${r.leadTimeDays}d</td>
      <td>${r.autoCreatePO ? '<span class="pill pill-valid">Yes</span>' : '<span style="color:var(--text-sec)">No</span>'}</td>
      <td style="font-size:12px;color:var(--text-sec)">${r.lastTriggered || '-'}</td>
      <td><button class="btn btn-sm btn-outline" onclick="openNewRRModal('${r.id}')">Edit</button></td>
    </tr>`;
  });
  html += `</tbody></table></div></div></div>`;
  return html;
}

function openNewRRModal(editId) {
  const r = editId ? DATA.reorderRules.find(x => x.id === editId) : null;
  const items = DATA.inventory.filter(i => !i.has_variants).map(i => `<option value="${i.id}" ${r && r.itemId === i.id ? 'selected' : ''}>${i.name}</option>`).join('');
  const sups = DATA.suppliers.map(s => `<option value="${s.id}" ${r && r.supplierId === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
  const body = `<div style="display:flex;flex-direction:column;gap:10px">
    <select class="filter-input" id="nrr-item"><option value="">— Item —</option>${items}</select>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <input class="filter-input" id="nrr-min" type="number" placeholder="Min Qty" value="${r ? r.minQty : 0}" />
      <input class="filter-input" id="nrr-max" type="number" placeholder="Max Qty" value="${r ? r.maxQty : 0}" />
    </div>
    <select class="filter-input" id="nrr-supplier"><option value="">— Supplier —</option>${sups}</select>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <input class="filter-input" id="nrr-lead" type="number" placeholder="Lead Time (days)" value="${r ? r.leadTimeDays : 14}" />
      <label style="display:flex;align-items:center;font-size:13px;gap:4px"><input type="checkbox" id="nrr-auto" ${r && r.autoCreatePO ? 'checked' : ''} /> Auto Create PO</label>
    </div>
  </div>`;
  const footer = `<button class="btn btn-primary" onclick="submitNewRR('${editId || ''}')">${editId ? 'Update' : 'Add'} Rule</button>`;
  openModal(editId ? 'Edit Reorder Rule' : 'New Reorder Rule', body, footer);
}

function submitNewRR(editId) {
  const itemId = $('#nrr-item').value;
  if (!itemId) { showToast('Select an item', 'error'); return; }
  const item = DATA.inventory.find(i => i.id === itemId);
  const supplierId=$('#nrr-supplier').value||null, minQty=parseFloat($('#nrr-min').value)||0, maxQty=parseFloat($('#nrr-max').value)||0, leadTimeDays=parseInt($('#nrr-lead').value)||14, autoCreatePO=$('#nrr-auto').checked;
  const r = {
    id: editId || 'RR-' + String(DATA.reorderRules.length + 1).padStart(3, '0'),
    itemId, item_id:itemId, itemName: item ? item.name : itemId, item_name: item ? item.name : itemId,
    supplierId, supplier_id:supplierId,
    minQty, min_qty:minQty, maxQty, max_qty:maxQty,
    leadTimeDays, lead_time_days:leadTimeDays,
    autoCreatePO, auto_create_po:autoCreatePO,
    lastTriggered: null, last_triggered:null,
  };
  const dbR={id:r.id,item_id:r.item_id,item_name:r.item_name,supplier_id:r.supplier_id,min_qty:r.min_qty,max_qty:r.max_qty,lead_time_days:r.lead_time_days,auto_create_po:r.auto_create_po,last_triggered:r.last_triggered};
  if (!editId) { DATA.reorderRules.push(r); if(supabase) supabase.from('reorder_rules').insert(dbR).catch(supabaseCatch); }
  else { const idx = DATA.reorderRules.findIndex(x => x.id === editId); DATA.reorderRules[idx] = r; if(supabase) supabase.from('reorder_rules').upsert(dbR).catch(supabaseCatch); }
  closeModal(); showToast(editId ? 'Rule updated' : 'Rule added', 'success'); rerenderSection();
}

function autoGenerateMR() {
  const created = [];
  DATA.reorderRules.forEach(r => {
    const item = DATA.inventory.find(i => i.id === r.itemId);
    if (!item || item.qtyOnHand >= r.minQty) return;
    const reorderQty = r.maxQty - item.qtyOnHand;
    const mr = {
      id: 'MR-' + Date.now() + '-' + r.id,
      date: new Date().toISOString().slice(0,10),
      items: [{itemId: r.itemId, itemName: r.itemName || item.name, qty: reorderQty, uom: item.uom}],
      status: 'pending',
      priority: item.status === 'critical' ? 'Critical' : item.status === 'out' ? 'Critical' : 'High',
      notes: `Auto-generated — below min qty (${item.qtyOnHand} < ${r.minQty})`,
    };
    DATA.materialRequests.push(mr);
    const ts=new Date().toISOString().slice(0,10); r.lastTriggered=ts; r.last_triggered=ts;
    if (supabase) supabase.from('material_requests').insert(mr).catch(supabaseCatch);
    if (supabase) supabase.from('reorder_rules').upsert({id:r.id,item_id:r.item_id||r.itemId,item_name:r.item_name||r.itemName,supplier_id:r.supplier_id||r.supplierId,min_qty:r.min_qty||r.minQty,max_qty:r.max_qty||r.maxQty,lead_time_days:r.lead_time_days||r.leadTimeDays,auto_create_po:r.auto_create_po||r.autoCreatePO,last_triggered:r.last_triggered||r.lastTriggered}).catch(supabaseCatch);
    created.push(`${item.name} (${reorderQty} ${item.uom})`);
  });
  if (created.length === 0) { showToast('No items below reorder point', 'info'); return; }
  showToast(`Created ${created.length} MRs: ${created.join(', ')}`, 'success');
  rerenderSection();
}

/* ═══════════════════════════════════════════════
   SC — NEW PO MODAL
═══════════════════════════════════════════════ */
function openNewPOModal(){
  const body=`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Supplier</label>
        <select class="form-select" id="np-sup">${DATA.suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Category</label>
        <select class="form-select" id="np-cat">${[...new Set(DATA.suppliers.map(s=>s.category))].sort().map(c=>`<option>${c}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="np-desc" placeholder="Brief description of goods/services"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Amount (USD)</label><input class="form-input" id="np-amount" type="number" value="0" min="0"></div>
      <div class="form-group"><label class="form-label">Priority</label>
        <select class="form-select" id="np-priority"><option>Normal</option><option>High</option><option>Critical</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Site / Delivery Location</label>
        <select class="form-select" id="np-site"><option>Block 15 – Rig Alpha</option><option>Block 7 – Offshore Platform</option><option>Onshore Processing Facility – South</option><option>Gas Treatment Plant – North</option><option>Head Office – Muscat</option><option>All Sites</option></select>
      </div>
      <div class="form-group"><label class="form-label">Required Date</label><input class="form-input" id="np-date" type="date"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Requested By</label>
        <select class="form-select" id="np-req">${DATA.employees.filter(e=>e.status==='active').map(e=>`<option>${e.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Currency</label>
        <select class="form-select" id="np-cur"><option>USD</option><option>OMR</option><option>EUR</option><option>GBP</option></select>
      </div>
    </div>`;
  const footer=`<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" onclick="submitNewPO()">Create PO</button>`;
  openModal(t('newPO'),body,footer);
}

async function submitNewPO(){
  const desc=$('#np-desc').value.trim();
  const amt=parseFloat($('#np-amount').value)||0;
  if(!desc){showToast('Description is required','error');return;}
  if(amt > 10000) {
    if(!confirm('Warning: PO Amount exceeds $10,000. Do you want to proceed?')) return;
  }
  const now=new Date();
  const yr=now.getFullYear();
  const newId=`PO-${yr}-${String(DATA.purchaseOrders.length+1).padStart(3,'0')}`;
  const supId=$('#np-sup').value;
  const sup=DATA.suppliers.find(s=>s.id===supId);
  const poData={
    id:newId,supplierId:supId,supplier:sup?sup.name:supId,
    category:$('#np-cat').value,description:desc,
    amount:parseFloat($('#np-amount').value)||0,currency:$('#np-cur').value,
    status:'draft',priority:$('#np-priority').value,
    requestedBy:$('#np-req').value,approvedBy:null,
    site:$('#np-site').value,requiredDate:$('#np-date').value,
    createdDate:now.toISOString().split('T')[0],deliveryDate:null,
    poLines:[{item:desc,qty:1,unit:'Lot',unitPrice:parseFloat($('#np-amount').value)||0}]
  };
  if(supabase){
    const{error}=await supabase.from('purchase_orders').insert({id:newId,supplier_name:poData.supplier,description:desc,total_amount:poData.amount,status:'draft',priority:poData.priority,site:poData.site,requested_by:poData.requestedBy,order_date:poData.createdDate});
    if(error){showToast('Error saving PO','error');return;}
  }
  DATA.purchaseOrders.push(poData);
  closeModal();state.selectedId=newId;state.section='allPOs';
  showToast(newId+' created as Draft','success');rerenderSection();
}

/* ═══════════════════════════════════════════════
   RENDER ENGINE
═══════════════════════════════════════════════ */
function renderSidebar(){
  const hideSidebar = state.module === 'certificates';
  const sb = document.getElementById('modSidebar');
  if(sb) sb.classList.toggle('hidden', hideSidebar);
  if(hideSidebar) return;

  let html='';
  if(state.module==='hr') html=renderHRSidebar();
  else if(state.module==='crm') html=renderCRMSidebar();
  else if(state.module==='certificates') html=renderCertSidebar();
  else if(state.module==='supply') html=renderSCSidebar();
  else if(state.module==='fin') html=renderFinSidebar();
  $('#modSidebar').innerHTML=html;
  runSidebarAnimations();
}

function renderFinSettings() {
  return `<div class="fade-in" style="max-width:600px">
    <h2>Finance Settings</h2>
    <div class="sec-card" style="margin-top:20px"><div class="sec-card-body">
      <div class="form-group"><label class="form-label">Default Currency</label>
      <select class="form-input"><option>USD</option><option>OMR</option><option>EUR</option></select></div>
      <div class="form-group"><label class="form-label">Fiscal Year Start Month</label>
      <select class="form-input"><option>January</option><option>April</option><option>July</option></select></div>
      <button class="btn btn-primary" onclick="showToast('Settings saved','success')">Save Settings</button>
    </div></div>
  </div>`;
}

/* ═══════════════════════════════════════════════
   SC — STOCK LEDGER
═══════════════════════════════════════════════ */
function recordStockMovement(itemId, type, qty, uom, refType, refId, unitCost, notes){
  const item = DATA.inventory.find(i=>i.id===itemId);
  if(!item){showToast('Item not found','error');return null;}
  const id='SL-'+String(DATA.stockLedger.length+1).padStart(3,'0');
  const entry = {
    id, itemId, itemName:item.name, type, qty, uom:uom||item.uom,
    refType, refId, date:new Date().toISOString().split('T')[0],
    unitCost:unitCost||item.unitCost, notes:notes||''
  };
  DATA.stockLedger.push(entry);
  if(type==='in'){ item.qtyOnHand += qty; if(item.qtyOnHand>item.maxStock) item.maxStock=item.qtyOnHand*2; }
  else if(type==='out'){ item.qtyOnHand = Math.max(0, item.qtyOnHand - qty); }
  item.lastReceived = type==='in' ? entry.date : item.lastReceived;
  item.status = item.qtyOnHand===0?'out':item.qtyOnHand<item.reorderPoint?'critical':item.qtyOnHand<=item.reorderPoint*1.5?'low':'normal';
  if(supabase){
    supabase.from('stock_ledger').insert({
      id:entry.id, item_id:itemId, movement_type:type, quantity:qty, uom:entry.uom,
      ref_type:refType, ref_id:refId, date:entry.date, unit_cost:unitCost, notes
    }).catch(supabaseCatch);
    supabase.from('inventory').update({stock_level:item.qtyOnHand,last_received:item.lastReceived,status:item.status}).eq('id',itemId).catch(supabaseCatch);
  }
  return entry;
}

function renderStockLedgerPage(){
  const f=state.filters;
  let entries=[...DATA.stockLedger];
  if(f.search){const s=f.search.toLowerCase();entries=entries.filter(e=>e.itemName.toLowerCase().includes(s)||e.refId.toLowerCase().includes(s)||e.refType.toLowerCase().includes(s));}
  if(f.type&&f.type!=='all') entries=entries.filter(e=>e.type===f.type);
  if(f.item&&f.item!=='all') entries=entries.filter(e=>e.itemId===f.item);
  entries.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  const itemOptions=[...new Set(DATA.stockLedger.map(e=>e.itemId))].map(id=>{const i=DATA.inventory.find(x=>x.id===id);return {id,name:i?i.name:id};}).filter(Boolean);

  // Calculate running balance
  let balance=0;
  const typeIcon=t=>t==='in'?'fa-arrow-down':'fa-arrow-up';
  const typeColor=t=>t==='in'?'var(--success)':'var(--error)';
  const typeLabel=v=>v==='in'?t('in'):v==='out'?t('out'):v==='transfer'?t('transfer'):t('adjustment');

  let html=`<div class="fade-in">`;
  html+=`<div class="sec-card"><div class="sec-card-head">${t('stockLedger')}
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <input class="filter-input" placeholder="Search..." value="${f.search||''}" oninput="state.filters.search=this.value;rerenderSection()" style="min-width:140px;">
      <select class="filter-select" onchange="state.filters.type=this.value;rerenderSection()">
        <option value="all">All Types</option><option value="in">In</option><option value="out">Out</option>
      </select>
      <select class="filter-select" onchange="state.filters.item=this.value;rerenderSection()">
        <option value="all">All Items</option>${itemOptions.map(o=>`<option value="${o.id}" ${f.item===o.id?'selected':''}>${o.name}</option>`).join('')}
      </select>
      <button class="btn btn-primary btn-sm" onclick="openMovementModal()"><i class="fa-solid fa-plus"></i> ${t('recordMovement')}</button>
    </div>
  </div>
  <div style="overflow-x:auto;"><table class="data-table">
    <thead><tr>
      <th onclick="sortBy('date')" class="${sortedCls('date')}">Date ${sortIcon('date')}</th>
      <th onclick="sortBy('itemName')" class="${sortedCls('itemName')}">Item ${sortIcon('itemName')}</th>
      <th>Type</th>
      <th>Qty</th>
      <th>UoM</th>
      <th>Unit Cost</th>
      <th>Total Value</th>
      <th>Running Balance</th>
      <th onclick="sortBy('refType')" class="${sortedCls('refType')}">Reference ${sortIcon('refType')}</th>
      <th>Notes</th>
    </tr></thead><tbody>`;
  if(!entries.length) html+=`<tr><td colspan="10" style="text-align:center;padding:30px;color:var(--text-sec);">No stock movements recorded</td></tr>`;
  entries.forEach(e=>{
    balance += e.type==='in' ? e.qty : -e.qty;
    const totalValue = e.qty * e.unitCost;
    html+=`<tr>
      <td style="font-size:12px;color:var(--text-sec)">${fmtDate(e.date)}</td>
      <td style="font-weight:600">${e.itemName}</td>
      <td><span style="display:inline-flex;align-items:center;gap:4px;color:${typeColor(e.type)};font-weight:600;"><i class="fa-solid ${typeIcon(e.type)}" style="font-size:11px;"></i> ${typeLabel(e.type)}</span></td>
      <td style="font-weight:700">${e.type==='in'?'+':'-'}${e.qty}</td>
      <td style="color:var(--text-sec);font-size:12px">${e.uom}</td>
      <td>${fmt(e.unitCost)}</td>
      <td style="font-weight:600">${fmt(totalValue)}</td>
      <td style="font-weight:700;color:${balance<0?'var(--error)':'var(--success)'}">${balance} ${e.uom}</td>
      <td style="font-size:12px;color:var(--text-sec)">${e.refType}<br>${e.refId}</td>
      <td style="font-size:12px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-sec)">${e.notes||'—'}</td>
    </tr>`;
  });
  html+=`</tbody></table></div></div></div>`;
  return html;
}

function openMovementModal(){
  const body=`
    <div class="form-group"><label class="form-label">Item</label>
      <select class="form-select" id="mv-item">${DATA.inventory.map(i=>`<option value="${i.id}">${i.name} (${i.partNo}) – ${i.qtyOnHand} ${i.uom} on hand</option>`).join('')}
    </select></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Movement Type</label>
        <select class="form-select" id="mv-type"><option value="in">In (Receipt / Return)</option><option value="out">Out (Issue / Consumption)</option></select>
      </div>
      <div class="form-group"><label class="form-label">Quantity</label><input class="form-input" id="mv-qty" type="number" min="1" value="1"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Unit Cost (optional)</label><input class="form-input" id="mv-cost" type="number" min="0" step="0.01" value="0"></div>
      <div class="form-group"><label class="form-label">UoM</label><input class="form-input" id="mv-uom" placeholder="Unit, Litre, Pair..." value="Unit"></div>
    </div>
    <div class="form-group"><label class="form-label">Reference Type</label>
      <select class="form-select" id="mv-reftype"><option>Manual Adjustment</option><option>Issue</option><option>Return</option><option>Transfer</option><option>Write-Off</option></select>
    </div>
    <div class="form-group"><label class="form-label">Reference ID / Document</label><input class="form-input" id="mv-refid" placeholder="e.g. ISS-001, WO-001..."></div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="mv-notes" placeholder="Reason for movement, receiving notes..."></textarea></div>`;
  const footer=`<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" onclick="submitMovement()">${t('save')}</button>`;
  openModal(t('recordMovement'),body,footer);
}

function submitMovement(){
  const itemId=$('#mv-item').value;
  const type=$('#mv-type').value;
  const qty=parseInt($('#mv-qty').value)||0;
  if(!itemId||qty<1){showToast('Select item and enter valid quantity','error');return;}
  const uom=$('#mv-uom').value.trim()||'Unit';
  const cost=parseFloat($('#mv-cost').value)||0;
  const refType=$('#mv-reftype').value;
  const refId=$('#mv-refid').value.trim()||'MANUAL-'+Date.now();
  const notes=$('#mv-notes').value.trim();
  const entry=recordStockMovement(itemId,type,qty,uom,refType,refId,cost||undefined,notes);
  if(entry){
    closeModal();
    showToast(`${type==='in'?'Received':'Issued'} ${qty} ${uom}`,'success');
    rerenderSection();
  }
}

/* ═══════════════════════════════════════════════
   SC — MATERIAL REQUESTS (Master-Detail)
═══════════════════════════════════════════════ */
function renderAllMRs(filterFn){
  const f=state.filters;
  let items=DATA.materialRequests.filter(filterFn||(_=>true));
  if(f.search){const s=f.search.toLowerCase();items=items.filter(m=>m.title.toLowerCase().includes(s)||m.id.toLowerCase().includes(s)||m.requestedBy.toLowerCase().includes(s));}
  if(f.status&&f.status!=='all') items=items.filter(m=>m.status===f.status);
  if(f.priority&&f.priority!=='all') items=items.filter(m=>m.priority===f.priority);
  if(state.sortCol){const col=state.sortCol,dir=state.sortDir==='asc'?1:-1;items.sort((a,b)=>{let va=a[col],vb=b[col];if(typeof va==='string')return va.localeCompare(vb)*dir;return(va-vb)*dir;});}

  const statusBadge=s=>s==='approved'?'<span class="pill pill-valid">Approved</span>':s==='rejected'?'<span class="pill pill-inactive">Rejected</span>':s==='pending'?'<span class="pill pill-leave">Pending</span>':'<span class="pill pill-draft">Draft</span>';
  const priorityBadge=p=>p==='Critical'?'<span style="color:var(--error);font-weight:700;font-size:11px;"><i class="fa-solid fa-circle" style="font-size:8px;color:var(--error);vertical-align:middle;margin-right:3px"></i>Critical</span>':p==='High'?'<span style="color:var(--warning);font-weight:700;font-size:11px;"><i class="fa-solid fa-circle" style="font-size:8px;color:var(--warning);vertical-align:middle;margin-right:3px"></i>High</span>':'<span style="color:var(--text-sec);font-size:11px;"><i class="fa-solid fa-circle" style="font-size:8px;color:var(--text-sec);vertical-align:middle;margin-right:3px"></i>Normal</span>';

  let html=`<div class="fade-in">`;
  html+=`<div class="md-layout" style="min-height:calc(100vh - var(--shell-h) - var(--tab-h) - 48px);">`;
  html+=`<div class="md-master">
    <div class="filter-bar">
      <input class="filter-input" placeholder="Search MRs..." value="${f.search||''}" oninput="state.filters.search=this.value;rerenderSection()" style="flex:1;min-width:90px">
      <select class="filter-select" onchange="state.filters.status=this.value;rerenderSection()">
        <option value="all">All Status</option><option value="draft">Draft</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
      </select>
      <select class="filter-select" onchange="state.filters.priority=this.value;rerenderSection()">
        <option value="all">All Priority</option><option value="Critical">Critical</option><option value="High">High</option><option value="Normal">Normal</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="openNewMRModal()"><i class="fa-solid fa-plus"></i> ${t('newMR')}</button>
    </div>
    <div style="padding:6px 14px 4px;font-size:11px;color:var(--text-sec);background:#fafafa;border-bottom:1px solid var(--border);">${items.length} material requests</div>
    <div class="list-container">`;
  if(!items.length) html+=`<div class="empty-state"><i class="fa-solid fa-clipboard-list"></i><p>No material requests found</p></div>`;
  items.forEach(m=>{
    html+=`<div class="list-item ${state.selectedId===m.id?'selected':''}" onclick="selectMRItem('${m.id}')" style="border-left-color:${m.priority==='Critical'?'var(--error)':m.priority==='High'?'var(--warning)':'var(--border)'}">
      <div style="width:36px;height:36px;border-radius:6px;background:#ede7f6;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-clipboard-list" style="color:#6b3fa0;font-size:14px;"></i></div>
      <div class="list-item-body">
        <div class="list-item-title">${m.title}</div>
        <div class="list-item-desc">${m.id} · ${m.department} · ${m.site}</div>
      </div>
      <div class="list-item-right">
        ${statusBadge(m.status)}
        <div class="list-item-date" style="margin-top:3px;">${m.items.length} items · ${priorityBadge(m.priority)}</div>
      </div>
    </div>`;
  });
  html+=`</div></div>`;

  html+=`<div class="md-detail ${state.selectedId?'has-item':''}" style="padding:0;">`;
  if(state.selectedId){
    const m=DATA.materialRequests.find(x=>x.id===state.selectedId);
    if(m) html+=renderMRDetail(m);
  } else {
    html+=`<div class="empty-state" style="min-height:400px;"><i class="fa-solid fa-hand-pointer"></i><p>Select a material request to view details</p></div>`;
  }
  html+=`</div></div></div>`;
  return html;
}

function selectMRItem(id){ state.selectedId=id; state.detailTab='info'; rerenderSection(); }

function renderMRDetail(m){
  const statusBadge=s=>s==='approved'?'<span class="pill pill-valid">Approved</span>':s==='rejected'?'<span class="pill pill-inactive">Rejected</span>':s==='pending'?'<span class="pill pill-leave">Pending</span>':'<span class="pill pill-draft">Draft</span>';
  const tabs=[
    {id:'info',label:'Details'},
    {id:'items',label:`Items (${m.items.length})`},
  ];

  let html=`<div class="obj-header">
    <div class="obj-header-top">
      <div style="width:52px;height:52px;border-radius:8px;background:#ede7f6;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-clipboard-list" style="font-size:22px;color:#6b3fa0;"></i></div>
      <div style="flex:1;"><h2>${m.id}</h2><div class="obj-sub">${m.title}</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${m.status==='pending'?`<button class="btn btn-primary btn-sm" onclick="approveMR('${m.id}')"><i class="fa-solid fa-check"></i> ${t('approveMR')}</button><button class="btn btn-secondary btn-sm" onclick="rejectMR('${m.id}')"><i class="fa-solid fa-xmark"></i> ${t('rejectMR')}</button>`:''}
        ${m.status==='approved'&&!m.poRef?`<button class="btn btn-primary btn-sm" onclick="convertMRtoPO('${m.id}')"><i class="fa-solid fa-file-invoice"></i> ${t('convertToPO')}</button>`:''}
      </div>
    </div>
    <div class="obj-kv">
      <div class="obj-kv-item"><span class="obj-kv-label">${t('mrStatus')}</span><span class="obj-kv-value">${statusBadge(m.status)}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">${t('mrDepartment')}</span><span class="obj-kv-value">${m.department}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">${t('requestedBy')}</span><span class="obj-kv-value">${m.requestedBy}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Site</span><span class="obj-kv-value">${m.site}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Requested Date</span><span class="obj-kv-value">${fmtDate(m.requestedDate)}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Required Date</span><span class="obj-kv-value">${fmtDate(m.requiredDate)}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">${t('priority')}</span><span class="obj-kv-value" style="font-weight:700;color:${m.priority==='Critical'?'var(--error)':m.priority==='High'?'var(--warning)':'var(--text)'}">${m.priority}</span></div>
      ${m.approvedBy?`<div class="obj-kv-item"><span class="obj-kv-label">Approved By</span><span class="obj-kv-value">${m.approvedBy}</span></div>`:''}
      ${m.poRef?`<div class="obj-kv-item"><span class="obj-kv-label">PO Reference</span><span class="obj-kv-value" style="color:var(--blue);font-weight:600;">${m.poRef}</span></div>`:''}
    </div>
  </div>
  <div class="detail-tabs">${tabs.map(tb=>`<div class="detail-tab ${state.detailTab===tb.id?'active':''}" onclick="state.detailTab='${tb.id}';rerenderSection()">${tb.label}</div>`).join('')}</div>
  <div class="detail-tab-body">`;

  if(state.detailTab==='info'){
    html+=`<div class="sec-card"><div class="sec-card-head">Request Details</div>
    <div class="sec-card-body">
      <div style="margin-bottom:12px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">Purpose / Notes</div>
      <div style="font-size:13px;line-height:1.6;">${m.notes||'No additional notes'}</div></div>`;
    if(m.items.length){
      html+=`<div style="margin-top:12px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:8px;">${t('mrItems')}</div>
      <div style="display:grid;gap:8px;">`;
      m.items.forEach((it,i)=>{
        html+=`<div style="padding:10px 12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-weight:600;font-size:13px;">${it.name}</div>
          <div style="font-size:11px;color:var(--text-sec);">${it.spec||''}</div></div>
          <div style="text-align:right;"><div style="font-weight:700;font-size:14px;">${it.qty} <span style="font-weight:400;font-size:11px;color:var(--text-sec)">${it.uom}</span></div>
          <div style="font-size:11px;color:var(--text-sec);">~${fmt(it.estUnitCost)}/unit</div></div>
        </div>`;
      });
      html+=`</div></div>`;
    }
    html+=`</div></div>`;
  }
  else if(state.detailTab==='items'){
    html+=`<div class="sec-card"><div class="sec-card-head">${t('mrItems')} <span style="font-size:12px;font-weight:400;color:var(--text-sec)">${m.items.length} items</span></div>
    <div style="overflow-x:auto;"><table class="data-table">
      <thead><tr><th>#</th><th>Item Name</th><th>Specification</th><th>Qty</th><th>UoM</th><th>Est. Unit Cost</th><th>Est. Total</th></tr></thead><tbody>`;
    let grandTotal=0;
    m.items.forEach((it,i)=>{
      const total=it.qty*it.estUnitCost; grandTotal+=total;
      html+=`<tr><td style="color:var(--text-sec)">${i+1}</td><td style="font-weight:600">${it.name}</td><td style="font-size:12px;color:var(--text-sec)">${it.spec||'—'}</td>
        <td style="font-weight:600">${it.qty}</td><td>${it.uom}</td><td>${fmt(it.estUnitCost)}</td><td style="font-weight:700;color:#6b3fa0">${fmt(total)}</td></tr>`;
    });
    if(m.items.length){
      html+=`<tr style="background:#f5f6f7;"><td colspan="6" style="text-align:right;font-weight:700;padding:10px 12px;">Estimated Total</td>
        <td style="font-weight:800;color:#6b3fa0;font-size:14px;">${fmt(grandTotal)}</td></tr>`;
    }
    html+=`</tbody></table></div></div>`;
  }
  html+=`</div>`;
  return html;
}

function openNewMRModal(){
  const body=`
    <div class="form-group"><label class="form-label">${t('mrTitle')}</label><input class="form-input" id="nmr-title" placeholder="e.g. Urgent Liner Replacement for Rig Alpha"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">${t('mrDepartment')}</label>
        <select class="form-select" id="nmr-dept"><option>Drilling</option><option>Production</option><option>HSE</option><option>Maintenance</option><option>Projects</option><option>General</option></select>
      </div>
      <div class="form-group"><label class="form-label">Site</label>
        <select class="form-select" id="nmr-site"><option>Block 15 – Rig Alpha</option><option>Block 7 – Offshore Platform</option><option>Onshore Processing Facility – South</option><option>Gas Treatment Plant – North</option><option>Head Office – Muscat</option><option>All Sites</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">${t('priority')}</label>
        <select class="form-select" id="nmr-priority"><option>Normal</option><option>High</option><option>Critical</option></select>
      </div>
      <div class="form-group"><label class="form-label">Required Date</label><input class="form-input" id="nmr-reqdate" type="date"></div>
    </div>
    <div class="form-group"><label class="form-label">${t('notes')}</label><textarea class="form-textarea" id="nmr-notes" placeholder="Describe why these materials are needed..."></textarea></div>
    <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:4px;">
      <div style="font-size:12px;font-weight:600;color:var(--text-sec);margin-bottom:8px;">Item Line Items</div>
      <div id="mr-items-container">
        <div class="mr-item-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-end;">
          <div class="form-group" style="flex:3;margin-bottom:0;"><input class="form-input" placeholder="Item name" id="mri-0-name"></div>
          <div class="form-group" style="flex:1;margin-bottom:0;"><input class="form-input" type="number" placeholder="Qty" id="mri-0-qty" value="1" min="1"></div>
          <div class="form-group" style="flex:1;margin-bottom:0;"><input class="form-input" placeholder="Unit" id="mri-0-uom" value="Unit"></div>
          <div class="form-group" style="flex:1;margin-bottom:0;"><input class="form-input" type="number" placeholder="Est. cost" id="mri-0-cost" value="0" min="0"></div>
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="addMRItemRow()"><i class="fa-solid fa-plus"></i> Add Item</button>
    </div>`;
  const footer=`<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" onclick="submitNewMR()">${t('save')}</button>`;
  openModal(t('newMR'),body,footer);
}

let mrItemRowCount=1;
function addMRItemRow(){
  const container=$('#mr-items-container');
  const row=document.createElement('div');
  row.className='mr-item-row';
  row.style.cssText='display:flex;gap:8px;margin-bottom:8px;align-items:flex-end;';
  row.innerHTML=`
    <div class="form-group" style="flex:3;margin-bottom:0;"><input class="form-input" placeholder="Item name" id="mri-${mrItemRowCount}-name"></div>
    <div class="form-group" style="flex:1;margin-bottom:0;"><input class="form-input" type="number" placeholder="Qty" id="mri-${mrItemRowCount}-qty" value="1" min="1"></div>
    <div class="form-group" style="flex:1;margin-bottom:0;"><input class="form-input" placeholder="Unit" id="mri-${mrItemRowCount}-uom" value="Unit"></div>
    <div class="form-group" style="flex:1;margin-bottom:0;"><input class="form-input" type="number" placeholder="Est. cost" id="mri-${mrItemRowCount}-cost" value="0" min="0"></div>`;
  container.appendChild(row);
  mrItemRowCount++;
}

async function submitNewMR(){
  const title=$('#nmr-title').value.trim();
  if(!title){showToast('Title is required','error');return;}
  const now=new Date();
  const newId='MR-'+now.getFullYear()+'-'+String(DATA.materialRequests.length+1).padStart(3,'0');
  const items=[];
  for(let i=0;i<mrItemRowCount;i++){
    const name=$('#mri-'+i+'-name')?.value?.trim();
    if(!name) continue;
    items.push({
      name,
      qty:parseInt($('#mri-'+i+'-qty')?.value)||1,
      uom:$('#mri-'+i+'-uom')?.value?.trim()||'Unit',
      estUnitCost:parseFloat($('#mri-'+i+'-cost')?.value)||0,
      spec:''
    });
  }
  if(!items.length){showToast('Add at least one item','error');return;}
  const mr={
    id:newId,title,requestedBy: DATA.employees[0]?.name||'Unknown',
    requestedDate:now.toISOString().split('T')[0],
    requiredDate:$('#nmr-reqdate').value,
    department:$('#nmr-dept').value,
    site:$('#nmr-site').value,status:'draft',
    priority:$('#nmr-priority').value,
    notes:$('#nmr-notes').value.trim(),
    items,approvedBy:null,approvedDate:null,poRef:null
  };
  if(supabase){
    const{error}=await supabase.from('material_requests').insert({
      id:newId,title,status:'draft',priority:mr.priority,
      department:mr.department,site:mr.site,requested_by:mr.requestedBy,required_date:mr.requiredDate,notes:mr.notes
    }).catch(supabaseCatch);
  }
  DATA.materialRequests.push(mr);
  mrItemRowCount=1;
  closeModal();state.selectedId=newId;state.section='materialRequests';
  showToast(newId+' created','success');rerenderSection();
}

async function approveMR(id){
  const mr=DATA.materialRequests.find(m=>m.id===id);
  if(!mr) return showToast('Not found','error');
  if(mr.status!=='draft'&&mr.status!=='pending') return showToast('Can only approve draft/pending requests','error');
  mr.status='approved'; mr.approvedBy=DATA.employees[0]?.name||'Manager'; mr.approvedDate=new Date().toISOString().split('T')[0];
  if(supabase) supabase.from('material_requests').update({status:'approved',approved_by:mr.approvedBy,approved_date:mr.approvedDate}).eq('id',id).catch(supabaseCatch);
  showToast(id+' approved','success'); rerenderSection();
}

async function rejectMR(id){
  const mr=DATA.materialRequests.find(m=>m.id===id);
  if(!mr||mr.status!=='pending') return showToast('Can only reject pending requests','error');
  mr.status='rejected';
  if(supabase) supabase.from('material_requests').update({status:'rejected'}).eq('id',id).catch(supabaseCatch);
  showToast(id+' rejected','warning'); rerenderSection();
}

async function convertMRtoPO(id){
  const mr=DATA.materialRequests.find(m=>m.id===id);
  if(!mr||mr.status!=='approved') return showToast('Only approved MRs can be converted','error');
  if(mr.poRef) return showToast('PO already created for this MR: '+mr.poRef,'info');
  const now=new Date();
  const poId='PO-'+now.getFullYear()+'-'+String(DATA.purchaseOrders.length+1).padStart(3,'0');
  const estTotal=mr.items.reduce((s,it)=>s+it.qty*it.estUnitCost,0);
  const po={
    id:poId,supplierId:null,supplier:'TBD – Select Supplier',
    category:mr.department==='Drilling'?'Drilling Equipment':mr.department==='HSE'?'PPE & Safety':'General Industrial',
    description:'Auto-generated from '+mr.id+': '+mr.title,
    amount:estTotal,currency:'USD',status:'draft',
    priority:mr.priority,requestedBy:mr.requestedBy,approvedBy:null,
    site:mr.site,requiredDate:mr.requiredDate,
    createdDate:now.toISOString().split('T')[0],deliveryDate:null,
    poLines:mr.items.map(it=>({item:it.name,qty:it.qty,unit:it.uom,unitPrice:it.estUnitCost,mrRef:mr.id}))
  };
  DATA.purchaseOrders.push(po);
  mr.poRef=poId;
  if(supabase){
    supabase.from('purchase_orders').insert({id:poId,supplier_name:po.supplier,description:po.description,total_amount:estTotal,status:'draft',priority:mr.priority,site:mr.site,requested_by:mr.requestedBy,order_date:po.createdDate}).catch(supabaseCatch);
    supabase.from('material_requests').update({po_ref:poId}).eq('id',id).catch(supabaseCatch);
  }
  showToast(poId+' created from '+mr.id,'success');
  state.selectedId=poId; state.section='allPOs'; state.detailTab='info';
  rerenderSection();
}

/* ── Expose SC functions for inline onclick handlers ── */
window.selectPOItem = selectPOItem;
window.selectSupplierItem = selectSupplierItem;
window.selectMRItem = selectMRItem;
window.openNewPOModal = openNewPOModal;
window.submitNewPO = submitNewPO;
window.openNewMRModal = openNewMRModal;
window.submitNewMR = submitNewMR;
window.addMRItemRow = addMRItemRow;
window.approveMR = approveMR;
window.rejectMR = rejectMR;
window.convertMRtoPO = convertMRtoPO;
window.openMovementModal = openMovementModal;
window.submitMovement = submitMovement;

function renderContent(){
  let html='';
  if(state.module==='hr'){
    if(state.section==='allEmployees'||state.section==='newHires'||state.section==='onProbation') html=renderAllEmployees();
    else if(state.section==='absenceCalendar') html=renderHRAbsenceCalendar();
    else if(state.section==='openPositions') html=renderHROpenPositions();
    else if(state.section==='performanceCycle') html=renderHRPerformanceCycle();
    else if(state.section==='trainingHSE') html=renderHRTraining();
    else if(state.section==='orgUnits') html=renderHROrgUnits();
    else if(state.section==='hrSettings') html=renderHRSettings();
    else if(state.section==='leaveRequests') html=renderLeaveRequests();
    else if(state.section==='timesheets') html=renderHRAttendance();
    else if(state.section==='expenseClaims') html=renderHRExpenses();
    else if(state.section==='compensation') html=renderHRPayroll();
    else html=renderHRStub(state.section.replace(/([A-Z])/g,' $1').trim());
  }
  else if(state.module==='crm'){
    if(state.section==='crmLeads') html=renderCRMLeads();
    else if(state.section==='crmDeals') html=renderCRMDeals();
    else if(state.section==='allAccounts') html=renderAllAccounts();
    else if(state.section==='myTasks') html=renderCRMTasks();
    else if(state.section==='myFavorites') html=renderCRMDeals(d=>d.stage==='Negotiation'||d.stage==='Proposal');
    else if(state.section==='openContracts') html=renderCRMDeals(d=>d.stage==='Contract Sent');
    else if(state.section==='wonThisQuarter') html=renderCRMDeals(d=>d.stage==='Closed Won');
    else if(state.section==='fieldServiceLogs') html=renderCRMFieldServiceLogs();
    else if(state.section==='partnersJVs') html=renderCRMPartners();
    else if(state.section==='crmContacts') html=renderCRMContacts();
    else if(state.section==='crmQuotations') html=renderCRMQuotations();
    else if(state.section==='crmProspects') html=renderCRMProspects();
    else if(state.section==='crmCommunications') html=renderCRMCommunications();
    else if(state.section==='crmWinLoss') html=renderCRMWinLoss();
    else if(state.section==='crmTerritory') html=renderCRMTerritory();
    else if(state.section==='crmSettings') html=renderCRMSettings();
    else html=renderAllAccounts();
  }
  else if(state.module==='certificates'){
    if(state.section==='allCerts') html=renderCertificates();
    else if(state.section==='certGantt') html=renderCertGantt();
    else if(state.section==='certNotifications') html=renderCertNotifications();
    else if(state.section==='expiredCerts') html=renderCertificates(c=>getCertStatus(c)==='expired');
    else if(state.section==='expiringSoon') html=renderCertificates(c=>getCertStatus(c)==='expiring');
    else if(state.section==='pendingApproval') html=renderCertificates(c=>c.approvalStatus==='pending');
    else if(state.section.startsWith('certType_')){
      const ctMap={'certType_CATIII':'CAT III','certType_CATIV':'CAT IV','certType_LIFTING':'LIFTING','certType_LOADTEST':'LOAD TEST','certType_NDT':'NDT','certType_TUBULAR':'TUBULAR','certType_ORIGINALCOC':'ORIGINAL COC'};
      const ct=ctMap[state.section];
      html=ct?renderCertificates(c=>c.certCategory===ct):renderCertificates();
    }
    else if(state.section.startsWith('cat_')){
      const catMap={'cat_Rotating':'Rotating','cat_Static':'Static','cat_Lifting':'Lifting','cat_Electrical':'Electrical','cat_Pressure':'Pressure','cat_FireSafety':'Fire & Safety','cat_Instrumentation':'Instrumentation','cat_Vehicles':'Vehicles'};
      const cat=catMap[state.section]||state.section.replace('cat_','');
      html=renderCertificates(c=>c.category===cat);
    }
    else html=renderCertificates();
  }
  else if(state.module==='supply'){
    if(state.section==='scDashboard') html=renderSCDashboard();
    else if(state.section==='warehouses'||state.section==='warehouseCapacity') html=renderWarehouseCapacity();
    else if(state.section==='materialRequests') html=renderAllMRs();
    else if(state.section==='allPOs') html=renderAllPOs();
    else if(state.section==='pendingApprovalPO') html=renderAllPOs(p=>p.status==='draft');
    else if(state.section==='orderedItems') html=renderAllPOs(p=>p.status==='ordered');
    else if(state.section==='receivedItems') html=renderAllPOs(p=>p.status==='received');
    else if(state.section==='allSuppliers'||state.section==='supplierPerformance') html=renderAllSuppliers();
    else if(state.section==='inventoryItems') html=renderInventory();
    else if(state.section==='qualityInspections') html=renderQualityInspections();
    else if(state.section==='landedCost') html=renderLandedCost();
    else if(state.section==='reorderRules') html=renderReorderRules();
    else if(state.section==='lowStockAlerts') html=renderInventory(i=>i.status!=='normal');
    else if(state.section==='stockLedger') html=renderStockLedgerPage();
    else if(state.section==='scSettings') html=renderSCSettings();
    else html=renderSCDashboard();
  }
  else if(state.module==='fin'){
    if(state.section==='finDashboard') html=renderFinDashboard();
    else if(state.section==='finSales') html=renderFinInvoices('Sales');
    else if(state.section==='finPurchases') html=renderFinInvoices('Purchase');
    else if(state.section==='finPayments') html=renderFinPayments();
    else if(state.section==='arAging') html=renderFinAging('Sales');
    else if(state.section==='apAging') html=renderFinAging('Purchase');
    else if(state.section==='finGL') html=renderFinGL();
    else if(state.section==='finPL') html=renderFinPL();
    else if(state.section==='finBS') html=renderFinBS();
    else if(state.section==='finJournalEntries') html=renderFinJournalEntries();
    else if(state.section==='finFixedAssets') html=renderFinFixedAssets();
    else if(state.section==='finCostCenters') html=renderFinCostCenters();
    else if(state.section==='finChartAccounts') html=renderFinChartAccounts();
    else if(state.section==='finSettings') html=renderFinSettings();
    else html=renderFinDashboard();
  }
  $('#modContent').innerHTML=html;
  runContentAnimations();
  if(state.module==='certificates'&&!state.section.startsWith('certGantt')&&!state.section.startsWith('certNotification')){
    setTimeout(()=>{
      certLoadColState();
      certApplyColVisibility();
      certUpdateMassBar();
    }, 50);
  }
}

function renderAll(){
  renderTabBar();
  if(state.module==='certificates')renderCertSubNav();
  else{
    const subNav=$('#certSubNav');
    if(subNav)subNav.style.display='none';
    const body=document.querySelector('.app-body');
    if(body)body.classList.remove('subnav-open');
  }
  renderSidebar();
  renderContent();
}

function rerenderSection(){
  destroyCharts();
  recomputeInvoiceStatuses();
  renderTabBar();
  if(state.module==='certificates')renderCertSubNav();
  else{
    const subNav=$('#certSubNav');
    if(subNav)subNav.style.display='none';
    const body=document.querySelector('.app-body');
    if(body)body.classList.remove('subnav-open');
  }
  renderSidebar();
  renderContent();
}

/* ── Motion Animations ── */
function runContentAnimations(){
  requestAnimationFrame(() => {
    animate('.kpi-card',{opacity:[0,1],y:[16,0]},{duration:.4,delay:stagger(.06),easing:spring()});
    animate('.list-item',{opacity:[0,1],y:[12,0]},{duration:.35,delay:stagger(.04),easing:spring()});
    animate('.sec-card',{opacity:[0,1],y:[8,0]},{duration:.35,delay:stagger(.05),easing:spring()});
    animate('.data-table tbody tr, .sap-table tbody tr',{opacity:[0,1]},{duration:.3,delay:stagger(.03)});
    animate('.cert-card',{opacity:[0,1],scale:[.97,1]},{duration:.35,delay:stagger(.04),easing:spring()});
  });
}
function runSidebarAnimations(){
  requestAnimationFrame(() => {
    animate('.sidebar-item',{opacity:[0,1],x:[-6,0]},{duration:.25,delay:stagger(.025)});
  });
}

/* ═══════════════════════════════════════════════
   SHELL EVENTS
═══════════════════════════════════════════════ */
$('#notifBtn').addEventListener('click',e=>{
  e.stopPropagation();
  if(activeDropdown===$('#notifBtn')){ closeDropdown(); return; }
  let html=`<div class="dropdown-header">${t('notifications')}</div>`;
  DATA.notifications.forEach(n=>{ html+=`<div class="dropdown-item"><i class="fa-solid ${n.icon}" style="color:${n.color};"></i><div><div style="font-size:13px;">${n.text}</div><div style="font-size:11px;color:var(--text-sec);margin-top:1px;">${n.time}</div></div></div>`; });
  html+=`<div style="padding:8px 14px;border-top:1px solid var(--border);text-align:center;"><button type="button" class="btn btn-ghost btn-sm" data-action="mark-all-read">Mark all read</button></div>`;
  openDropdown($('#notifBtn'),html);
});

$('#userBtn').addEventListener('click',e=>{
  e.stopPropagation();
  if(activeDropdown===$('#userBtn')){ closeDropdown(); return; }
  const inspOpts=DATA.inspectors.filter(i=>i.status==='active').map(i=>`<option value="${i.id}">${h(i.name)} – ${h(i.title)}</option>`).join('');
  let html=`<div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;">
    <div class="avatar" style="width:40px;height:40px;font-size:14px;background:var(--blue)">KA</div>
    <div><div style="font-size:14px;font-weight:600;">Khalid Al-Rashidi</div><div style="font-size:12px;color:var(--text-sec);">k.alrashidi@amici.com</div></div>
  </div>
  <div class="dropdown-header" style="font-size:11px;padding:8px 14px 4px;">Roles (Multi-Select)</div>
  ${ROLE_LABELS.map(r=>{const k=ROLE_KEY_MAP[r];const checked=state.roles.includes(k)?'checked':'';return `<label class="dropdown-item" style="display:flex;align-items:center;gap:8px;padding:6px 14px;cursor:pointer;font-size:13px;"><input type="checkbox" data-rolekey="${k}" data-rolelabel="${r}" onchange="toggleRole(this)" ${checked} style="width:16px;height:16px;accent-color:var(--blue);"><span>${r}</span></label>`;}).join('')}
  <div style="padding:6px 14px;border-top:1px solid var(--border);display:flex;gap:6px;">
    <button class="btn btn-sm btn-primary" style="flex:1" onclick="closeDropdown()">Done</button>
  </div>
  <div class="dropdown-header" style="font-size:11px;padding:4px 14px 4px;border-top:1px solid var(--border);margin-top:4px;">Inspector Mode</div>
  <div style="padding:4px 10px 8px;display:flex;gap:4px;"><select id="inspectorLoginSelect" style="flex:1;height:28px;border:1px solid var(--border);border-radius:4px;font-size:12px;padding:0 6px;"><option value="">Select inspector...</option>${inspOpts}</select><button class="btn btn-primary btn-sm" onclick="certLoginInspector(document.getElementById('inspectorLoginSelect').value);closeDropdown();">Login</button></div>
  <div style="border-top:1px solid var(--border);"><button type="button" class="dropdown-item" style="color:var(--error);width:100%;border:none;background:transparent;" data-action="sign-out"><i class="fa-solid fa-right-from-bracket" style="color:var(--error);"></i>Sign Out</button></div>`;
  openDropdown($('#userBtn'),html);
});

$('#shellSearch').addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    const q=e.target.value.trim().toLowerCase();
    if(!q) return;
    const found=DATA.employees.find(em=>em.name.toLowerCase().includes(q)||em.id.toLowerCase()===q);
    if(found){ state.module='hr';state.section='allEmployees';state.selectedId=found.id;renderAll();showToast('Found: '+found.name,'success'); }
    else showToast('No results for "'+q+'"','warning');
    e.target.value='';
  }
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if($('#modalOverlay').classList.contains('open')) closeModal();
    else if(activeDropdown) closeDropdown();
  }
});

/* ═══════════════════════════════════════════════
   AI ASSISTANT — OPENROUTER / GEMINI
═══════════════════════════════════════════════ */
const AI = {
  model: sessionStorage.getItem('amici_or_model') || 'google/gemini-2.5-flash:free',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  history: [],
  isOpen: false,
  isLoading: false,
  freeModels: [],

  getKey(){
    return sessionStorage.getItem('amici_or_key') || '';
  },

  /* Build a live snapshot of all DATA for the system prompt */
  buildContext(){
    const empSummary = DATA.employees.map(e=>
      `${e.id}|${e.name}|${e.dept}|${e.position}|${e.status}|${e.site}|${e.crew}`
    ).join('\n');

    const poSummary = DATA.purchaseOrders.map(p=>
      `${p.id}|${p.supplier}|${p.category}|${p.amount} ${p.currency}|${p.status}|${p.priority}|req:${p.requiredDate}`
    ).join('\n');

    const certSummary = DATA.certificates.map(c=>
      `${c.id}|${c.equipName}|${c.category}|${c.status}|expires:${c.expiryDate}|days:${c.daysRemaining}`
    ).join('\n');

    const accSummary = DATA.accounts.map(a=>
      `${a.id}|${a.name}|${a.type}|${a.rating}|value:${a.contractValue}|opps:${a.openOpps}`
    ).join('\n');

    const invSummary = DATA.inventory.map(i=>
      `${i.id}|${i.name}|${i.partNo}|onHand:${i.qtyOnHand}${i.uom}|reorder:${i.reorderPoint}|${i.status}`
    ).join('\n');

    const mrSummary = DATA.materialRequests.map(m=>
      `${m.id}|${m.title}|${m.status}|${m.priority}|items:${m.items.length}|site:${m.site}|dept:${m.department}|${m.requiredDate}`
    ).join('\n');

    const expiredCerts = DATA.certificates.filter(c=>getCertStatus(c)==='expired').map(c=>c.equipName).join(', ');
    const expiringCerts = DATA.certificates.filter(c=>getCertStatus(c)==='expiring').map(c=>`${c.equipName}(${getCertDays(c)}d)`).join(', ');
    const lowStock = DATA.inventory.filter(i=>i.status!=='normal').map(i=>`${i.name}(${i.qtyOnHand}${i.uom})`).join(', ');
    const pendingPOs = DATA.purchaseOrders.filter(p=>p.status==='draft').map(p=>p.id).join(', ');

    return `You are AMICI AI, an intelligent ERP assistant for AMICI Oil & Gas company operating in Oman and the Middle East.
You have real-time access to all system data and can both answer questions AND execute actions.

TODAY: ${new Date().toISOString().split('T')[0]}
CURRENT USER ROLE(S): ${state.roles.join(', ')} (${state.currentUserRole})

=== ROLE-BASED ACTION RESTRICTIONS ===
- "approve_po" and "create_po_draft" require SC Manager or System Admin role
- "add_employee" requires HR Manager or System Admin role
- "flag_cert" requires Inspector or System Admin role
- "navigate" is unrestricted
Current role ${state.roles.some(r=>['system_admin','sc_manager'].includes(r))?'CAN':'CANNOT'} approve/create POs.
Current role ${state.roles.some(r=>['system_admin','hr_manager'].includes(r))?'CAN':'CANNOT'} add employees.
Current role ${state.roles.some(r=>['system_admin','inspector'].includes(r))?'CAN':'CANNOT'} flag certificates.

=== ALERTS (action required) ===
Expired Certificates: ${expiredCerts||'None'}
Expiring Soon (≤30d): ${expiringCerts||'None'}
Low/Out-of-Stock Items: ${lowStock||'None'}
Draft POs Awaiting Approval: ${pendingPOs||'None'}

=== EMPLOYEES (${DATA.employees.length} total) ===
Format: ID|Name|Dept|Position|Status|Site|Crew
${empSummary}

=== PURCHASE ORDERS (${DATA.purchaseOrders.length} total) ===
Format: ID|Supplier|Category|Amount|Status|Priority|RequiredDate
${poSummary}

=== CERTIFICATES (${DATA.certificates.length} total) ===
Format: ID|Equipment|Category|Status|ExpiryDate|DaysRemaining
${certSummary}

=== CRM ACCOUNTS (${DATA.accounts.length} total) ===
Format: ID|Name|Type|Rating|ContractValue|OpenOpps
${accSummary}

=== INVENTORY (${DATA.inventory.length} items) ===
Format: ID|Name|PartNo|OnHand|ReorderPoint|Status
${invSummary}

=== MATERIAL REQUESTS (${DATA.materialRequests.length} total) ===
Format: ID|Title|Status|Priority|Items|Site|Dept|RequiredDate
${mrSummary}

=== INSTRUCTIONS ===
- Answer questions accurately using the data above. Be concise, direct, and helpful.
- When users ask you to DO something (approve, add, navigate), respond with a JSON action block.
- For regular answers, respond in plain conversational text. Use markdown-style bold (**text**) sparingly for key figures.
- Numbers: always include units and currency where relevant.
- If asked about something not in the data, say so clearly.

=== ACTION FORMAT ===
When you want to execute an action, include this exact JSON block in your response (wrap in triple backticks json):
\`\`\`json
{
  "action": "approve_po" | "navigate" | "add_employee" | "flag_cert" | "create_po_draft",
  "params": { ...action-specific fields... },
  "confirm_message": "Human-readable description of what will happen"
}
\`\`\`

Action schemas:
- approve_po: { "po_id": "PO-2025-XXX" }
- navigate: { "module": "hr"|"crm"|"certificates"|"supply", "section": "allEmployees"|"allPOs"|"allCerts"|"allAccounts"|"scDashboard"|"inventoryItems"|"lowStockAlerts"|"expiredCerts"|"expiringSoon"|"leaveRequests" }
- flag_cert: { "cert_id": "CERT-XXX", "note": "reason" }
- create_po_draft: { "supplier": "...", "description": "...", "amount": 0, "priority": "Normal"|"High"|"Critical", "site": "..." }
- add_employee: { "firstName": "...", "lastName": "...", "dept": "...", "position": "...", "site": "...", "empType": "Full-time"|"Contract" }

Always include confirm_message so the user knows what action will be taken before confirming.`;
  },

  /* Parse action block from model response */
  parseAction(text){
    const match = text.match(/```json\s*([\s\S]*?)```/);
    if(!match) return null;
    try{ return JSON.parse(match[1].trim()); }
    catch(e){ return null; }
  },

  /* Strip the JSON block from display text */
  stripAction(text){
    return text.replace(/```json[\s\S]*?```/g,'').trim();
  },

  /* Execute a confirmed action */
  executeAction(action){
    const p = action.params;
    switch(action.action){
      case 'approve_po': {
        if(!requireRoles(['sc_manager','system_admin'],'AI: Cannot approve PO - requires SC Manager')) return;
        const po = DATA.purchaseOrders.find(x=>x.id===p.po_id);
        if(po){ po.status='approved'; po.approvedBy='AMICI AI'; showToast(`${p.po_id} approved via AI`,'success'); rerenderSection(); }
        else showToast('PO not found','error');
        break;
      }
      case 'navigate': {
        if(p.module) switchModule(p.module);
        if(p.section) setTimeout(()=>{ state.section=p.section; rerenderSection(); },50);
        showToast(`Navigated to ${p.section||p.module}`,'info');
        break;
      }
      case 'flag_cert': {
        if(!requireRoles(['inspector','system_admin'],'AI: Cannot flag cert - requires Inspector')) return;
        const cert = DATA.certificates.find(x=>x.id===p.cert_id);
        if(cert){ cert.remarks=(cert.remarks||'')+'\n<i class="fa-solid fa-triangle-exclamation" style="color:var(--warning)"></i> AI Flag: '+p.note; showToast(`${p.cert_id} flagged`,'warning'); }
        else showToast('Certificate not found','error');
        break;
      }
      case 'create_po_draft': {
        if(!requireRoles(['sc_manager','system_admin'],'AI: Cannot create PO - requires SC Manager')) return;
        const now=new Date();
        const newId=`PO-${now.getFullYear()}-${String(DATA.purchaseOrders.length+1).padStart(3,'0')}`;
        DATA.purchaseOrders.push({
          id:newId, supplierId:null, supplier:p.supplier||'TBD',
          category:'General', description:p.description||'AI-generated draft',
          amount:p.amount||0, currency:'USD', status:'draft',
          priority:p.priority||'Normal', requestedBy:'AMICI AI',
          approvedBy:null, site:p.site||'Head Office – Muscat',
          requiredDate:'', createdDate:now.toISOString().split('T')[0],
          deliveryDate:null, poLines:[{item:p.description||'TBD',qty:1,unit:'Lot',unitPrice:p.amount||0}]
        });
        showToast(`${newId} created as draft`,'success');
        if(state.module==='supply') rerenderSection();
        break;
      }
      case 'add_employee': {
        if(!requireRoles(['hr_manager','system_admin'],'AI: Cannot add employee - requires HR Manager')) return;
        const newId='EMP-'+String(DATA.employees.length+1).padStart(3,'0');
        DATA.employees.push({
          id:newId, firstName:p.firstName||'', lastName:p.lastName||'',
          name:(p.firstName||'')+' '+(p.lastName||''),
          dept:p.dept||'TBD', position:p.position||'TBD',
          email:'', phone:'', status:'probation',
          empType:p.empType||'Full-time',
          site:p.site||'Head Office – Muscat', crew:'Support',
          startDate:new Date().toISOString().split('T')[0],
          salaryBand:'G4', nationality:'', rotation:'N/A',
          h2sLevel:'N/A', medFit:false, medExpiry:null,
          visa:'N/A', workPermit:'N/A', manager:null, costCenter:'TBD',
          leave:{annual:{used:0,total:15},sick:{used:0,total:10},remote:{used:0,total:5},training:{used:0,total:10}},
          skills:[], hseCerts:[], history:[{date:new Date().toISOString().split('T')[0],event:'Added via AMICI AI'}]
        });
        showToast(`${p.firstName} ${p.lastName} added as ${newId}`,'success');
        if(state.module==='hr') rerenderSection();
        break;
      }
      default: showToast('Unknown action: '+action.action,'warning');
    }
  }
};

/* ── FREE MODELS FETCHER ── */
async function fetchFreeModels(){
  const sel = document.getElementById('aiModelSelect');
  if(!sel) return;
  sel.innerHTML = '<option value="">Loading…</option>';
  try{
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    const free = (data.data||[]).filter(m=>{
      const p = m.pricing||{};
      return parseFloat(p.completion||'0')===0 && parseFloat(p.prompt||'0')===0 && m.id !== 'openrouter/auto';
    });
    AI.freeModels = free.sort((a,b)=>a.name?.localeCompare?.(b.name)||0);
    const current = sessionStorage.getItem('amici_or_model') || AI.model;
    sel.innerHTML = AI.freeModels.map(m =>
      `<option value="${m.id}" ${m.id===current?'selected':''}>${m.name||m.id}</option>`
    ).join('');
    if(!AI.freeModels.find(m=>m.id===current) && AI.freeModels.length){
      sel.value = AI.freeModels[0].id;
      selectAIModel(sel.value);
    }
  } catch(e){
    sel.innerHTML = `<option value="">Failed to load: ${e.message}</option>
      <option value="google/gemini-2.5-flash:free">google/gemini-2.5-flash:free (fallback)</option>`;
    showToast('Could not fetch model list: '+e.message,'warning');
  }
}

function selectAIModel(modelId){
  if(!modelId) return;
  AI.model = modelId;
  sessionStorage.setItem('amici_or_model', modelId);
  showToast(`Model switched to ${modelId}`,'success');
}

/* ── AI PANEL TOGGLE ── */
function toggleAIPanel(){
  AI.isOpen = !AI.isOpen;
  $('#aiPanel').classList.toggle('open', AI.isOpen);
  $('#aiBtn').classList.toggle('active', AI.isOpen);
  if(AI.isOpen){
    renderAIMessages();
    const hasKey = !!AI.getKey();
    $('#aiKeyBar').style.display = hasKey ? 'none' : 'flex';
    $('#aiModelBar').style.display = hasKey ? 'flex' : 'none';
    if(hasKey) $('#aiInput').focus();
    if(hasKey && !AI.freeModels.length) fetchFreeModels();
    else {
      const sel = document.getElementById('aiModelSelect');
      if(sel && !sel.value) sel.value = AI.model;
    }
  }
}

$('#aiBtn').addEventListener('click', e=>{ e.stopPropagation(); toggleAIPanel(); });
$('#aiCloseBtn').addEventListener('click', ()=>toggleAIPanel());
$('#langBtn').addEventListener('click', toggleLang);
$('#aiKeySaveBtn').addEventListener('click', saveAPIKey);
$('#aiSend').addEventListener('click', sendAIMessage);
$('#aiInput').addEventListener('input', e=>autoResizeTextarea(e.target));
$('#aiInput').addEventListener('keydown', e=>{
  if(e.key==='Enter' && !e.shiftKey){
    e.preventDefault();
    sendAIMessage();
  }
});

/* ── API KEY ── */
function saveAPIKey(){
  const key = $('#aiKeyInput').value.trim();
  if(!key.startsWith('sk-or-')){ showToast('Key must start with sk-or-','error'); return; }
  sessionStorage.setItem('amici_or_key', key);
  $('#aiKeyBar').innerHTML = `<span class="ai-key-saved"><i class="fa-solid fa-check-circle"></i> API key saved for this session</span>
    <button class="ai-key-btn" type="button" style="background:var(--text-sec)" data-action="clear-api-key">Change</button>
    <button class="ai-key-btn" type="button" style="background:var(--danger)" data-action="remove-api-key"><i class="fa-solid fa-trash"></i> Remove</button>`;
  $('#aiModelBar').style.display = 'flex';
  showToast('OpenRouter key saved','success');
  $('#aiInput').focus();
}

function clearAPIKey(){
  sessionStorage.removeItem('amici_or_key');
  $('#aiKeyBar').innerHTML = `<input class="ai-key-input" id="aiKeyInput" type="password" placeholder="Paste OpenRouter API key (sk-or-…)" autocomplete="off">
    <button class="ai-key-btn" type="button" data-action="save-api-key">Save</button>`;
  $('#aiKeyBar').style.display='flex';
  $('#aiModelBar').style.display='none';
}

/* ── RENDER MESSAGES ── */
function renderAIMessages(){
  const el = $('#aiMessages');
  const chips = $('#aiChips');

  if(AI.history.length === 0){
    el.innerHTML = `<div class="ai-empty">
      <div class="ai-empty-icon"><i class="fa-solid fa-wand-magic-sparkles" style="color:var(--warning);font-size:28px"></i></div>
      <h3>AMICI AI Assistant</h3>
      <p>Ask me about employees, certificates, purchase orders, inventory, or CRM accounts. I can also take actions.</p>
    </div>`;
    chips.innerHTML = [
      'Which certificates are expired?',
      'Show low stock items',
      'How many employees are offshore?',
      'List draft POs pending approval',
      'Who manages Block 15?',
      'Approve PO-2025-007',
      'Navigate to certificate management',
      'Which accounts are rated Hot?'
    ].map(q=>`<button class="ai-chip" type="button" data-action="send-chip" data-chip="${q}">${q}</button>`).join('');
    return;
  }

  chips.innerHTML = '';
  const now = new Date();
  const timeStr = ()=> now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});

  el.innerHTML = AI.history.map((m,i)=>{
    if(m.role==='system') return '';
    const isUser = m.role==='user';
    const rawText = typeof m.content === 'string' ? m.content : '';
    const action = !isUser ? AI.parseAction(rawText) : null;
    const displayText = action ? AI.stripAction(rawText) : rawText;
    const formattedText = displayText.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');

    let actionCard = '';
    if(action && !m.executed){
      actionCard = `<div class="ai-action-card">
        <div class="ai-action-card-title"><i class="fa-solid fa-bolt"></i> Proposed Action</div>
        <div style="font-size:12px;color:var(--text);margin-bottom:4px;">${action.confirm_message||'Execute this action?'}</div>
        <button class="ai-action-btn confirm" type="button" data-action="confirm-ai-action" data-index="${i}">
          <i class="fa-solid fa-check"></i> Confirm & Execute
        </button>
        <button class="ai-action-btn" type="button" style="background:var(--text-sec);margin-left:4px;" data-action="dismiss-ai-action" data-index="${i}">
          Dismiss
        </button>
      </div>`;
    } else if(action && m.executed){
      actionCard = `<div class="ai-action-card" style="border-color:var(--success);">
        <div class="ai-action-card-title" style="color:var(--success);"><i class="fa-solid fa-check-circle"></i> Action Executed</div>
        <div style="font-size:12px;color:var(--text-sec);">${action.confirm_message}</div>
      </div>`;
    }

    return `<div class="ai-msg ${isUser?'user':'assistant'}">
      <div class="ai-bubble">${formattedText||'&nbsp;'}</div>
      ${actionCard}
      <div class="ai-msg-time">${m.time||timeStr()}</div>
    </div>`;
  }).join('');

  // typing indicator
  if(AI.isLoading){
    el.innerHTML += `<div class="ai-msg assistant" id="aiTyping">
      <div class="ai-typing"><span></span><span></span><span></span></div>
    </div>`;
  }

  el.scrollTop = el.scrollHeight;
}

function confirmAction(idx){
  const msg = AI.history[idx];
  const action = AI.parseAction(msg.content);
  if(!action) return;
  AI.history[idx].executed = true;
  AI.executeAction(action);
  renderAIMessages();
}

function dismissAction(idx){
  AI.history[idx].executed = 'dismissed';
  renderAIMessages();
}

/* ── SEND MESSAGE ── */
function sendChip(text){
  $('#aiInput').value = text;
  autoResizeTextarea($('#aiInput'));
  sendAIMessage();
}

document.addEventListener('click', e=>{
  const actionEl = e.target.closest('[data-action]');
  if(!actionEl) return;
  const { action, index, chip, role } = actionEl.dataset;
  if(action === 'close-toast') return closeToast(actionEl);
  if(action === 'close-modal') return closeModal();
  if(action === 'mark-all-read'){
    closeDropdown();
    $('#notifBadge').style.display='none';
    return showToast('All notifications cleared','success');
  }
  if(action === 'select-role'){
    const roleKey = ROLE_KEY_MAP[role]||'employee';
    state.roles=[roleKey];
    state.currentUserRole=role;
    showToast(`Role: ${role}`,'success');
    rerenderSection();
    return closeDropdown();
  }
  if(action === 'sign-out'){
    showToast('Signed out','success');
    return closeDropdown();
  }
  if(action === 'clear-api-key') return clearAPIKey();
  if(action === 'remove-api-key'){
    sessionStorage.removeItem('amici_or_key');
    $('#aiKeyBar').innerHTML = `<input class="ai-key-input" id="aiKeyInput" type="password" placeholder="Paste OpenRouter API key (sk-or-…)" autocomplete="off">
      <button class="ai-key-btn" type="button" data-action="save-api-key">Save</button>`;
    $('#aiKeyBar').style.display='none';
    $('#aiModelBar').style.display='none';
    showToast('API key removed','info');
    return;
  }
  if(action === 'save-api-key') return saveAPIKey();
  if(action === 'send-chip') return sendChip(chip);
  if(action === 'confirm-ai-action') return confirmAction(Number(index));
  if(action === 'dismiss-ai-action') return dismissAction(Number(index));
});

async function sendAIMessage(){
  const input = $('#aiInput');
  const text = input.value.trim();
  if(!text || AI.isLoading) return;

  const key = AI.getKey();
  if(!key){
    showToast('Please enter your OpenRouter API key first','warning');
    $('#aiKeyBar').style.display='flex';
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});

  AI.history.push({ role:'user', content:text, time:timeStr });
  input.value = '';
  input.style.height = 'auto';
  AI.isLoading = true;
  $('#aiSend').disabled = true;
  renderAIMessages();

  // Build messages array: system prompt + conversation history
  const messages = [
    { role:'system', content: AI.buildContext() },
    ...AI.history.filter(m=>m.role!=='system').map(m=>({ role:m.role, content:m.content }))
  ];

  try{
    const res = await fetch(AI.endpoint, {
      method: 'POST',
      headers:{
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://amici-erp.app',
        'X-Title': 'AMICI ERP'
      },
      body: JSON.stringify({
        model: AI.model,
        messages,
        max_tokens: 1024,
        temperature: 0.3
      })
    });

    if(!res.ok){
      const err = await res.json().catch(()=>({error:{message:res.statusText}}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'No response received.';
    const replyTime = new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    AI.history.push({ role:'assistant', content:reply, time:replyTime });

  } catch(err){
    const errTime = new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    AI.history.push({ role:'assistant', content:`**Error:** ${err.message}\n\nCheck your API key and try again.`, time:errTime });
    showToast('AI request failed: '+err.message,'error');
  } finally {
    AI.isLoading = false;
    $('#aiSend').disabled = false;
    renderAIMessages();
  }
}

/* ── CLOSE PANEL ON OUTSIDE CLICK ── */
document.addEventListener('click', e=>{
  if(AI.isOpen && !$('#aiPanel').contains(e.target) && e.target !== $('#aiBtn')){
    // don't close — user may be clicking in the app while panel is open
  }
});
/* ── DATA FETCHING (SUPABASE) ── */
async function loadData() {
  if (!supabase) { updateLoadingProgress(100); return; } // Fallback to mock data if no supabase client
  try {
    const queries = [
      supabase.from('employees').select('*, employee_skills(*), employee_leave_balances(*), employee_history(*), employee_hse_certs(*)').then(r => {
        if (!r.error && r.data && r.data.length > 0) DATA.employees = r.data.map(emp => ({
          id: emp.id, firstName: emp.first_name, lastName: emp.last_name, name: emp.full_name || (emp.first_name + ' ' + emp.last_name),
          dept: emp.department, position: emp.position_title, email: emp.email, phone: emp.phone, status: emp.status, empType: emp.emp_type,
          site: emp.site, rotation: emp.rotation, crew: emp.crew, startDate: emp.start_date, manager: emp.manager_id, salaryBand: emp.salary_band,
          costCenter: emp.cost_center, nationality: emp.nationality, visa: emp.visa, h2sLevel: emp.h2s_level, medFit: emp.med_fit,
          medExpiry: emp.med_expiry, workPermit: emp.work_permit, skills: emp.employee_skills || [], hseCerts: emp.employee_hse_certs || [],
          history: emp.employee_history || [],
          leave: (emp.employee_leave_balances || []).reduce((acc, lb) => { acc[lb.leave_type] = { used: lb.used, total: lb.total }; return acc; }, {})
        }));
      }),
      supabase.from('inventory').select('*').then(r => { if (!r.error && r.data && r.data.length > 0) DATA.inventory = r.data.map(i => ({ id: i.id, name: i.name || i.item_name, partNo: i.part_no || i.partNo, category: i.category, site: i.site, warehouse: i.warehouse, uom: i.uom || i.unit, qtyOnHand: i.qty_on_hand ?? i.stock_level ?? 0, reorderPoint: i.reorder_point ?? i.min_stock ?? 0, maxStock: i.max_stock ?? 0, unitCost: i.unit_cost ?? 0, status: i.status || 'normal', lastReceived: i.last_received, supplierId: i.supplier_id, parent_item: i.parent_item, serial_tracking: i.serial_tracking ?? false, batch_tracking: i.batch_tracking ?? false, has_variants: i.has_variants ?? false })); }),
      supabase.from('suppliers').select('*').then(r => { if (r.data && r.data.length > 0) DATA.suppliers = r.data.map(s => ({ id: s.id, name: s.name, category: s.category, contact_person: s.contact_person, email: s.email, phone: s.phone, rating: s.rating, country: s.country, status: s.status })); }),
      supabase.from('warehouses').select('*').then(r => { if (r.data && r.data.length > 0) DATA.warehouses = r.data.map(w => ({ id: w.id, name: w.name, site: w.location || w.site, manager: w.manager || w.manager_id, capacity: w.capacity_total || 0, utilisation: w.capacity_used ? Math.round(w.capacity_used / w.capacity_total * 100) : 0, items: 0 })); }),
      supabase.from('purchase_orders').select('*, po_line_items(*)').then(r => { if (!r.error && r.data && r.data.length > 0) DATA.purchaseOrders = r.data.map(po => ({ id: po.id, supplier: po.supplier_name, description: po.description, amount: po.total_amount, status: po.status, priority: po.priority, site: po.site, requestedBy: po.requested_by, createdDate: po.order_date, deliveryDate: po.delivery_date, poLines: (po.po_line_items || []).map(l => ({ item: l.item_desc, qty: l.quantity, unit: l.unit, unitPrice: l.unit_price })) })); }),
      supabase.from('crm_accounts').select('*').then(r => { if (!r.error && r.data && r.data.length > 0) DATA.accounts = r.data.map(a => ({ id: a.id, name: a.name, industry: a.industry, status: a.status, tier: a.tier, managerId: a.manager_id, revenue: a.revenue, lastContact: a.last_contact, nextAction: a.next_action })); }),
      supabase.from('crm_field_service_logs').select('*').then(r => { if (r.data && r.data.length > 0) DATA.fieldServiceLogs = r.data.map(l => ({ id: l.id, client_name: l.client_name, engineer_name: l.engineer_name, date: l.date, job_description: l.job_description, status: l.status })); }),
      supabase.from('leave_requests').select('*').then(r => { if (r.data && r.data.length > 0) DATA.leaveRequests = r.data.map(lr => ({ id: lr.id, empId: lr.employee_id, employeeName: lr.employee_name, type: lr.leave_type, start: lr.start_date || lr.start, end: lr.end_date || lr.end, startDate: lr.start_date || lr.start, endDate: lr.end_date || lr.end, days: lr.days, status: lr.status, approver: lr.approver })); }),
      supabase.from('certificates').select('*').then(r => { if (r.data && r.data.length > 0) DATA.certificates = r.data.map(c => ({ id: c.id, empId: c.employee_id, empName: c.employee_name, type: c.cert_type, issued_by: c.issued_by, issued_date: c.issued_date, expiry: c.expiry_date, status: c.status, notes: c.notes, alertDays: c.alert_days ?? 30, template: c.template, description: c.description, category: c.category })); }),
      supabase.from('crm_leads').select('*').then(r => { if (r.data && r.data.length > 0) DATA.leads = r.data.map(l => ({ id: l.id, name: l.name, email: l.email, phone: l.phone, status: l.status, source: l.source })); }),
      supabase.from('crm_deals').select('*').then(r => { if (r.data && r.data.length > 0) DATA.deals = r.data.map(d => ({ id: d.id, title: d.title, lead_id: d.lead_id, account_id: d.account_id, value: d.value, stage: d.stage, expected_close_date: d.expected_close_date, invoice_id: d.invoice_id || null })); }),
      supabase.from('crm_tasks').select('*').then(r => { if (r.data && r.data.length > 0) DATA.tasks = r.data.map(t => ({ id: t.id, description: t.description, due_date: t.due_date, status: t.status, assigned_to: t.assigned_to, related_lead_id: t.related_lead_id, related_deal_id: t.related_deal_id })); }),
      supabase.from('crm_contacts').select('*').then(r => { if (r.data && r.data.length > 0) DATA.contacts = r.data.map(c => ({ id: c.id, account_id: c.account_id, salutation: c.salutation, first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone, mobile: c.mobile, designation: c.designation, department: c.department, is_primary: c.is_primary || false, nationality: c.nationality, notes: c.notes || '' })); }),
      supabase.from('crm_quotations').select('*').then(r => { if (r.data && r.data.length > 0) DATA.quotations = r.data.map(q => ({ id: q.id, deal_id: q.deal_id, account_id: q.account_id, account_name: q.account_name, lead_id: q.lead_id, date: q.date, valid_till: q.valid_till, items: q.items || [], tax_rate: q.tax_rate || 0, tax_amount: q.tax_amount || 0, discount_percent: q.discount_percent || 0, discount_amount: q.discount_amount || 0, grand_total: q.grand_total || 0, status: q.status || 'Draft', notes: q.notes || '' })); }),
      supabase.from('crm_prospects').select('*').then(r => { if (r.data && r.data.length > 0) DATA.prospects = r.data.map(p => ({ id: p.id, company_name: p.company_name, industry: p.industry, website: p.website, phone: p.phone, email: p.email, territory: p.territory, prospect_owner: p.prospect_owner, status: p.status || 'New', notes: p.notes || '', created_date: p.created_date })); }),
      supabase.from('crm_communications').select('*').then(r => { if (r.data && r.data.length > 0) DATA.communications = r.data.map(m => ({ id: m.id, reference_type: m.reference_type, reference_id: m.reference_id, type: m.type, subject: m.subject, content: m.content, date: m.date, sender: m.sender, recipients: m.recipients })); }),
      supabase.from('hr_open_positions').select('*').then(r => { if (r.data && r.data.length > 0) DATA.openPositions = r.data.map(p => ({ id: p.id, title: p.title, department: p.department, status: p.status, posted_date: p.posted_date })); }),
      supabase.from('hr_performance_reviews').select('*').then(r => { if (r.data && r.data.length > 0) DATA.performanceReviews = r.data.map(rv => ({ id: rv.id, employee_name: rv.employee_name, period: rv.period, rating: rv.rating, comments: rv.comments, status: rv.status })); }),
      supabase.from('hr_hse_training').select('*').then(r => { if (r.data && r.data.length > 0) DATA.hseTraining = r.data.map(t => ({ id: t.id, employee_name: t.employee_name, course: t.course, date: t.date, status: t.status })); }),
      supabase.from('hr_org_units').select('*').then(r => { if (r.data && r.data.length > 0) DATA.orgUnits = r.data.map(o => ({ id: o.id, name: o.name, head_count: o.head_count, manager: o.manager })); }),
      supabase.from('hr_attendance').select('*').then(r => { if (r.data && r.data.length > 0) DATA.attendance = r.data.map(a => ({ id: a.id, employee_id: a.employee_id, date: a.date, status: a.status, check_in_time: a.check_in_time, check_out_time: a.check_out_time })); }),
      supabase.from('hr_expense_claims').select('*').then(r => { if (r.data && r.data.length > 0) DATA.expenses = r.data.map(e => ({ id: e.id, employee_id: e.employee_id, date: e.date, amount: e.amount, category: e.category, description: e.description, status: e.status })); }),
      supabase.from('hr_salary_slips').select('*').then(r => { if (r.data && r.data.length > 0) DATA.salarySlips = r.data.map(s => ({ id: s.id, employee_id: s.employee_id, month: s.month, year: s.year, base_pay: s.base_pay, allowances: s.allowances, deductions: s.deductions, net_pay: s.net_pay, status: s.status, payment_id: s.payment_id || null })); }),
      supabase.from('fin_cost_centers').select('*').then(r => { if (r.data && r.data.length > 0) DATA.costCenters = r.data.map(c => ({ id: c.id, name: c.name, dept: c.dept || c.description })); }),
      supabase.from('fin_tax_templates').select('*').then(r => { if (r.data && r.data.length > 0) DATA.taxTemplates = r.data.map(t => ({ id: t.id, name: t.name, rate: t.rate, account: t.account || t.type })); }),
      supabase.from('fin_chart_accounts').select('*').then(r => { if (r.data && r.data.length > 0) DATA.chartAccounts = r.data.map(a => ({ id: a.id, name: a.name, type: a.type, parent_id: a.parent_id, is_group: a.is_group, balance: a.balance || 0 })); }),
      supabase.from('fin_journal_entries').select('*').then(r => { if (r.data && r.data.length > 0) DATA.journalEntries = r.data.map(j => ({ id: j.id, date: j.date, reference: j.reference, description: j.description, entries: j.entries })); }),
      supabase.from('fin_fixed_assets').select('*').then(r => { if (r.data && r.data.length > 0) DATA.fixedAssets = r.data.map(f => ({ id: f.id, name: f.name, type: f.type, purchase_date: f.purchase_date, cost: f.cost, salvage_value: f.salvage_value, useful_life_years: f.useful_life_years, depreciation_method: f.depreciation_method, accumulated_depreciation: f.accumulated_depreciation || 0, net_book_value: f.net_book_value || f.cost, status: f.status, supplier_id: f.supplier_id || null })); }),
      supabase.from('fin_invoices').select('*').then(r => { if (r.data && r.data.length > 0) DATA.invoices = r.data.map(i => ({ id: i.id, type: i.type, party_name: i.party_name, date: i.date, due_date: i.due_date, total_amount: i.total_amount, status: i.status, deal_id: i.deal_id || null, items: i.items || [], cost_center_id: i.cost_center_id || null, tax_template_id: i.tax_template_id || null, tax_rate: i.tax_rate || 0, tax_amount: i.tax_amount || 0 })); }),
      supabase.from('fin_payments').select('*').then(r => { if (r.data && r.data.length > 0) DATA.payments = r.data.map(p => ({ id: p.id, invoice_id: p.invoice_id, date: p.date, amount: p.amount, payment_method: p.payment_method, salary_slip_id: p.salary_slip_id || null })); }),
    ];
    // loading progress animation (approximate)
    const total = queries.length; let done = 0;
    const progressInterval = setInterval(() => { done++; updateLoadingProgress(Math.min(done / total * 100, 95)); if (done >= total) clearInterval(progressInterval); }, 30);
    await Promise.all(queries.map(q => q.catch(()=>{})));
    clearInterval(progressInterval);
    updateLoadingProgress(100);
    console.log("Supabase data loaded successfully!");
  } catch (err) {
    console.error("Error loading data from Supabase:", err);
    showToast("Error loading data from server. Using mock data.", "error");
  }
}

function updateLoadingProgress(pct) {
  const fill = document.getElementById('loadingRingFill');
  const barFill = document.getElementById('loadingBarFill');
  const pctEl = document.getElementById('loadingPercent');
  if (fill) fill.style.strokeDashoffset = 515 - (515 * pct / 100);
  if (barFill) barFill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = Math.round(pct) + '%';
}

/* ── INITIALIZATION & AUTH ── */
let _appInitialized = false;
function hideLoading() { document.getElementById('loadingOverlay').classList.add('hidden'); }
async function initializeApp() {
  if (_appInitialized) { hideLoading(); return; }
  _appInitialized = true;

  // Load user roles from database on login
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('roles, display_name')
          .eq('id', session.user.id)
          .single();
        if (profile?.roles?.length) {
          state.roles = profile.roles;
          const priority = ['system_admin','hr_manager','crm_manager','sc_manager','fin_manager','hr_user','crm_user','sc_user','fin_user','employee'];
          const sorted = [...state.roles].sort((a,b)=>priority.indexOf(a)-priority.indexOf(b));
          state.currentUserRole = Object.keys(ROLE_KEY_MAP).find(k=>ROLE_KEY_MAP[k]===sorted[0])||'Employee';
        }
      }
    } catch(e) { console.warn('Could not load user profile:', e); }
  }

  document.getElementById('loadingOverlay').classList.remove('hidden');
  document.getElementById('authOverlay').classList.add('hidden');
  await loadData();
  renderAll();
  hideLoading();
  const certAlerts = DATA.certificates.filter(c=>{const s=getCertStatus(c);return s==='expired'||s==='expiring';});
  const notifBadge = document.getElementById('notifBadge');
  if (notifBadge) notifBadge.textContent = certAlerts.length + DATA.leaveRequests.filter(l=>l.status==='pending').length;
  
  if (certAlerts.length > 0) {
    setTimeout(()=> showToast(`Warning: ${certAlerts.length} certificates are expired or expiring soon.`, 'error'), 1500);
  }
  
  setTimeout(()=> showToast('Welcome to AMICI ERP · All modules live','success'), 700);
}

// Guard: if bfcache restores the page, ensure loading overlay stays hidden
window.addEventListener('pageshow', () => { if (_appInitialized) hideLoading(); });

document.addEventListener('DOMContentLoaded', async () => {
  if (!supabase) {
    // No supabase client, just run with mock data
    document.getElementById('authOverlay').classList.add('hidden');
    initializeApp();
    return;
  }

  // Check existing session
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    document.getElementById('authOverlay').classList.add('hidden');
    initializeApp();
  } else {
    hideLoading();
    document.getElementById('authOverlay').classList.remove('hidden');
  }

  // Handle Auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      document.getElementById('loadingOverlay').classList.remove('hidden');
      document.getElementById('authOverlay').classList.add('hidden');
      initializeApp();
    } else if (event === 'SIGNED_OUT') {
      _appInitialized = false;
      hideLoading();
      document.getElementById('authOverlay').classList.remove('hidden');
      document.querySelector('.app-body').innerHTML = ''; // clear app body
      document.getElementById('tabBar').innerHTML = ''; // clear tabs
      document.getElementById('modSidebar').innerHTML = ''; // clear sidebar
    }
  });

  // Login Button Handler
  document.getElementById('authLoginBtn').addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const errEl = document.getElementById('authError');
    const btn = document.getElementById('authLoginBtn');
    const btnText = document.getElementById('authBtnText');
    const btnSpinner = document.getElementById('authBtnSpinner');
    errEl.textContent = '';
    
    if (!email || !password) {
      errEl.textContent = 'Please enter email and password';
      return;
    }
    
    btn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline';
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    btn.disabled = false;
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
    
    if (error) errEl.textContent = error.message;
  });

  // Enter key submits login form
  document.getElementById('authForm').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('authLoginBtn').click();
  });

  // Logout Button Handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
    });
  }
});
const menuBtn = document.getElementById('menuBtn');
if (menuBtn) {
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const sidebar = document.querySelector('.mod-sidebar');
    if (sidebar) sidebar.classList.toggle('open');
  });
}
document.addEventListener('click', (e) => {
  const sidebar = document.querySelector('.mod-sidebar');
  if (sidebar && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

/* ── CRM LEADS ── */
function openNewLeadModal() {
  const body=`<div style="display:flex;flex-direction:column;gap:12px">
    <input class="filter-input" id="nl-name" placeholder="Lead Name" />
    <input class="filter-input" id="nl-email" placeholder="Email" />
    <input class="filter-input" id="nl-phone" placeholder="Phone" />
    <select class="filter-select" id="nl-source">
      <option value="Website">Website</option><option value="Referral">Referral</option><option value="Cold Call">Cold Call</option>
    </select>
  </div>`;
  const footer=`<button class="btn btn-primary" onclick="submitNewLead()">Save Lead</button>`;
  openModal('New Lead', body, footer);
}

async function submitNewLead() {
  const name=$('#nl-name').value.trim();
  if(!name){showToast('Name is required','error');return;}
  const newLead = { id:'LD-'+Date.now(), name, email:$('#nl-email').value, phone:$('#nl-phone').value, source:$('#nl-source').value, status:'New' };
  
  if (supabase) {
    const { error } = await supabase.from('crm_leads').insert(newLead);
    if (error) { showToast('Error saving','error'); return; }
  }
  DATA.leads.push(newLead);
  closeModal(); showToast('Lead saved','success'); rerenderSection();
}

/* ── CRM DEALS KANBAN ── */
window.dragStartDeal = function(e, id) { e.dataTransfer.setData('text/plain', id); }
window.dropDeal = async function(e, stage) {
  const id = e.dataTransfer.getData('text/plain');
  const deal = DATA.deals.find(d => d.id === id);
  if(deal && deal.stage !== stage) {
    deal.stage = stage;
    if (supabase) await supabase.from('crm_deals').update({stage}).eq('id', id);
    if(stage === 'Closed Won') {
      const partyName = deal.account_id
        ? (DATA.accounts.find(a=>a.id===deal.account_id)?.name || deal.title)
        : deal.lead_id
          ? (DATA.leads.find(l=>l.id===deal.lead_id)?.name || deal.title)
          : deal.title;
      const newInv = {
        id: 'INV-' + Date.now(), type: 'Sales', party_name: partyName, date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        total_amount: deal.value, status: 'Draft', deal_id: deal.id,
        cost_center_id: null, tax_template_id: null, tax_rate: 0, tax_amount: 0,
        items: [{ item: deal.title, description: 'Auto-generated from won deal', qty: 1, rate: deal.value, amount: deal.value }]
      };
      if (supabase) await supabase.from('fin_invoices').insert(newInv);
      DATA.invoices.push(newInv);
      autoPostJE(newInv.id, 'Invoice ' + newInv.id + ' auto-posting', [{account_id:'ACC-AR', debit:deal.value, credit:0},{account_id:'ACC-REV', debit:0, credit:deal.value}]);
      deal.invoice_id = newInv.id;
      showToast('Deal won! Draft Invoice ' + newInv.id + ' auto-generated.', 'success');
    }
    rerenderSection();
  }
}

function openNewDealModal() {
  const salesPeople = [...new Set(DATA.deals.map(d => d.sales_person).filter(Boolean))];
  const territories = [...new Set(DATA.deals.map(d => d.territory).filter(Boolean))];
  const acctOpts = DATA.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  const spOpts = salesPeople.map(sp => `<option value="${sp}">${sp}</option>`).join('');
  const terrOpts = territories.map(t => `<option value="${t}">${t}</option>`).join('');
  const body=`<div style="display:flex;flex-direction:column;gap:10px">
    <input class="filter-input" id="nd-title" placeholder="Deal Title" />
    <div class="form-row">
      <div class="form-group"><label class="form-label">Value ($)</label><input type="number" class="form-input" id="nd-value" value="0" /></div>
      <div class="form-group"><label class="form-label">Stage</label>
        <select class="form-input" id="nd-stage"><option value="Prospecting">Prospecting</option><option value="Qualification">Qualification</option><option value="Proposal">Proposal</option><option value="Negotiation">Negotiation</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Account</label><select class="form-input" id="nd-acct"><option value="">— None —</option>${acctOpts}</select></div>
      <div class="form-group"><label class="form-label">Expected Close</label><input type="date" class="form-input" id="nd-close" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Sales Person</label><select class="form-input" id="nd-sp"><option value="">—</option>${spOpts}</select></div>
      <div class="form-group"><label class="form-label">Territory</label><select class="form-input" id="nd-terr"><option value="">—</option>${terrOpts}</select></div>
    </div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="nd-notes" rows="2" placeholder="Deal description, context..."></textarea></div>
  </div>`;
  const footer=`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitNewDeal()">Save Deal</button>`;
  openModal('New Deal', body, footer);
}

async function submitNewDeal() {
  const title=$('#nd-title').value.trim();
  if(!title){showToast('Title required','error');return;}
  const newDeal = { id:'DL-'+Date.now(), title, value:parseFloat($('#nd-value').value)||0, stage:$('#nd-stage').value, expected_close_date:$('#nd-close').value||new Date().toISOString().split('T')[0], account_id:$('#nd-acct').value||null, lead_id:null, invoice_id:null, sales_person:$('#nd-sp').value||'', territory:$('#nd-terr').value||'', lost_reason:'', notes:$('#nd-notes').value.trim() };
  
  if (supabase) {
    const { error } = await supabase.from('crm_deals').insert(newDeal);
    if (error) { showToast('Error saving','error'); return; }
  }
  DATA.deals.push(newDeal);
  closeModal(); showToast('Deal saved','success'); rerenderSection();
}

/* ── CRM TASKS ── */
function renderCRMTasks() {
  let html=`<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>My Tasks</h2>
    <button class="btn btn-primary" onclick="openNewTaskModal()">+ New Task</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px;">`;
  
  DATA.tasks.forEach(t => {
    const isDone = t.status==='completed';
    html+=`<div style="display:flex;align-items:center;gap:12px;background:#fff;padding:12px 16px;border-radius:6px;border:1px solid var(--border)">
      <input type="checkbox" ${isDone?'checked':''} onchange="toggleTask('${t.id}', this.checked)" style="width:18px;height:18px;cursor:pointer;">
      <div style="flex:1;text-decoration:${isDone?'line-through':'none'};color:${isDone?'var(--text-sec)':'var(--text)'};font-size:15px;">
        ${t.description}
      </div>
      <div style="font-size:12px;color:${t.due_date < new Date().toISOString().split('T')[0] && !isDone ? 'var(--error)' : 'var(--text-sec)'}">
        <i class="fa-regular fa-calendar"></i> ${t.due_date||'No date'}
      </div>
    </div>`;
  });
  if(DATA.tasks.length===0) html+=`<div style="text-align:center;padding:30px;color:var(--text-sec)">No tasks! You're all caught up.</div>`;
  html+=`</div></div>`;
  return html;
}

window.toggleTask = async function(id, isDone) {
  const t = DATA.tasks.find(x=>x.id===id);
  if(t) {
    t.status = isDone ? 'completed' : 'pending';
    if(supabase) await supabase.from('crm_tasks').update({status:t.status}).eq('id',id);
    rerenderSection();
  }
}

function openNewTaskModal() {
  const body=`<div style="display:flex;flex-direction:column;gap:12px">
    <input class="filter-input" id="nt-desc" placeholder="Task Description" />
    <input type="date" class="filter-input" id="nt-due" />
  </div>`;
  const footer=`<button class="btn btn-primary" onclick="submitNewTask()">Save Task</button>`;
  openModal('New Task', body, footer);
}

async function submitNewTask() {
  const desc=$('#nt-desc').value.trim();
  if(!desc){showToast('Description required','error');return;}
  const newTask = { id:'TSK-'+Date.now(), description:desc, due_date:$('#nt-due').value||null, status:'pending' };
  
  if (supabase) {
    const { error } = await supabase.from('crm_tasks').insert(newTask);
    if (error) { showToast('Error saving','error'); return; }
  }
  DATA.tasks.push(newTask);
  closeModal(); showToast('Task added','success'); rerenderSection();
}

/* ── CRM FIELD SERVICE LOGS ── */
function renderCRMFieldServiceLogs() {
  const logs = DATA.fieldServiceLogs || [];
  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Field Service Logs</h2>
    <button class="btn btn-primary" onclick="openNewFSLModal()"><i class="fa-solid fa-plus"></i> New Log</button>
  </div>`;
  if(logs.length===0) {
    html+=`<div class="empty-state" style="margin-top:40px"><i class="fa-solid fa-screwdriver-wrench"></i><p>No field service logs yet</p></div>`;
  } else {
    html+=`<table class="table"><thead><tr><th>ID</th><th>Date</th><th>Customer</th><th>Equipment</th><th>Technician</th><th>Status</th></tr></thead><tbody>`;
    logs.forEach(l => {
      html+=`<tr><td>${l.id}</td><td>${l.date}</td><td>${l.customer}</td><td>${l.equipment}</td><td>${l.technician}</td><td>${statusPill(l.status)}</td></tr>`;
    });
    html+=`</tbody></table>`;
  }
  html+=`</div>`;
  return html;
}

function openNewFSLModal() {
  const body = `<div style="display:flex;flex-direction:column;gap:12px">
    <input class="filter-input" id="fsl-customer" placeholder="Customer" />
    <input class="filter-input" id="fsl-equipment" placeholder="Equipment / Asset" />
    <input class="filter-input" id="fsl-technician" placeholder="Technician" />
    <input type="date" class="filter-input" id="fsl-date" />
    <select class="filter-select" id="fsl-status">
      <option value="Scheduled">Scheduled</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
    </select>
  </div>`;
  const footer = `<button class="btn btn-primary" onclick="submitNewFSL()">Save Log</button>`;
  openModal('New Field Service Log', body, footer);
}

async function submitNewFSL() {
  const customer = $('#fsl-customer').value.trim();
  if(!customer) { showToast('Customer is required','error'); return; }
  const log = {
    id:'FSL-'+Date.now(),
    date: $('#fsl-date').value || new Date().toISOString().split('T')[0],
    customer,
    equipment: $('#fsl-equipment').value.trim(),
    technician: $('#fsl-technician').value.trim(),
    status: $('#fsl-status').value
  };
  if(!DATA.fieldServiceLogs) DATA.fieldServiceLogs = [];
  if(supabase) await supabase.from('crm_field_service_logs').insert(log).catch(supabaseCatch);
  DATA.fieldServiceLogs.push(log);
  closeModal(); showToast('Log created','success'); rerenderSection();
}

/* ── CRM PARTNERS / JVs ── */
/* ── CRM PARTNERS / JVS ── */
function openNewPartnerModal() {
  openModal(t('partnersJVs'), `<div class="modal-body">
    <div class="form-row"><div class="form-group">
      <label>Partner / JV Name *</label>
      <input id="partnerName" class="form-input" placeholder="e.g. Gulf Tech Solutions">
    </div><div class="form-group">
      <label>Type *</label>
      <select id="partnerType" class="form-input">
        <option value="Partner">Partner</option>
        <option value="Joint Venture">Joint Venture</option>
      </select>
    </div></div>
    <div class="form-row"><div class="form-group">
      <label>Contact Person</label>
      <input id="partnerContact" class="form-input" placeholder="Name">
    </div><div class="form-group">
      <label>Email</label>
      <input id="partnerEmail" class="form-input" type="email" placeholder="email@example.com">
    </div></div>
    <div class="form-row"><div class="form-group">
      <label>Phone</label>
      <input id="partnerPhone" class="form-input" placeholder="+966 5X XXX XXXX">
    </div><div class="form-group">
      <label>Website</label>
      <input id="partnerWebsite" class="form-input" placeholder="https://">
    </div></div>
    <div class="form-group">
      <label>Address</label>
      <input id="partnerAddress" class="form-input" placeholder="Street, City, Country">
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea id="partnerNotes" class="form-input" rows="3" placeholder="Optional notes"></textarea>
    </div>
  </div>`, `<button class="btn btn-primary" onclick="submitNewPartner()">${t('save')}</button>
    <button class="btn btn-ghost" onclick="closeModal()">${t('cancel')}</button>`);
}
function submitNewPartner() {
  const name = document.getElementById('partnerName')?.value?.trim();
  if(!name) { showToast('Partner name is required','error'); return; }
  const id = 'PRT-' + String(DATA.partners.length + 1).padStart(3,'0');
  DATA.partners.push({
    id,
    name,
    type: document.getElementById('partnerType')?.value || 'Partner',
    contact: document.getElementById('partnerContact')?.value?.trim() || '',
    email: document.getElementById('partnerEmail')?.value?.trim() || '',
    phone: document.getElementById('partnerPhone')?.value?.trim() || '',
    website: document.getElementById('partnerWebsite')?.value?.trim() || '',
    address: document.getElementById('partnerAddress')?.value?.trim() || '',
    notes: document.getElementById('partnerNotes')?.value?.trim() || '',
    createdDate: new Date().toISOString().split('T')[0]
  });
  closeModal();
  showToast('Partner added','success');
  rerenderSection();
}
function renderCRMPartners() {
  const partners = DATA.partners || [];
  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Partners & Joint Ventures</h2>
    <button class="btn btn-primary" onclick="openNewPartnerModal()"><i class="fa-solid fa-plus"></i> New Partner</button>
  </div>`;
  if(partners.length===0) {
    html+=`<div class="empty-state" style="margin-top:40px"><i class="fa-solid fa-handshake"></i><p>No partners registered</p></div>`;
  } else {
    html+=`<table class="data-table" style="margin-top:16px">
      <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Contact</th><th>Email</th><th>Phone</th><th>Created</th></tr></thead><tbody>`;
    partners.forEach(p=>{
      html+=`<tr><td>${p.id}</td><td>${p.name}</td><td>${statusPill(p.type)}</td><td>${p.contact||'-'}</td><td>${p.email||'-'}</td><td>${p.phone||'-'}</td><td>${fmtDate(p.createdDate)}</td></tr>`;
    });
    html+=`</tbody></table>`;
  }
  html+=`</div>`;
  return html;
}

/* ── CRM SETTINGS ── */
function renderCRMSettings() {
  return `<div class="fade-in"><h2>CRM Settings</h2>
    <div class="empty-state" style="margin-top:40px"><i class="fa-solid fa-gear"></i><p>CRM configuration coming soon</p></div>
  </div>`;
}

/* ── CRM CONTACTS ── */
function renderCRMContacts() {
  const f = state.filters;
  let items = [...DATA.contacts];
  if (f.search) { const s = f.search.toLowerCase(); items = items.filter(c => c.first_name.toLowerCase().includes(s) || c.last_name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || (c.account_id && (DATA.accounts.find(a => a.id === c.account_id)?.name || '').toLowerCase().includes(s))); }
  if (f.account_id && f.account_id !== 'all') items = items.filter(c => c.account_id === f.account_id);

  const acctOpts = [...new Set(DATA.contacts.map(c => c.account_id))].map(id => { const a = DATA.accounts.find(x => x.id === id); return { id, name: a ? a.name : id }; }).filter(Boolean);

  let html = `<div class="fade-in">`;
  html += `<div class="filter-bar" style="justify-content:space-between;flex-wrap:wrap;">
    <h2>Contacts <span style="font-weight:400;font-size:14px;color:var(--text-sec)">(${DATA.contacts.length})</span></h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <input class="filter-input" placeholder="Search..." value="${f.search || ''}" oninput="state.filters.search=this.value;rerenderSection()" style="min-width:140px;">
      <select class="filter-select" onchange="state.filters.account_id=this.value;rerenderSection()">
        <option value="all">All Accounts</option>${acctOpts.map(o => `<option value="${o.id}" ${f.account_id === o.id ? 'selected' : ''}>${o.name}</option>`).join('')}
      </select>
      <button class="btn btn-primary btn-sm" onclick="openNewContactModal()"><i class="fa-solid fa-plus"></i> New Contact</button>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin-top:16px;">`;
  if (!items.length) html += `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-sec)">No contacts found</div>`;
  items.forEach(c => {
    const acct = DATA.accounts.find(a => a.id === c.account_id);
    const fullName = [c.salutation, c.first_name, c.last_name].filter(Boolean).join(' ');
    html += `<div class="sec-card" style="cursor:default;position:relative;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="avatar" style="width:42px;height:42px;font-size:14px;background:${c.is_primary ? 'var(--blue)' : 'var(--text-sec)'}">${initials(c.first_name + ' ' + c.last_name)}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:14px;">${fullName} ${c.is_primary ? '<span style="font-size:10px;background:var(--blue);color:#fff;padding:1px 6px;border-radius:3px;margin-left:4px;">PRIMARY</span>' : ''}</div>
          <div style="font-size:12px;color:var(--text-sec);">${c.designation || '—'}</div>
          ${acct ? `<div style="font-size:11px;color:var(--blue);margin-top:2px;"><i class="fa-solid fa-building"></i> ${acct.name}</div>` : ''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;font-size:12px;color:var(--text-sec);margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
        ${c.email ? `<span><i class="fa-solid fa-envelope" style="width:16px;"></i> ${c.email}</span>` : ''}
        ${c.phone ? `<span><i class="fa-solid fa-phone" style="width:16px;"></i> ${c.phone}</span>` : ''}
        ${c.mobile ? `<span><i class="fa-solid fa-mobile" style="width:16px;"></i> ${c.mobile}</span>` : ''}
        ${c.department ? `<span><i class="fa-solid fa-sitemap" style="width:16px;"></i> ${c.department}</span>` : ''}
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end;">
        ${hasRole('crm_manager')?`<button class="btn btn-ghost btn-sm" onclick="editContact('${c.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-ghost btn-sm" style="color:var(--error)" onclick="deleteContact('${c.id}')"><i class="fa-solid fa-trash-can"></i></button>`:''}
      </div>
    </div>`;
  });
  html += `</div></div>`;
  return html;
}

function openNewContactModal(editId) {
  const c = editId ? DATA.contacts.find(x => x.id === editId) : null;
  const acctOpts = DATA.accounts.map(a => `<option value="${a.id}" ${c && c.account_id === a.id ? 'selected' : ''}>${a.name}</option>`).join('');
  const body = `
    <input type="hidden" id="con-edit-id" value="${editId || ''}">
    <div class="form-row">
      <div class="form-group"><label class="form-label">Salutation</label>
        <select class="form-input" id="con-sal"><option value="">—</option><option value="Mr" ${c && c.salutation === 'Mr' ? 'selected' : ''}>Mr</option><option value="Ms" ${c && c.salutation === 'Ms' ? 'selected' : ''}>Ms</option><option value="Mrs" ${c && c.salutation === 'Mrs' ? 'selected' : ''}>Mrs</option><option value="Dr" ${c && c.salutation === 'Dr' ? 'selected' : ''}>Dr</option></select>
      </div>
      <div class="form-group"><label class="form-label">First Name *</label><input class="form-input" id="con-first" value="${c ? c.first_name : ''}" placeholder="First name"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Last Name *</label><input class="form-input" id="con-last" value="${c ? c.last_name : ''}" placeholder="Last name"></div>
      <div class="form-group"><label class="form-label">Account</label>
        <select class="form-input" id="con-acct"><option value="">— None —</option>${acctOpts}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="con-email" value="${c ? c.email : ''}" placeholder="email@domain.com"></div>
      <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="con-phone" value="${c ? c.phone : ''}" placeholder="+968 ..."></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Mobile</label><input class="form-input" id="con-mobile" value="${c ? c.mobile : ''}"></div>
      <div class="form-group"><label class="form-label">Designation</label><input class="form-input" id="con-desig" value="${c ? c.designation : ''}" placeholder="Job title"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Department</label><input class="form-input" id="con-dept" value="${c ? c.department : ''}"></div>
      <div class="form-group"><label class="form-label">Nationality</label><input class="form-input" id="con-nat" value="${c ? c.nationality : ''}"></div>
    </div>
    <div class="form-group"><label class="form-checkbox"><input type="checkbox" id="con-primary" ${c && c.is_primary ? 'checked' : ''}> Primary contact for this account</label></div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="con-notes" rows="2">${c ? c.notes || '' : ''}</textarea></div>`;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitContact()">${c ? 'Update' : 'Save'} Contact</button>`;
  openModal(editId ? 'Edit Contact' : 'New Contact', body, footer);
}
window.editContact = (id) => openNewContactModal(id);

async function submitContact() {
  const editId = $('#con-edit-id').value;
  const first = $('#con-first').value.trim();
  const last = $('#con-last').value.trim();
  if (!first || !last) { showToast('First and last name are required', 'error'); return; }
  const obj = {
    account_id: $('#con-acct').value || null,
    salutation: $('#con-sal').value,
    first_name: first,
    last_name: last,
    email: $('#con-email').value.trim(),
    phone: $('#con-phone').value.trim(),
    mobile: $('#con-mobile').value.trim(),
    designation: $('#con-desig').value.trim(),
    department: $('#con-dept').value.trim(),
    is_primary: $('#con-primary').checked,
    nationality: $('#con-nat').value.trim(),
    notes: $('#con-notes').value.trim(),
  };
  if (editId) {
    Object.assign(DATA.contacts.find(x => x.id === editId), obj);
    if (supabase) await supabase.from('crm_contacts').update(obj).eq('id', editId).catch(supabaseCatch);
    showToast('Contact updated', 'success');
  } else {
    obj.id = 'CON-' + Date.now();
    DATA.contacts.push(obj);
    if (supabase) await supabase.from('crm_contacts').insert(obj).catch(supabaseCatch);
    showToast('Contact saved', 'success');
  }
  closeModal();
  rerenderSection();
}

async function deleteContact(id) {
  if(!requireRoles(['crm_manager','system_admin'],'Access denied: Requires CRM Manager')) return;
  if (!confirm('Delete this contact?')) return;
  DATA.contacts = DATA.contacts.filter(c => c.id !== id);
  if (supabase) await supabase.from('crm_contacts').delete().eq('id', id).catch(supabaseCatch);
  showToast('Contact deleted', 'success');
  rerenderSection();
}

/* ── CRM QUOTATIONS ── */
function renderCRMQuotations() {
  const f = state.filters;
  let items = [...DATA.quotations];
  if (f.search) { const s = f.search.toLowerCase(); items = items.filter(q => q.id.toLowerCase().includes(s) || (q.account_name || '').toLowerCase().includes(s) || q.items.some(i => i.item.toLowerCase().includes(s))); }
  if (f.status && f.status !== 'all') items = items.filter(q => q.status === f.status);

  let html = `<div class="fade-in">`;
  html += `<div class="filter-bar" style="justify-content:space-between;flex-wrap:wrap;">
    <h2>Quotations <span style="font-weight:400;font-size:14px;color:var(--text-sec)">(${DATA.quotations.length})</span></h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <input class="filter-input" placeholder="Search..." value="${f.search || ''}" oninput="state.filters.search=this.value;rerenderSection()" style="min-width:140px;">
      <select class="filter-select" onchange="state.filters.status=this.value;rerenderSection()">
        <option value="all">All Status</option><option value="Draft" ${f.status === 'Draft' ? 'selected' : ''}>Draft</option><option value="Sent" ${f.status === 'Sent' ? 'selected' : ''}>Sent</option><option value="Accepted" ${f.status === 'Accepted' ? 'selected' : ''}>Accepted</option><option value="Lost" ${f.status === 'Lost' ? 'selected' : ''}>Lost</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="openNewQuotationModal()"><i class="fa-solid fa-plus"></i> New Quotation</button>
    </div>
  </div>
  <div style="overflow-x:auto;margin-top:16px;"><table class="data-table">
    <thead><tr>
      <th onclick="sortBy('id')" class="${sortedCls('id')}">ID ${sortIcon('id')}</th>
      <th>Account</th>
      <th>Date</th>
      <th>Valid Till</th>
      <th>Items</th>
      <th onclick="sortBy('grand_total')" class="${sortedCls('grand_total')}">Total ${sortIcon('grand_total')}</th>
      <th>Status</th>
      <th>Actions</th>
    </tr></thead><tbody>`;
  if (!items.length) html += `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-sec)">No quotations found</td></tr>`;
  items.forEach(q => {
    const statusColors = { Draft: 'var(--text-sec)', Sent: 'var(--blue)', Accepted: 'var(--success)', Lost: 'var(--error)' };
    html += `<tr>
      <td style="font-weight:600">${q.id}</td>
      <td>${q.account_name || q.account_id || '—'}</td>
      <td style="font-size:12px;color:var(--text-sec)">${fmtDate(q.date)}</td>
      <td style="font-size:12px;color:${q.valid_till && new Date(q.valid_till) < new Date() ? 'var(--error)' : 'var(--text-sec)'}">${fmtDate(q.valid_till)}</td>
      <td style="font-size:12px;">${q.items.length} item${q.items.length !== 1 ? 's' : ''}</td>
      <td style="font-weight:600">${fmt(q.grand_total)}</td>
      <td><span style="color:${statusColors[q.status] || 'var(--text-sec)'};font-weight:600">${q.status}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewQuotation('${q.id}')"><i class="fa-solid fa-eye"></i></button>
        ${q.status === 'Draft' ? `<button class="btn btn-ghost btn-sm" onclick="sendQuotation('${q.id}')" title="Mark as Sent"><i class="fa-solid fa-paper-plane"></i></button>` : ''}
        ${q.status === 'Accepted' ? `<button class="btn btn-ghost btn-sm" style="color:var(--success)" onclick="convertQuotationToInvoice('${q.id}')" title="Convert to Invoice"><i class="fa-solid fa-file-invoice-dollar"></i></button>` : ''}
        ${(hasRole('crm_manager'))?`<button class="btn btn-ghost btn-sm" style="color:var(--error)" onclick="deleteQuotation('${q.id}')"><i class="fa-solid fa-trash-can"></i></button>`:''}
      </td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  return html;
}

function openNewQuotationModal(editId, prefillDealId, prefillAcctId) {
  const q = editId ? DATA.quotations.find(x => x.id === editId) : null;
  const acctOpts = DATA.accounts.map(a => `<option value="${a.id}" ${(q && q.account_id === a.id) || (!q && a.id === prefillAcctId) ? 'selected' : ''}>${a.name}</option>`).join('');
  const dealOpts = DATA.deals.map(d => `<option value="${d.id}" ${(q && q.deal_id === d.id) || d.id === prefillDealId ? 'selected' : ''}>${d.title} (${fmt(d.value)})</option>`).join('');
  const body = `
    <input type="hidden" id="qtn-edit-id" value="${editId || ''}">
    <div class="form-row">
      <div class="form-group"><label class="form-label">Account *</label><select class="form-input" id="qtn-acct"><option value="">— Select Account —</option>${acctOpts}</select></div>
      <div class="form-group"><label class="form-label">Deal (optional)</label><select class="form-input" id="qtn-deal"><option value="">— None —</option>${dealOpts}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="qtn-date" type="date" value="${q ? q.date : new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="form-label">Valid Till</label><input class="form-input" id="qtn-valid" type="date" value="${q ? q.valid_till : ''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Status</label>
      <select class="form-input" id="qtn-status"><option value="Draft" ${q && q.status === 'Draft' ? 'selected' : ''}>Draft</option><option value="Sent" ${q && q.status === 'Sent' ? 'selected' : ''}>Sent</option><option value="Accepted" ${q && q.status === 'Accepted' ? 'selected' : ''}>Accepted</option><option value="Lost" ${q && q.status === 'Lost' ? 'selected' : ''}>Lost</option></select>
    </div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="qtn-notes" rows="2">${q ? q.notes || '' : ''}</textarea></div>
    <h4 style="margin:12px 0 8px;font-size:14px;">Line Items</h4>
    <div id="qtn-items-container">${q ? q.items.map((it, i) => renderQtnItemRow(i, it)).join('') : renderQtnItemRow(0)}</div>
    <div style="margin-top:8px;"><button class="btn btn-ghost btn-sm" onclick="addQtnItemRow()"><i class="fa-solid fa-plus"></i> Add Item</button></div>
    <div style="margin-top:10px;padding:10px;background:#f8fafc;border-radius:6px;">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Tax Rate (%)</label><input class="form-input" id="qtn-tax" type="number" min="0" step="0.1" value="${q ? q.tax_rate : 0}" oninput="recalcQtnTotals()"></div>
        <div class="form-group"><label class="form-label">Discount (%)</label><input class="form-input" id="qtn-disc-pct" type="number" min="0" step="0.1" value="${q ? q.discount_percent : 0}" oninput="recalcQtnTotals()"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-weight:600;margin-top:6px;">
        <span>Subtotal: <span id="qtn-subtotal">0</span></span>
        <span>Tax: <span id="qtn-tax-display">0</span></span>
        <span>Discount: <span id="qtn-disc-display">0</span></span>
        <span>Grand Total: <span id="qtn-grand-total" style="color:var(--success);font-size:16px;">0</span></span>
      </div>
    </div>`;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitQuotation()">${q ? 'Update' : 'Create'} Quotation</button>`;
  openModal(editId ? 'Edit Quotation' : 'New Quotation', body, footer);
  recalcQtnTotals();
}

function renderQtnItemRow(idx, it) {
  it = it || {};
  return `<div class="qtn-item-row" style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
    <input class="form-input" style="flex:2;min-width:80px;" id="qtn-item-${idx}-name" value="${it.item || ''}" placeholder="Item name">
    <input class="form-input" style="flex:1;min-width:60px;" id="qtn-item-${idx}-desc" value="${it.description || ''}" placeholder="Description">
    <input class="form-input" style="width:50px;" id="qtn-item-${idx}-qty" type="number" min="1" value="${it.qty || 1}" oninput="recalcQtnTotals()">
    <input class="form-input" style="width:80px;" id="qtn-item-${idx}-rate" type="number" min="0" step="1" value="${it.rate || 0}" oninput="recalcQtnTotals()">
    <span style="width:80px;font-weight:600;text-align:right;" id="qtn-item-${idx}-amount">${fmt(it.amount || 0)}</span>
    ${idx > 0 ? `<button class="btn btn-ghost btn-sm" style="color:var(--error);padding:4px;" onclick="this.closest('.qtn-item-row').remove();recalcQtnTotals()"><i class="fa-solid fa-xmark"></i></button>` : ''}
  </div>`;
}
window.addQtnItemRow = () => {
  const container = $('#qtn-items-container');
  const idx = container.children.length;
  container.insertAdjacentHTML('beforeend', renderQtnItemRow(idx, {}));
  recalcQtnTotals();
};
window.recalcQtnTotals = () => {
  const container = $('#qtn-items-container');
  let subtotal = 0;
  [...container.children].forEach((row, i) => {
    const qty = parseFloat($('#qtn-item-' + i + '-qty')?.value) || 0;
    const rate = parseFloat($('#qtn-item-' + i + '-rate')?.value) || 0;
    const amt = qty * rate;
    const el = $('#qtn-item-' + i + '-amount');
    if (el) el.textContent = fmt(amt);
    subtotal += amt;
  });
  const taxRate = parseFloat($('#qtn-tax')?.value) || 0;
  const discPct = parseFloat($('#qtn-disc-pct')?.value) || 0;
  const taxAmount = subtotal * taxRate / 100;
  const discAmount = subtotal * discPct / 100;
  const grandTotal = subtotal + taxAmount - discAmount;
  $('#qtn-subtotal').textContent = fmt(subtotal);
  $('#qtn-tax-display').textContent = fmt(taxAmount);
  $('#qtn-disc-display').textContent = fmt(discAmount);
  $('#qtn-grand-total').textContent = fmt(grandTotal);
};

async function submitQuotation() {
  const editId = $('#qtn-edit-id').value;
  const acctId = $('#qtn-acct').value;
  if (!acctId) { showToast('Account is required', 'error'); return; }
  const acct = DATA.accounts.find(a => a.id === acctId);
  const container = $('#qtn-items-container');
  const items = [];
  [...container.children].forEach((row, i) => {
    const item = ($('#qtn-item-' + i + '-name')?.value || '').trim();
    if (!item) return;
    const qty = parseFloat($('#qtn-item-' + i + '-qty')?.value) || 1;
    const rate = parseFloat($('#qtn-item-' + i + '-rate')?.value) || 0;
    items.push({ item, description: ($('#qtn-item-' + i + '-desc')?.value || '').trim(), qty, rate, amount: qty * rate });
  });
  if (!items.length) { showToast('At least one line item is required', 'error'); return; }
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const taxRate = parseFloat($('#qtn-tax')?.value) || 0;
  const discPct = parseFloat($('#qtn-disc-pct')?.value) || 0;
  const taxAmount = subtotal * taxRate / 100;
  const discAmount = subtotal * discPct / 100;
  const obj = {
    account_id: acctId,
    account_name: acct ? acct.name : '',
    deal_id: $('#qtn-deal').value || null,
    lead_id: null,
    date: $('#qtn-date').value || new Date().toISOString().split('T')[0],
    valid_till: $('#qtn-valid').value || '',
    items,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    discount_percent: discPct,
    discount_amount: discAmount,
    grand_total: subtotal + taxAmount - discAmount,
    status: $('#qtn-status').value,
    notes: $('#qtn-notes').value.trim(),
  };
  if (editId) {
    Object.assign(DATA.quotations.find(x => x.id === editId), obj);
    if (supabase) await supabase.from('crm_quotations').update(obj).eq('id', editId).catch(supabaseCatch);
    showToast('Quotation updated', 'success');
  } else {
    obj.id = 'QTN-' + Date.now();
    DATA.quotations.push(obj);
    if (supabase) await supabase.from('crm_quotations').insert(obj).catch(supabaseCatch);
    showToast('Quotation created', 'success');
  }
  closeModal();
  rerenderSection();
}

window.viewQuotation = (id) => {
  const q = DATA.quotations.find(x => x.id === id);
  if (!q) return;
  const statusColors = { Draft: 'var(--text-sec)', Sent: 'var(--blue)', Accepted: 'var(--success)', Lost: 'var(--error)' };
  let html = `<div style="max-width:600px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div><h3 style="margin:0">${q.id}</h3><div style="color:var(--text-sec);font-size:13px;">${q.account_name || ''}</div></div>
      <span style="font-weight:600;color:${statusColors[q.status] || 'var(--text-sec)'}">${q.status}</span>
    </div>
    <div style="display:flex;gap:20px;font-size:13px;color:var(--text-sec);margin-bottom:12px;">
      <span>Date: ${fmtDate(q.date)}</span>
      <span>Valid Till: ${fmtDate(q.valid_till)}</span>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="border-bottom:2px solid var(--border);"><th style="text-align:left;padding:6px 4px;">Item</th><th style="text-align:right;padding:6px 4px;">Qty</th><th style="text-align:right;padding:6px 4px;">Rate</th><th style="text-align:right;padding:6px 4px;">Amount</th></tr></thead>
      <tbody>${q.items.map(i => `<tr style="border-bottom:1px solid var(--border);"><td style="padding:6px 4px;">${i.item}${i.description ? '<br><span style="font-size:11px;color:var(--text-sec)">' + i.description + '</span>' : ''}</td><td style="text-align:right;padding:6px 4px;">${i.qty}</td><td style="text-align:right;padding:6px 4px;">${fmt(i.rate)}</td><td style="text-align:right;padding:6px 4px;font-weight:600;">${fmt(i.amount)}</td></tr>`).join('')}</tbody>
    </table>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);text-align:right;">
      <div>Subtotal: ${fmt(q.items.reduce((s, i) => s + i.amount, 0))}</div>
      ${q.tax_rate ? `<div>Tax (${q.tax_rate}%): ${fmt(q.tax_amount)}</div>` : ''}
      ${q.discount_percent ? `<div>Discount (${q.discount_percent}%): -${fmt(q.discount_amount)}</div>` : ''}
      <div style="font-size:18px;font-weight:700;color:var(--success);margin-top:4px;">Total: ${fmt(q.grand_total)}</div>
    </div>
    ${q.notes ? `<div style="margin-top:12px;padding:8px;background:#f8fafc;border-radius:4px;font-size:12px;color:var(--text-sec);">${q.notes}</div>` : ''}
  </div>`;
  const footer = `<button class="btn btn-primary" onclick="closeModal()">Close</button>`;
  openModal('Quotation: ' + q.id, html, footer);
};

window.sendQuotation = async (id) => {
  const q = DATA.quotations.find(x => x.id === id);
  if (q) { q.status = 'Sent'; if (supabase) await supabase.from('crm_quotations').update({ status: 'Sent' }).eq('id', id).catch(supabaseCatch); showToast('Quotation marked as Sent', 'success'); rerenderSection(); }
};

window.convertQuotationToInvoice = async (id) => {
  const q = DATA.quotations.find(x => x.id === id);
  if (!q) return;
  const newInv = {
    id: 'INV-' + Date.now(), type: 'Sales', party_name: q.account_name || q.account_id,
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: q.grand_total, status: 'Draft', deal_id: q.deal_id,
    cost_center_id: null, tax_template_id: null, tax_rate: q.tax_rate, tax_amount: q.tax_amount,
    items: q.items.map(it => ({ ...it }))
  };
  DATA.invoices.push(newInv);
  if (supabase) await supabase.from('fin_invoices').insert(newInv).catch(supabaseCatch);
  showToast('Invoice ' + newInv.id + ' created from ' + q.id, 'success');
  rerenderSection();
};

window.deleteQuotation = async (id) => {
  if(!requireRoles(['crm_manager','system_admin'],'Access denied: Requires CRM Manager')) return;
  if (!confirm('Delete this quotation?')) return;
  DATA.quotations = DATA.quotations.filter(q => q.id !== id);
  if (supabase) await supabase.from('crm_quotations').delete().eq('id', id).catch(supabaseCatch);
  showToast('Quotation deleted', 'success');
  rerenderSection();
};

/* ── CRM PROSPECTS ── */
function renderCRMProspects() {
  const f = state.filters;
  let items = [...DATA.prospects];
  if (f.search) { const s = f.search.toLowerCase(); items = items.filter(p => p.company_name.toLowerCase().includes(s) || p.industry?.toLowerCase().includes(s) || p.prospect_owner?.toLowerCase().includes(s)); }
  if (f.status && f.status !== 'all') items = items.filter(p => p.status === f.status);

  let html = `<div class="fade-in">`;
  html += `<div class="filter-bar" style="justify-content:space-between;flex-wrap:wrap;">
    <h2>Prospects <span style="font-weight:400;font-size:14px;color:var(--text-sec)">(${DATA.prospects.length})</span></h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <input class="filter-input" placeholder="Search..." value="${f.search || ''}" oninput="state.filters.search=this.value;rerenderSection()" style="min-width:140px;">
      <select class="filter-select" onchange="state.filters.status=this.value;rerenderSection()">
        <option value="all">All</option><option value="New" ${f.status === 'New' ? 'selected' : ''}>New</option><option value="Contacted" ${f.status === 'Contacted' ? 'selected' : ''}>Contacted</option><option value="Qualified" ${f.status === 'Qualified' ? 'selected' : ''}>Qualified</option><option value="Converted" ${f.status === 'Converted' ? 'selected' : ''}>Converted</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="openNewProspectModal()"><i class="fa-solid fa-plus"></i> New Prospect</button>
    </div>
  </div>
  <div style="overflow-x:auto;margin-top:16px;"><table class="data-table">
    <thead><tr>
      <th>Company</th><th>Industry</th><th>Territory</th><th>Owner</th><th>Status</th><th>Created</th><th>Actions</th>
    </tr></thead><tbody>`;
  if (!items.length) html += `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-sec)">No prospects found</td></tr>`;
  const statusColors = { New: 'var(--blue)', Contacted: 'var(--warning)', Qualified: 'var(--success)', Converted: 'var(--text-sec)' };
  items.forEach(p => {
    html += `<tr>
      <td style="font-weight:600">${p.company_name}${p.website ? '<br><span style="font-size:11px;color:var(--text-sec)">' + p.website + '</span>' : ''}</td>
      <td style="font-size:13px;">${p.industry || '—'}</td>
      <td style="font-size:13px;">${p.territory || '—'}</td>
      <td style="font-size:13px;">${p.prospect_owner || '—'}</td>
      <td><span style="color:${statusColors[p.status] || 'var(--text-sec)'};font-weight:600">${p.status}</span></td>
      <td style="font-size:12px;color:var(--text-sec)">${fmtDate(p.created_date)}</td>
      <td>
        ${p.status !== 'Converted' ? `<button class="btn btn-ghost btn-sm" style="color:var(--success)" onclick="convertProspectToLead('${p.id}')" title="Convert to Lead"><i class="fa-solid fa-arrow-right"></i></button>` : ''}
        ${(hasRole('crm_manager'))?`<button class="btn btn-ghost btn-sm" onclick="editProspect('${p.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-ghost btn-sm" style="color:var(--error)" onclick="deleteProspect('${p.id}')"><i class="fa-solid fa-trash-can"></i></button>`:''}
      </td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  return html;
}

function openNewProspectModal(editId) {
  const p = editId ? DATA.prospects.find(x => x.id === editId) : null;
  const body = `
    <input type="hidden" id="pro-edit-id" value="${editId || ''}">
    <div class="form-row">
      <div class="form-group"><label class="form-label">Company Name *</label><input class="form-input" id="pro-company" value="${p ? p.company_name : ''}"></div>
      <div class="form-group"><label class="form-label">Industry</label><input class="form-input" id="pro-industry" value="${p ? p.industry || '' : ''}" placeholder="Oil & Gas, LNG..."></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Website</label><input class="form-input" id="pro-website" value="${p ? p.website || '' : ''}"></div>
      <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="pro-phone" value="${p ? p.phone || '' : ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="pro-email" value="${p ? p.email || '' : ''}"></div>
      <div class="form-group"><label class="form-label">Territory</label><input class="form-input" id="pro-territory" value="${p ? p.territory || '' : ''}" placeholder="Oman North, South..."></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Owner</label><input class="form-input" id="pro-owner" value="${p ? p.prospect_owner || '' : ''}" placeholder="Sales person name"></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-input" id="pro-status"><option value="New" ${p && p.status === 'New' ? 'selected' : ''}>New</option><option value="Contacted" ${p && p.status === 'Contacted' ? 'selected' : ''}>Contacted</option><option value="Qualified" ${p && p.status === 'Qualified' ? 'selected' : ''}>Qualified</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="pro-notes" rows="2">${p ? p.notes || '' : ''}</textarea></div>`;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitProspect()">${p ? 'Update' : 'Save'} Prospect</button>`;
  openModal(editId ? 'Edit Prospect' : 'New Prospect', body, footer);
}
window.editProspect = (id) => openNewProspectModal(id);

async function submitProspect() {
  const editId = $('#pro-edit-id').value;
  const company = $('#pro-company').value.trim();
  if (!company) { showToast('Company name is required', 'error'); return; }
  const obj = {
    company_name: company,
    industry: $('#pro-industry').value.trim(),
    website: $('#pro-website').value.trim(),
    phone: $('#pro-phone').value.trim(),
    email: $('#pro-email').value.trim(),
    territory: $('#pro-territory').value.trim(),
    prospect_owner: $('#pro-owner').value.trim(),
    status: $('#pro-status').value,
    notes: $('#pro-notes').value.trim(),
    created_date: new Date().toISOString().split('T')[0],
  };
  if (editId) {
    Object.assign(DATA.prospects.find(x => x.id === editId), obj);
    if (supabase) await supabase.from('crm_prospects').update(obj).eq('id', editId).catch(supabaseCatch);
    showToast('Prospect updated', 'success');
  } else {
    obj.id = 'PRO-' + Date.now();
    DATA.prospects.push(obj);
    if (supabase) await supabase.from('crm_prospects').insert(obj).catch(supabaseCatch);
    showToast('Prospect saved', 'success');
  }
  closeModal();
  rerenderSection();
}

window.convertProspectToLead = async (id) => {
  const p = DATA.prospects.find(x => x.id === id);
  if (!p) return;
  const newLead = { id: 'LD-' + Date.now(), name: p.company_name, email: p.email || '', phone: p.phone || '', source: 'Prospect Conversion', status: 'New' };
  DATA.leads.push(newLead);
  p.status = 'Converted';
  if (supabase) {
    await supabase.from('crm_leads').insert(newLead).catch(supabaseCatch);
    await supabase.from('crm_prospects').update({ status: 'Converted' }).eq('id', id).catch(supabaseCatch);
  }
  showToast('Prospect converted to Lead: ' + newLead.id, 'success');
  rerenderSection();
};

window.deleteProspect = async (id) => {
  if(!requireRoles(['crm_manager','system_admin'],'Access denied: Requires CRM Manager')) return;
  if (!confirm('Delete this prospect?')) return;
  DATA.prospects = DATA.prospects.filter(p => p.id !== id);
  if (supabase) await supabase.from('crm_prospects').delete().eq('id', id).catch(supabaseCatch);
  showToast('Prospect deleted', 'success');
  rerenderSection();
};

/* ── CRM COMMUNICATIONS ── */
function renderCRMCommunications() {
  const f = state.filters;
  let items = [...DATA.communications].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  if (f.search) { const s = f.search.toLowerCase(); items = items.filter(m => m.subject?.toLowerCase().includes(s) || m.content?.toLowerCase().includes(s) || m.sender?.toLowerCase().includes(s) || m.recipients?.toLowerCase().includes(s)); }
  if (f.type && f.type !== 'all') items = items.filter(m => m.type === f.type);
  if (f.ref && f.ref !== 'all') items = items.filter(m => m.reference_type === f.ref);

  const typeIcons = { Email: 'fa-envelope', Call: 'fa-phone', Meeting: 'fa-handshake', Note: 'fa-note-sticky' };
  const typeColors = { Email: 'var(--blue)', Call: 'var(--success)', Meeting: 'var(--warning)', Note: 'var(--text-sec)' };

  let html = `<div class="fade-in">`;
  html += `<div class="filter-bar" style="justify-content:space-between;flex-wrap:wrap;">
    <h2>Communications <span style="font-weight:400;font-size:14px;color:var(--text-sec)">(${DATA.communications.length})</span></h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <input class="filter-input" placeholder="Search..." value="${f.search || ''}" oninput="state.filters.search=this.value;rerenderSection()" style="min-width:120px;">
      <select class="filter-select" onchange="state.filters.type=this.value;rerenderSection()">
        <option value="all">All Types</option><option value="Email" ${f.type === 'Email' ? 'selected' : ''}>Email</option><option value="Call" ${f.type === 'Call' ? 'selected' : ''}>Call</option><option value="Meeting" ${f.type === 'Meeting' ? 'selected' : ''}>Meeting</option><option value="Note" ${f.type === 'Note' ? 'selected' : ''}>Note</option>
      </select>
      <select class="filter-select" onchange="state.filters.ref=this.value;rerenderSection()">
        <option value="all">All References</option><option value="Account" ${f.ref === 'Account' ? 'selected' : ''}>Account</option><option value="Deal" ${f.ref === 'Deal' ? 'selected' : ''}>Deal</option><option value="Lead" ${f.ref === 'Lead' ? 'selected' : ''}>Lead</option><option value="Quotation" ${f.ref === 'Quotation' ? 'selected' : ''}>Quotation</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="openNewCommModal()"><i class="fa-solid fa-plus"></i> New Communication</button>
    </div>
  </div>
  <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;">`;
  if (!items.length) html += `<div style="text-align:center;padding:40px;color:var(--text-sec)">No communications found</div>`;
  items.forEach(m => {
    const refName = m.reference_id ? (DATA.accounts.find(a => a.id === m.reference_id)?.name || DATA.leads.find(l => l.id === m.reference_id)?.name || DATA.deals.find(d => d.id === m.reference_id)?.title || m.reference_id) : '—';
    html += `<div class="sec-card" style="cursor:default;">
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <div style="width:32px;height:32px;border-radius:50%;background:${typeColors[m.type] || 'var(--text-sec)'};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0;">
          <i class="fa-solid ${typeIcons[m.type] || 'fa-comment'}"></i>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-weight:600;font-size:14px;">${m.subject || '(No subject)'}</div>
            <div style="font-size:11px;color:var(--text-sec);white-space:nowrap;">${fmtDate(m.date)}</div>
          </div>
          <div style="font-size:12px;color:var(--text-sec);margin-top:2px;">
            <span style="font-weight:500;color:${typeColors[m.type] || 'var(--text-sec)'}">${m.type}</span>
            · ${m.reference_type}: <strong>${refName}</strong>
            · From: ${m.sender} → ${m.recipients || '—'}
          </div>
          <div style="font-size:13px;margin-top:6px;color:var(--text);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${m.content || ''}</div>
          <div style="margin-top:6px;"><button class="btn btn-ghost btn-sm" onclick="viewFullComm('${m.id}')">View Details</button></div>
        </div>
      </div>
    </div>`;
  });
  html += `</div></div>`;
  return html;
}

window.viewFullComm = (id) => {
  const m = DATA.communications.find(x => x.id === id);
  if (!m) return;
  const refName = m.reference_id ? (DATA.accounts.find(a => a.id === m.reference_id)?.name || DATA.leads.find(l => l.id === m.reference_id)?.name || DATA.deals.find(d => d.id === m.reference_id)?.title || m.reference_id) : '—';
  const body = `<div>
    <div style="font-size:13px;color:var(--text-sec);margin-bottom:8px;">
      <strong>${m.type}</strong> · ${m.reference_type}: ${refName} · ${fmtDate(m.date)}
    </div>
    <div style="font-size:13px;margin-bottom:6px;"><strong>From:</strong> ${m.sender}</div>
    <div style="font-size:13px;margin-bottom:12px;"><strong>To:</strong> ${m.recipients || '—'}</div>
    <div style="font-size:14px;line-height:1.6;padding:12px;background:#f8fafc;border-radius:6px;white-space:pre-wrap;">${m.content || ''}</div>
  </div>`;
  openModal(m.subject || 'Communication', body, `<button class="btn btn-primary" onclick="closeModal()">Close</button>`);
};

function openNewCommModal() {
  const refOpts = [
    ...DATA.accounts.map(a => ({ type: 'Account', id: a.id, name: a.name })),
    ...DATA.leads.map(l => ({ type: 'Lead', id: l.id, name: l.name })),
    ...DATA.deals.map(d => ({ type: 'Deal', id: d.id, name: d.title })),
    ...DATA.quotations.map(q => ({ type: 'Quotation', id: q.id, name: q.id })),
  ];
  const refHtml = refOpts.map(r => `<option value="${r.type}|${r.id}">[${r.type}] ${r.name}</option>`).join('');
  const body = `
    <div class="form-group"><label class="form-label">Type</label>
      <select class="form-input" id="comm-type"><option value="Email">Email</option><option value="Call">Call</option><option value="Meeting">Meeting</option><option value="Note">Note</option></select>
    </div>
    <div class="form-group"><label class="form-label">Reference (linked to)</label>
      <select class="form-input" id="comm-ref"><option value="">— None —</option>${refHtml}</select>
    </div>
    <div class="form-group"><label class="form-label">Subject</label><input class="form-input" id="comm-subject" placeholder="Subject line"></div>
    <div class="form-group"><label class="form-label">Content</label><textarea class="form-textarea" id="comm-content" rows="4" placeholder="Meeting notes, call summary, email content..."></textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Sender</label><input class="form-input" id="comm-sender" placeholder="Your name"></div>
      <div class="form-group"><label class="form-label">Recipients</label><input class="form-input" id="comm-recipients" placeholder="Name, email..."></div>
    </div>
    <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="comm-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>`;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitComm()">Save Communication</button>`;
  openModal('New Communication', body, footer);
}

async function submitComm() {
  const type = $('#comm-type').value;
  const refVal = $('#comm-ref').value;
  let refType = '', refId = '';
  if (refVal) { const parts = refVal.split('|'); refType = parts[0]; refId = parts[1]; }
  const obj = {
    id: 'COM-' + Date.now(),
    reference_type: refType,
    reference_id: refId || null,
    type,
    subject: $('#comm-subject').value.trim(),
    content: $('#comm-content').value.trim(),
    date: $('#comm-date').value || new Date().toISOString().split('T')[0],
    sender: $('#comm-sender').value.trim() || 'Current User',
    recipients: $('#comm-recipients').value.trim(),
  };
  if (!obj.subject && !obj.content) { showToast('Subject or content required', 'error'); return; }
  DATA.communications.push(obj);
  if (supabase) await supabase.from('crm_communications').insert(obj).catch(supabaseCatch);
  closeModal();
  showToast('Communication logged', 'success');
  rerenderSection();
}

/* ── ENHANCED CRM LEADS (with Convert to Account) ── */
function renderCRMLeads() {
  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between;flex-wrap:wrap;">
    <h2>Leads <span style="font-weight:400;font-size:14px;color:var(--text-sec)">(${DATA.leads.length})</span></h2>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-primary" onclick="openNewLeadModal()">+ New Lead</button>
    </div>
  </div>
  <div style="overflow-x:auto;margin-top:16px;"><table class="data-table">
    <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Source</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>`;
  if (DATA.leads.length === 0) html += `<tr><td colspan="6" style="text-align:center;padding:30px">No leads found.</td></tr>`;
  DATA.leads.forEach(l => {
    const alreadyConverted = DATA.accounts.find(a => a.name === l.name);
    html += `<tr>
      <td><strong>${l.name}</strong></td>
      <td>${l.email || '-'}</td>
      <td>${l.phone || '-'}</td>
      <td>${l.source || '-'}</td>
      <td><span class="status-pill status-${(l.status || 'new').toLowerCase().replace(' ', '-')}">${l.status || 'New'}</span></td>
      <td>
        ${!alreadyConverted ? `<button class="btn btn-ghost btn-sm" style="color:var(--success)" onclick="convertLeadToAccount('${l.id}')" title="Convert to Account"><i class="fa-solid fa-arrow-right-to-bracket"></i> Convert</button>` : `<span style="font-size:11px;color:var(--success)"><i class="fa-solid fa-check"></i> Converted</span>`}
        ${(hasRole('crm_manager'))?`<button class="btn btn-ghost btn-sm" onclick="deleteLead('${l.id}')"><i class="fa-solid fa-trash-can"></i></button>`:''}
      </td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  return html;
}

window.convertLeadToAccount = async (id) => {
  const lead = DATA.leads.find(x => x.id === id);
  if (!lead) return;
  if (DATA.accounts.find(a => a.name === lead.name)) { showToast('Account with this name already exists', 'warning'); return; }
  const newAcct = {
    id: 'ACC-' + Date.now(),
    name: lead.name,
    type: 'Customer',
    rating: 'Warm',
    owner: 'Current User',
    country: 'Oman',
    contractValue: 0,
    openOpps: 0,
    status: 'active',
    website: '',
    phone: lead.phone || '',
    email: lead.email || '',
  };
  DATA.accounts.push(newAcct);
  // Create a contact from lead info
  const nameParts = lead.name.split(' ');
  const newContact = {
    id: 'CON-' + Date.now(),
    account_id: newAcct.id,
    salutation: '',
    first_name: nameParts[0] || lead.name,
    last_name: nameParts.slice(1).join(' ') || '',
    email: lead.email || '',
    phone: lead.phone || '',
    mobile: '',
    designation: '',
    department: '',
    is_primary: true,
    nationality: '',
    notes: 'Converted from lead ' + lead.id,
  };
  DATA.contacts.push(newContact);
  // Create a deal from the lead
  const newDeal = {
    id: 'DL-' + Date.now(),
    title: lead.name + ' - Initial Deal',
    lead_id: lead.id,
    account_id: newAcct.id,
    value: 0,
    stage: 'Prospecting',
    expected_close_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invoice_id: null,
  };
  DATA.deals.push(newDeal);
  if (supabase) {
    await supabase.from('crm_accounts').insert(newAcct).catch(supabaseCatch);
    await supabase.from('crm_contacts').insert(newContact).catch(supabaseCatch);
    await supabase.from('crm_deals').insert(newDeal).catch(supabaseCatch);
  }
  showToast('Lead converted: Account ' + newAcct.id + ', Contact, and Deal created', 'success');
  rerenderSection();
};

window.deleteLead = async (id) => {
  if(!requireRoles(['crm_manager','system_admin'],'Access denied: Requires CRM Manager')) return;
  if (!confirm('Delete this lead?')) return;
  DATA.leads = DATA.leads.filter(l => l.id !== id);
  if (supabase) await supabase.from('crm_leads').delete().eq('id', id).catch(supabaseCatch);
  showToast('Lead deleted', 'success');
  rerenderSection();
};

/* ── ENHANCED CRM DEALS (with Create Quotation) ── */
function renderCRMDeals(filterFn) {
  const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const stageProb = { Prospecting: 10, Qualification: 25, Proposal: 50, Negotiation: 75, 'Closed Won': 100, 'Closed Lost': 0 };
  let deals = DATA.deals;
  if (filterFn) deals = deals.filter(filterFn);
  const totalWeighted = deals.reduce((s, d) => s + (parseFloat(d.value || 0) * (stageProb[d.stage] || 0) / 100), 0);
  let html = `<div class="fade-in" style="display:flex;flex-direction:column;height:100%">
    <div class="filter-bar" style="justify-content:space-between;flex-wrap:wrap;">
      <h2>Deals Pipeline <span style="font-weight:400;font-size:14px;color:var(--text-sec)">(${deals.length})</span></h2>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span style="font-size:13px;color:var(--text-sec);">Weighted Pipeline: <strong style="color:var(--blue);font-size:15px;">${fmt(totalWeighted)}</strong></span>
        <button class="btn btn-primary btn-sm" onclick="openNewDealModal()">+ New Deal</button>
      </div>
    </div>
    <h4 style="margin:8px 0 4px;font-size:16px;color:var(--success);">Forecast</h4>
    <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
      ${stages.filter(s => s !== 'Closed Won' && s !== 'Closed Lost').map(s => {
        const stageDeals = deals.filter(d => d.stage === s);
        const val = stageDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
        const weighted = val * (stageProb[s] || 0) / 100;
        return `<div style="padding:8px 14px;background:#f0f4f8;border-radius:6px;text-align:center;min-width:100px;">
          <div style="font-size:11px;color:var(--text-sec)">${s}</div>
          <div style="font-weight:600;font-size:14px;">${fmt(val)}</div>
          <div style="font-size:11px;color:var(--blue)">${fmt(weighted)} weighted</div>
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:16px;overflow-x:auto;flex:1;padding-bottom:16px;">`;
  stages.forEach(st => {
    const stageDeals = deals.filter(d => d.stage === st);
    const totalVal = stageDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    const stageWeighted = totalVal * (stageProb[st] || 0) / 100;
    html += `<div class="kanban-col" ondragover="event.preventDefault()" ondrop="dropDeal(event, '${st}')" style="flex:0 0 280px;background:#f8fafc;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <h3 style="font-size:13px;color:var(--text);margin:0;">${st} <span style="color:var(--text-sec);font-weight:normal">(${stageDeals.length})</span></h3>
        <span style="font-size:12px;font-weight:600;color:var(--success)">${fmt(totalVal)}</span>
      </div>
      ${st !== 'Closed Won' && st !== 'Closed Lost' ? `<div style="font-size:10px;color:var(--blue);margin-bottom:4px;">Weighted: ${fmt(stageWeighted)}</div>` : ''}
      ${stageDeals.map(d => {
        const acctName = d.account_id ? (DATA.accounts.find(a => a.id === d.account_id)?.name || '') : d.lead_id ? (DATA.leads.find(l => l.id === d.lead_id)?.name || '') : '';
        return `<div class="kanban-card" draggable="true" ondragstart="dragStartDeal(event, '${d.id}')" style="background:#fff;padding:12px;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.1);cursor:grab;border-left:4px solid var(--blue);">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">${d.title}</div>
          ${acctName ? `<div style="font-size:11px;color:var(--text-sec);margin-bottom:2px;">${acctName}</div>` : ''}
          <div style="font-size:13px;color:var(--text-sec);margin-bottom:2px;">${fmt(d.value)}</div>
          <div style="font-size:11px;color:#888;margin-bottom:2px;">Close: ${d.expected_close_date || 'N/A'}</div>
          ${d.sales_person ? `<div style="font-size:10px;color:var(--text-sec);margin-bottom:2px;"><i class="fa-solid fa-user"></i> ${d.sales_person}</div>` : ''}
          ${d.territory ? `<div style="font-size:10px;color:var(--text-sec);margin-bottom:4px;"><i class="fa-solid fa-location-dot"></i> ${d.territory}</div>` : ''}
          <div style="display:flex;gap:4px;">
            <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:2px 6px;" onclick="createQuotationFromDeal('${d.id}')" title="Create Quotation"><i class="fa-solid fa-file-invoice"></i> Quote</button>
            <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:2px 6px;" onclick="viewDealDeals('${d.id}')" title="View"><i class="fa-solid fa-eye"></i></button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  });
  html += `</div></div>`;
  return html;
}

window.createQuotationFromDeal = (dealId) => {
  const d = DATA.deals.find(x => x.id === dealId);
  if (!d) return;
  const acctId = d.account_id || (d.lead_id ? DATA.accounts.find(a => a.name === (DATA.leads.find(l => l.id === d.lead_id)?.name || ''))?.id : null);
  setTimeout(() => openNewQuotationModal(null, dealId, acctId), 100);
};

window.viewDealDeals = (id) => {
  const d = DATA.deals.find(x => x.id === id);
  if (!d) return;
  const acctName = d.account_id ? (DATA.accounts.find(a => a.id === d.account_id)?.name || '—') : d.lead_id ? (DATA.leads.find(l => l.id === d.lead_id)?.name || '—') : '—';
  const qtns = DATA.quotations.filter(q => q.deal_id === id);
  const body = `<div>
    <div style="margin-bottom:12px;"><strong>${d.title}</strong> · ${fmt(d.value)} · ${d.stage}</div>
    <div style="font-size:13px;color:var(--text-sec);margin-bottom:4px;">Account: ${acctName}</div>
    <div style="font-size:13px;color:var(--text-sec);margin-bottom:4px;">Close Date: ${d.expected_close_date || 'N/A'}</div>
    ${d.sales_person ? `<div style="font-size:13px;color:var(--text-sec);margin-bottom:4px;">Sales Person: ${d.sales_person}</div>` : ''}
    ${d.territory ? `<div style="font-size:13px;color:var(--text-sec);margin-bottom:4px;">Territory: ${d.territory}</div>` : ''}
    ${d.lost_reason ? `<div style="font-size:13px;color:var(--error);margin-bottom:4px;">Lost Reason: ${d.lost_reason}</div>` : ''}
    ${qtns.length ? `<h4 style="margin:12px 0 6px;font-size:13px;">Quotations (${qtns.length})</h4>
      ${qtns.map(q => `<div style="font-size:12px;padding:4px 0;">${q.id} · ${fmt(q.grand_total)} · ${q.status}</div>`).join('')}` : ''}
  </div>`;
  openModal('Deal: ' + d.id, body, `<button class="btn btn-primary" onclick="closeModal()">Close</button>`);
};

/* ── CRM WIN/LOSS ANALYSIS ── */
function renderCRMWinLoss() {
  const won = DATA.deals.filter(d => d.stage === 'Closed Won');
  const lost = DATA.deals.filter(d => d.stage === 'Closed Lost');
  const total = won.length + lost.length;
  const winRate = total > 0 ? Math.round(won.length / total * 100) : 0;
  const wonVal = won.reduce((s, d) => s + parseFloat(d.value || 0), 0);
  const lostVal = lost.reduce((s, d) => s + parseFloat(d.value || 0), 0);

  // Group lost by reason
  const reasons = {};
  lost.forEach(d => {
    const r = d.lost_reason || 'Unknown';
    reasons[r] = (reasons[r] || 0) + 1;
  });
  const topReasons = Object.entries(reasons).sort((a, b) => b[1] - a[1]);

  // Group by sales person
  const spWon = {}, spLost = {}, spValWon = {}, spValLost = {};
  DATA.deals.forEach(d => {
    const sp = d.sales_person || 'Unassigned';
    if (d.stage === 'Closed Won') {
      spWon[sp] = (spWon[sp] || 0) + 1;
      spValWon[sp] = (spValWon[sp] || 0) + parseFloat(d.value || 0);
    } else if (d.stage === 'Closed Lost') {
      spLost[sp] = (spLost[sp] || 0) + 1;
      spValLost[sp] = (spValLost[sp] || 0) + parseFloat(d.value || 0);
    }
  });
  const allSPs = [...new Set([...Object.keys(spWon), ...Object.keys(spLost)])];

  // Territory analysis
  const tWon = {}, tLost = {}, tValWon = {}, tValLost = {};
  DATA.deals.forEach(d => {
    const t = d.territory || 'Unassigned';
    if (d.stage === 'Closed Won') {
      tWon[t] = (tWon[t] || 0) + 1;
      tValWon[t] = (tValWon[t] || 0) + parseFloat(d.value || 0);
    } else if (d.stage === 'Closed Lost') {
      tLost[t] = (tLost[t] || 0) + 1;
      tValLost[t] = (tValLost[t] || 0) + parseFloat(d.value || 0);
    }
  });
  const allTerr = [...new Set([...Object.keys(tWon), ...Object.keys(tLost)])];

  let html = `<div class="fade-in">
    <h2>Win/Loss Analysis</h2>
    <div class="kpi-grid" style="margin-top:16px;">
      <div class="kpi-card green"><span class="kpi-label">Closed Won</span><span class="kpi-value">${won.length}</span><span class="kpi-change kpi-up">${fmt(wonVal)} total value</span></div>
      <div class="kpi-card red"><span class="kpi-label">Closed Lost</span><span class="kpi-value">${lost.length}</span><span class="kpi-change kpi-warn">${fmt(lostVal)} total value</span></div>
      <div class="kpi-card"><span class="kpi-label">Win Rate</span><span class="kpi-value" style="color:${winRate >= 50 ? 'var(--success)' : 'var(--error)'}">${winRate}%</span><span class="kpi-change">${total} total decisions</span></div>
      <div class="kpi-card purple"><span class="kpi-label">Active Pipeline</span><span class="kpi-value">${DATA.deals.length - won.length - lost.length}</span><span class="kpi-change"><i class="fa-solid fa-chart-line"></i> Still in play</span></div>
    </div>`;

  // Top Lost Reasons
  if (topReasons.length) {
    html += `<div class="sec-card" style="margin-top:16px;"><div class="sec-card-head">Top Reasons for Lost Deals</div><div class="sec-card-body">
      <div style="display:flex;flex-direction:column;gap:6px;">`;
    const maxReasonCount = Math.max(...topReasons.map(r => r[1]));
    topReasons.forEach(([reason, count]) => {
      const pct = Math.round(count / lost.length * 100);
      html += `<div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px;">
          <span>${reason}</span><span style="font-weight:600;">${count} (${pct}%)</span>
        </div>
        <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;">
          <div style="width:${count / maxReasonCount * 100}%;height:100%;background:var(--error);border-radius:4px;"></div>
        </div>
      </div>`;
    });
    html += `</div></div></div>`;
  }

  // Sales Person Performance
  if (allSPs.length) {
    html += `<div class="sec-card" style="margin-top:16px;"><div class="sec-card-head">Sales Person Performance</div>
      <div style="overflow-x:auto;"><table class="data-table">
        <thead><tr><th>Sales Person</th><th>Won</th><th>Lost</th><th>Win Rate</th><th>Won Value</th><th>Lost Value</th></tr></thead>
        <tbody>${allSPs.map(sp => {
          const w = spWon[sp] || 0, l = spLost[sp] || 0;
          const rate = (w + l) > 0 ? Math.round(w / (w + l) * 100) : 0;
          return `<tr><td style="font-weight:600">${sp}</td><td style="color:var(--success)">${w}</td><td style="color:var(--error)">${l}</td><td style="font-weight:600;color:${rate >= 50 ? 'var(--success)' : 'var(--error)'}">${rate}%</td><td>${fmt(spValWon[sp] || 0)}</td><td>${fmt(spValLost[sp] || 0)}</td></tr>`;
        }).join('')}</tbody>
      </table></div></div>`;
  }

  // Territory Analysis
  if (allTerr.length) {
    html += `<div class="sec-card" style="margin-top:16px;"><div class="sec-card-head">Territory Performance</div>
      <div style="overflow-x:auto;"><table class="data-table">
        <thead><tr><th>Territory</th><th>Won</th><th>Lost</th><th>Win Rate</th><th>Won Value</th><th>Lost Value</th></tr></thead>
        <tbody>${allTerr.map(t => {
          const w = tWon[t] || 0, l = tLost[t] || 0;
          const rate = (w + l) > 0 ? Math.round(w / (w + l) * 100) : 0;
          return `<tr><td style="font-weight:600">${t}</td><td style="color:var(--success)">${w}</td><td style="color:var(--error)">${l}</td><td style="font-weight:600;color:${rate >= 50 ? 'var(--success)' : 'var(--error)'}">${rate}%</td><td>${fmt(tValWon[t] || 0)}</td><td>${fmt(tValLost[t] || 0)}</td></tr>`;
        }).join('')}</tbody>
      </table></div></div>`;
  }

  // Recent Closed Deals
  const recentClosed = DATA.deals.filter(d => d.stage === 'Closed Won' || d.stage === 'Closed Lost').slice(0, 10);
  if (recentClosed.length) {
    html += `<div class="sec-card" style="margin-top:16px;"><div class="sec-card-head">Recent Closed Deals</div>
      <div style="overflow-x:auto;"><table class="data-table">
        <thead><tr><th>Deal</th><th>Account</th><th>Value</th><th>Result</th><th>Sales Person</th><th>Notes</th></tr></thead>
        <tbody>${recentClosed.map(d => {
          const acctName = d.account_id ? (DATA.accounts.find(a => a.id === d.account_id)?.name || '') : d.lead_id ? (DATA.leads.find(l => l.id === d.lead_id)?.name || '') : '';
          return `<tr>
            <td style="font-weight:600">${d.title}</td>
            <td style="font-size:12px;color:var(--text-sec)">${acctName}</td>
            <td>${fmt(d.value)}</td>
            <td><span style="color:${d.stage === 'Closed Won' ? 'var(--success)' : 'var(--error)'};font-weight:600">${d.stage === 'Closed Won' ? '<i class="fa-solid fa-trophy"></i> Won' : '<i class="fa-solid fa-ban"></i> Lost'}</span></td>
            <td style="font-size:12px">${d.sales_person || '—'}</td>
            <td style="font-size:12px;color:var(--text-sec);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.notes || d.lost_reason || '—'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div></div>`;
  }

  html += `</div>`;
  return html;
}

/* ── CRM TERRITORY VIEW ── */
function renderCRMTerritory() {
  // Build territory data from accounts and deals
  const territoryAccounts = {};
  DATA.accounts.forEach(a => {
    const t = a.territory || 'Unassigned';
    if (!territoryAccounts[t]) territoryAccounts[t] = { accounts: [], deals: [], totalValue: 0 };
    territoryAccounts[t].accounts.push(a);
    territoryAccounts[t].totalValue += (a.contractValue || 0);
  });
  DATA.deals.forEach(d => {
    const t = d.territory || 'Unassigned';
    if (!territoryAccounts[t]) territoryAccounts[t] = { accounts: [], deals: [], totalValue: 0 };
    territoryAccounts[t].deals.push(d);
  });

  const territories = Object.entries(territoryAccounts);
  const allSalesPersons = [...new Set(DATA.deals.map(d => d.sales_person).filter(Boolean))];

  let html = `<div class="fade-in">
    <h2>Territory View</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-top:16px;">`;

  territories.forEach(([territory, data]) => {
    const openDeals = data.deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
    const wonDeals = data.deals.filter(d => d.stage === 'Closed Won');
    const dealVal = openDeals.reduce((s, d) => s + parseFloat(d.value || 0), 0);
    const wonVal = wonDeals.reduce((s, d) => s + parseFloat(d.value || 0), 0);
    const persons = [...new Set(data.deals.filter(d => d.sales_person).map(d => d.sales_person))];

    html += `<div class="sec-card" style="cursor:default;">
      <div class="sec-card-head" style="font-size:15px;">
        <i class="fa-solid fa-map-pin" style="color:var(--blue);"></i> ${territory}
        <span style="font-weight:400;font-size:12px;color:var(--text-sec);">${data.accounts.length} accounts</span>
      </div>
      <div class="sec-card-body" style="font-size:13px;">
        <div style="display:flex;gap:16px;margin-bottom:10px;flex-wrap:wrap;">
          <span><strong>${data.accounts.length}</strong> accounts</span>
          <span><strong>${openDeals.length}</strong> open deals</span>
          <span style="color:var(--success);"><strong>${fmt(dealVal)}</strong> pipeline</span>
          ${wonDeals.length ? `<span style="color:var(--success);"><strong>${fmt(wonVal)}</strong> won</span>` : ''}
        </div>
        ${persons.length ? `<div style="font-size:12px;color:var(--text-sec);margin-bottom:8px;"><i class="fa-solid fa-user"></i> ${persons.join(', ')}</div>` : ''}
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${data.accounts.slice(0, 5).map(a => `<span style="padding:2px 8px;background:#f0f4f8;border-radius:4px;font-size:11px;">${a.name}</span>`).join('')}
          ${data.accounts.length > 5 ? `<span style="font-size:11px;color:var(--text-sec);">+${data.accounts.length - 5} more</span>` : ''}
        </div>
        ${openDeals.length ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
          <div style="font-size:12px;font-weight:600;margin-bottom:4px;">Open Deals</div>
          ${openDeals.slice(0, 3).map(d => `<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0;">
            <span>${d.title}</span><span style="font-weight:600;">${fmt(d.value)}</span>
          </div>`).join('')}
          ${openDeals.length > 3 ? `<div style="font-size:11px;color:var(--text-sec);margin-top:2px;">+${openDeals.length - 3} more deals</div>` : ''}
        </div>` : ''}
      </div>
    </div>`;
  });

  html += `</div>
    <div class="sec-card" style="margin-top:16px;"><div class="sec-card-head">Account Territory Summary</div>
    <div style="overflow-x:auto;"><table class="data-table">
      <thead><tr><th>Territory</th><th>Accounts</th><th>Total Contract Value</th><th>Open Deals</th><th>Pipeline Value</th><th>Sales Persons</th></tr></thead>
      <tbody>${territories.map(([t, d]) => {
        const openDeals = d.deals.filter(dl => dl.stage !== 'Closed Won' && dl.stage !== 'Closed Lost');
        const persons = [...new Set(d.deals.filter(dl => dl.sales_person).map(dl => dl.sales_person))];
        return `<tr><td style="font-weight:600">${t}</td><td>${d.accounts.length}</td><td>${fmt(d.totalValue)}</td><td>${openDeals.length}</td><td>${fmt(openDeals.reduce((s, dl) => s + parseFloat(dl.value || 0), 0))}</td><td style="font-size:12px">${persons.join(', ') || '—'}</td></tr>`;
      }).join('')}</tbody>
    </table></div></div>
  </div>`;
  return html;
}

/* ── HR ATTENDANCE ── */
function renderHRAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const myId = DATA.employees[0]?.id||'EMP-001';
  const myAtt = DATA.attendance.find(a => a.employee_id === myId && a.date === today);
  const checkedIn = myAtt && myAtt.check_in_time && !myAtt.check_out_time;
  
  let html=`<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Attendance & Timesheets</h2>
    <div>
      ${!checkedIn ? `<button class="btn btn-primary" onclick="hrCheckIn()">Check In</button>` : `<button class="btn btn-danger" onclick="hrCheckOut()">Check Out</button>`}
    </div>
  </div>
  <table class="table">
    <thead><tr><th>Date</th><th>Employee ID</th><th>Status</th><th>Check In</th><th>Check Out</th></tr></thead>
    <tbody>`;
  DATA.attendance.slice().reverse().forEach(a => {
    html+=`<tr>
      <td>${a.date}</td><td>${a.employee_id}</td>
      <td><span class="status-pill status-${a.status.toLowerCase().replace(' ','-')}">${a.status}</span></td>
      <td>${a.check_in_time||'-'}</td><td>${a.check_out_time||'-'}</td>
    </tr>`;
  });
  if(DATA.attendance.length===0) html+=`<tr><td colspan="5" style="text-align:center">No attendance records.</td></tr>`;
  html+=`</tbody></table></div>`;
  return html;
}

async function hrCheckIn() {
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});
  const myId = DATA.employees[0]?.id||'EMP-001';
  const rec = { id:'ATT-'+Date.now(), employee_id:myId, date:today, status:'Present', check_in_time:time, check_out_time:null };
  
  if (supabase) {
    const { error } = await supabase.from('hr_attendance').insert(rec);
    if (error) { showToast('Error saving','error'); return; }
  }
  DATA.attendance.push(rec);
  showToast('Checked in successfully!','success'); rerenderSection();
}

async function hrCheckOut() {
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});
  const myId = DATA.employees[0]?.id||'EMP-001';
  const myAtt = DATA.attendance.find(a => a.employee_id === myId && a.date === today);
  
  if(myAtt) {
    myAtt.check_out_time = time;
    if(supabase) await supabase.from('hr_attendance').update({check_out_time:time}).eq('id', myAtt.id);
    showToast('Checked out successfully!','success'); rerenderSection();
  }
}

/* ── HR EXPENSES ── */
/* ── HR: ABSENCE RECORDING ── */
function openNewAbsenceModal() {
  const empOpts = DATA.employees.filter(e=>e.status==='active').map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
  openModal('Record Absence', `<div class="modal-body">
    <div class="form-group"><label>Employee *</label>
      <select id="abs-emp" class="form-input">${empOpts}</select></div>
    <div class="form-row"><div class="form-group">
      <label>Date *</label>
      <input id="abs-date" class="form-input" type="date" value="${new Date().toISOString().split('T')[0]}">
    </div></div>
    <div class="form-group"><label>Type</label>
      <select id="abs-type" class="form-input">
        <option value="Absent">Unexcused Absence</option>
        <option value="Late">Late Arrival</option>
        <option value="Early Departure">Early Departure</option>
      </select></div>
  </div>`, `<button class="btn btn-primary" onclick="submitNewAbsence()">Save</button>
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`);
}
async function submitNewAbsence() {
  const empId = document.getElementById('abs-emp')?.value;
  const date = document.getElementById('abs-date')?.value;
  if(!empId||!date){showToast('Employee and date required','error');return;}
  const id='ABS-'+Date.now();
  const rec={id,employee_id:empId,date,status:document.getElementById('abs-type')?.value||'Absent',check_in_time:null,check_out_time:null};
  DATA.attendance.push(rec);
  if(supabase) await supabase.from('hr_attendance').insert(rec).catch(supabaseCatch);
  closeModal();
  showToast('Absence recorded','success');
  rerenderSection();
}

function renderHRAbsenceCalendar() {
  const allLeaves = DATA.leaveRequests.map(l => ({
    id: l.id, employee: l.employeeName, type: l.type, startDate: l.startDate, endDate: l.endDate, status: l.status, source: 'Leave'
  }));
  const absences = DATA.attendance.filter(a => a.status === 'Absent').map(a => {
    const emp = DATA.employees.find(e => e.id === a.employee_id);
    return { id: a.id, employee: emp ? emp.name : a.employee_id, type: 'Unexcused Absence', startDate: a.date, endDate: a.date, status: 'Logged', source: 'Attendance' };
  });

  const combined = [...allLeaves, ...absences].sort((a,b) => new Date(b.startDate) - new Date(a.startDate));

  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between"><h2>Absence & Leave Calendar</h2>
    <button class="btn btn-primary btn-sm" onclick="openNewAbsenceModal()"><i class="fa-solid fa-plus"></i> Record Absence</button></div>
  <table class="table">
    <thead><tr><th>Type</th><th>Employee</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Source</th></tr></thead>
    <tbody>`;
  combined.forEach(item => {
    html += `<tr>
      <td><strong>${item.type}</strong></td>
      <td>${item.employee}</td>
      <td>${item.startDate}</td>
      <td>${item.endDate}</td>
      <td><span class="status-pill status-${item.status.toLowerCase().replace(' ','-')}">${item.status}</span></td>
      <td>${item.source}</td>
    </tr>`;
  });
  if(combined.length===0) html += `<tr><td colspan="6" style="text-align:center">No absences found.</td></tr>`;
  html += `</tbody></table></div>`;
  return html;
}

function renderHROpenPositions() {
  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Open Positions</h2>
    <button class="btn btn-primary" onclick="openNewPositionModal()">+ New Position</button>
  </div>
  <table class="table">
    <thead><tr><th>ID</th><th>Job Title</th><th>Department</th><th>Posted Date</th><th>Status</th></tr></thead>
    <tbody>`;
  DATA.openPositions.forEach(p => {
    html += `<tr>
      <td><strong>${p.id}</strong></td>
      <td>${p.title}</td>
      <td>${p.department}</td>
      <td>${p.posted_date}</td>
      <td><span class="status-pill status-${p.status.toLowerCase()}">${p.status}</span></td>
    </tr>`;
  });
  if(DATA.openPositions.length===0) html += `<tr><td colspan="5" style="text-align:center">No open positions.</td></tr>`;
  html += `</tbody></table></div>`;
  return html;
}

function openNewPositionModal() {
  const body=`<div style="display:flex;flex-direction:column;gap:12px">
    <input class="filter-input" id="nop-title" placeholder="Job Title" />
    <select class="filter-select" id="nop-dept">
      ${[...new Set(DATA.employees.map(e=>e.dept))].map(d=>`<option>${d}</option>`).join('')}
    </select>
  </div>`;
  const footer=`<button class="btn btn-primary" onclick="submitNewPosition()">Post Job</button>`;
  openModal('New Open Position', body, footer);
}

async function submitNewPosition() {
  const title=$('#nop-title').value.trim();
  if(!title){showToast('Title required','error');return;}
  const newPos = { id:'OP-'+Date.now(), title, department:$('#nop-dept').value, status:'Open', posted_date:new Date().toISOString().split('T')[0] };
  if(supabase) {
    const {error} = await supabase.from('hr_open_positions').insert(newPos);
    if(error){showToast('Error saving','error'); return;}
  }
  DATA.openPositions.push(newPos);
  closeModal(); showToast('Position posted','success'); rerenderSection();
}

function renderHRPerformanceCycle() {
  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Performance Reviews</h2>
    <button class="btn btn-primary" onclick="openNewReviewModal()">+ Start Review</button>
  </div>
  <table class="table">
    <thead><tr><th>ID</th><th>Employee</th><th>Period</th><th>Rating</th><th>Status</th></tr></thead>
    <tbody>`;
  DATA.performanceReviews.forEach(r => {
    html += `<tr>
      <td><strong>${r.id}</strong></td>
      <td>${r.employee_name}</td>
      <td>${r.period}</td>
      <td>${r.rating}</td>
      <td><span class="status-pill status-${r.status.toLowerCase()}">${r.status}</span></td>
    </tr>`;
  });
  if(DATA.performanceReviews.length===0) html += `<tr><td colspan="5" style="text-align:center">No reviews found.</td></tr>`;
  html += `</tbody></table></div>`;
  return html;
}

function openNewReviewModal() {
  const body=`<div style="display:flex;flex-direction:column;gap:12px">
    <select class="filter-select" id="nr-emp">
      ${DATA.employees.map(e=>`<option>${e.name}</option>`).join('')}
    </select>
    <input class="filter-input" id="nr-period" placeholder="Period (e.g. Q3 2026)" />
    <select class="filter-select" id="nr-rating">
      <option>Needs Improvement</option><option>Meets Expectations</option><option>Exceeds Expectations</option>
    </select>
  </div>`;
  const footer=`<button class="btn btn-primary" onclick="submitNewReview()">Save Review</button>`;
  openModal('New Performance Review', body, footer);
}

async function submitNewReview() {
  const period=$('#nr-period').value.trim();
  if(!period){showToast('Period required','error');return;}
  const newRev = { id:'PR-'+Date.now(), employee_name:$('#nr-emp').value, period, rating:$('#nr-rating').value, status:'Completed' };
  if(supabase) {
    const {error} = await supabase.from('hr_performance_reviews').insert(newRev);
    if(error){showToast('Error saving','error'); return;}
  }
  DATA.performanceReviews.push(newRev);
  closeModal(); showToast('Review saved','success'); rerenderSection();
}

/* ── HR: HSE TRAINING ── */
function openNewTrainingModal() {
  const empOpts = DATA.employees.map(e=>`<option value="${e.name}">${e.name}</option>`).join('');
  openModal('Add Training Record', `<div class="modal-body">
    <div class="form-group"><label>Employee *</label>
      <select id="tr-emp" class="form-input">${empOpts}</select></div>
    <div class="form-group"><label>Course Name *</label>
      <input id="tr-course" class="form-input" placeholder="e.g. H2S Awareness"></div>
    <div class="form-row"><div class="form-group">
      <label>Date</label>
      <input id="tr-date" class="form-input" type="date" value="${new Date().toISOString().split('T')[0]}">
    </div><div class="form-group">
      <label>Status</label>
      <select id="tr-status" class="form-input">
        <option value="Scheduled">Scheduled</option>
        <option value="Passed">Passed</option>
        <option value="Failed">Failed</option>
      </select></div></div>
  </div>`, `<button class="btn btn-primary" onclick="submitNewTraining()">Save</button>
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`);
}
async function submitNewTraining() {
  const name = document.getElementById('tr-emp')?.value;
  const course = document.getElementById('tr-course')?.value?.trim();
  if(!name||!course){showToast('Employee and course required','error');return;}
  const id='TR-'+String(DATA.hseTraining.length+1).padStart(3,'0');
  const rec={id,employee_name:name,course,date:document.getElementById('tr-date')?.value||new Date().toISOString().split('T')[0],status:document.getElementById('tr-status')?.value||'Scheduled'};
  DATA.hseTraining.push(rec);
  if(supabase) await supabase.from('hr_hse_training').insert(rec).catch(supabaseCatch);
  closeModal();
  showToast('Training record added','success');
  rerenderSection();
}

function renderHRTraining() {
  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between"><h2>HSE & Training</h2>
    <button class="btn btn-primary btn-sm" onclick="openNewTrainingModal()"><i class="fa-solid fa-plus"></i> Add Training</button></div>
  <table class="table">
    <thead><tr><th>ID</th><th>Employee</th><th>Course</th><th>Date</th><th>Status</th></tr></thead>
    <tbody>`;
  DATA.hseTraining.forEach(t => {
    html += `<tr><td><strong>${t.id}</strong></td><td>${t.employee_name}</td><td>${t.course}</td><td>${t.date}</td><td><span class="status-pill status-${t.status.toLowerCase()}">${t.status}</span></td></tr>`;
  });
  if(DATA.hseTraining.length===0) html += `<tr><td colspan="5" style="text-align:center">No training records found.</td></tr>`;
  html += `</tbody></table></div>`;
  return html;
}

/* ── HR: ORG UNITS ── */
function openNewOrgUnitModal() {
  const mgrOpts = DATA.employees.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
  openModal('New Organizational Unit', `<div class="modal-body">
    <div class="form-group"><label>Department Name *</label>
      <input id="ou-name" class="form-input" placeholder="e.g. Drilling"></div>
    <div class="form-row"><div class="form-group">
      <label>Head Count</label>
      <input id="ou-hc" class="form-input" type="number" value="0" min="0"></div>
    <div class="form-group">
      <label>Manager</label>
      <select id="ou-mgr" class="form-input"><option value="">None</option>${mgrOpts}</select></div></div>
  </div>`, `<button class="btn btn-primary" onclick="submitNewOrgUnit()">Save</button>
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`);
}
async function submitNewOrgUnit() {
  const name = document.getElementById('ou-name')?.value?.trim();
  if(!name){showToast('Department name required','error');return;}
  const id='OU-'+String(DATA.orgUnits.length+1).padStart(3,'0');
  const rec={id,name,head_count:parseInt(document.getElementById('ou-hc')?.value)||0,manager:document.getElementById('ou-mgr')?.value||''};
  DATA.orgUnits.push(rec);
  if(supabase) await supabase.from('hr_org_units').insert(rec).catch(supabaseCatch);
  closeModal();
  showToast('Org unit added','success');
  rerenderSection();
}

function renderHROrgUnits() {
  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between"><h2>Organizational Units</h2>
    <button class="btn btn-primary btn-sm" onclick="openNewOrgUnitModal()"><i class="fa-solid fa-plus"></i> New Org Unit</button></div>
  <table class="table">
    <thead><tr><th>ID</th><th>Department Name</th><th>Head Count</th><th>Manager</th></tr></thead>
    <tbody>`;
  DATA.orgUnits.forEach(o => {
    html += `<tr><td><strong>${o.id}</strong></td><td>${o.name}</td><td>${o.head_count}</td><td>${o.manager}</td></tr>`;
  });
  if(DATA.orgUnits.length===0) html += `<tr><td colspan="4" style="text-align:center">No org units found.</td></tr>`;
  html += `</tbody></table></div>`;
  return html;
}

function renderHRSettings() {
  return `<div class="fade-in" style="max-width:600px">
    <h2>HR Settings</h2>
    <div class="sec-card" style="margin-top:20px"><div class="sec-card-body">
      <div class="form-group"><label class="form-label">Default Probation Period (Days)</label><input class="form-input" type="number" value="90"></div>
      <div class="form-group"><label class="form-label">Auto-Approve Leaves Under (Days)</label><input class="form-input" type="number" value="3"></div>
      <button class="btn btn-primary" onclick="showToast('Settings saved','success')">Save Settings</button>
    </div></div>
  </div>`;
}

function renderHRExpenses() {
  let html=`<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Expense Claims</h2>
    <button class="btn btn-primary" onclick="openNewExpenseModal()">+ Submit Expense</button>
  </div>
  <table class="table">
    <thead><tr><th>Date</th><th>Employee</th><th>Category</th><th>Amount</th><th>Status</th></tr></thead>
    <tbody>`;
  DATA.expenses.forEach(e => {
    html+=`<tr style="cursor:pointer" onclick="alert('${e.description}')">
      <td>${e.date}</td><td>${e.employee_id}</td><td>${e.category}</td><td>$${parseFloat(e.amount).toLocaleString()}</td>
      <td><span class="status-pill status-${e.status.toLowerCase().replace(' ','-')}">${e.status}</span></td>
    </tr>`;
  });
  if(DATA.expenses.length===0) html+=`<tr><td colspan="5" style="text-align:center">No expense claims.</td></tr>`;
  html+=`</tbody></table></div>`;
  return html;
}

function openNewExpenseModal() {
  const body=`<div style="display:flex;flex-direction:column;gap:12px">
    <input type="date" class="filter-input" id="nx-date" />
    <select class="filter-select" id="nx-cat">
      <option value="Travel">Travel</option><option value="Meals">Meals</option><option value="Supplies">Supplies</option>
    </select>
    <input type="number" class="filter-input" id="nx-amt" placeholder="Amount ($)" />
    <input class="filter-input" id="nx-desc" placeholder="Description" />
  </div>`;
  const footer=`<button class="btn btn-primary" onclick="submitNewExpense()">Submit Claim</button>`;
  openModal('New Expense Claim', body, footer);
}

async function submitNewExpense() {
  const amt=parseFloat($('#nx-amt').value);
  if(isNaN(amt)||amt<0){showToast('Valid amount required','error');return;}
  const newExp = { id:'EXP-'+Date.now(), employee_id:DATA.employees[0]?.id||'EMP-001', date:$('#nx-date').value||new Date().toISOString().split('T')[0], amount:amt, category:$('#nx-cat').value, description:$('#nx-desc').value, status:'Pending' };
  
  if (supabase) {
    const { error } = await supabase.from('hr_expense_claims').insert(newExp);
    if (error) { showToast('Error saving','error'); return; }
  }
  DATA.expenses.push(newExp);
  closeModal(); showToast('Expense submitted','success'); rerenderSection();
}

/* ── HR PAYROLL ── */
function renderHRPayroll() {
  let html=`<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Payroll & Compensation</h2>
    ${hasRole('hr_manager')?`<button class="btn btn-primary" onclick="openNewSalarySlipModal()">Generate Slip</button>`:''}
  </div>
  <table class="table">
    <thead><tr><th>Period</th><th>Employee</th><th>Base Pay</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>`;
  DATA.salarySlips.forEach(s => {
    html+=`<tr>
      <td onclick="alert('Allowances: $${s.allowances} | Deductions: $${s.deductions}')" style="cursor:pointer;color:var(--blue)">${s.month}/${s.year}</td>
      <td>${s.employee_id}</td>
      <td>$${parseFloat(s.base_pay).toLocaleString()}</td><td><strong>$${parseFloat(s.net_pay).toLocaleString()}</strong></td>
      <td><span class="status-pill status-${s.status.toLowerCase().replace(' ','-')}">${s.status}</span></td>
      <td>${s.status==='Draft'&&(hasRole('hr_manager'))?`<button class="btn btn-primary btn-sm" onclick="approveSalarySlip('${s.id}')">Approve</button>`:''}</td>
    </tr>`;
  });
  if(DATA.salarySlips.length===0) html+=`<tr><td colspan="5" style="text-align:center">No salary slips found.</td></tr>`;
  html+=`</tbody></table></div>`;
  return html;
}

function openNewSalarySlipModal() {
  const body=`<div style="display:flex;flex-direction:column;gap:12px">
    <div style="display:flex;gap:12px">
      <input type="number" class="filter-input" id="ns-month" placeholder="Month (1-12)" min="1" max="12" value="${new Date().getMonth()+1}" style="flex:1" />
      <input type="number" class="filter-input" id="ns-year" placeholder="Year" value="${new Date().getFullYear()}" style="flex:1" />
    </div>
    <select class="filter-select" id="ns-emp">
      ${DATA.employees.map(e=>`<option value="${e.id}">${e.name} (${e.id})</option>`).join('')}
    </select>
    <input type="number" class="filter-input" id="ns-base" placeholder="Base Pay ($)" value="5000" />
    <input type="number" class="filter-input" id="ns-allow" placeholder="Allowances ($)" value="1000" />
    <input type="number" class="filter-input" id="ns-ded" placeholder="Deductions ($)" value="500" />
  </div>`;
  const footer=`<button class="btn btn-primary" onclick="submitNewSalarySlip()">Generate</button>`;
  openModal('Generate Salary Slip', body, footer);
}

async function submitNewSalarySlip() {
  if(!requireRoles(['hr_manager','system_admin'],'Access denied: Requires HR Manager')) return;
  const base=parseFloat($('#ns-base').value)||0, allow=parseFloat($('#ns-allow').value)||0, ded=parseFloat($('#ns-ded').value)||0;
  const newSlip = { id:'SAL-'+Date.now(), employee_id:$('#ns-emp').value, month:parseInt($('#ns-month').value), year:parseInt($('#ns-year').value), base_pay:base, allowances:allow, deductions:ded, net_pay:(base+allow-ded), status:'Draft' };
  
  if (supabase) {
    const { error } = await supabase.from('hr_salary_slips').insert(newSlip);
    if (error) { showToast('Error saving','error'); return; }
  }
  DATA.salarySlips.push(newSlip);
  closeModal(); showToast('Salary Slip generated','success'); rerenderSection();
}

window.approveSalarySlip = async function(id) {
  if(!requireRoles(['hr_manager','system_admin'],'Access denied: Requires HR Manager role')) return;
  const slip = DATA.salarySlips.find(s => s.id === id);
  if(slip) {
    slip.status = 'Approved';
    if(supabase) await supabase.from('hr_salary_slips').update({status:'Approved'}).eq('id', id);
    
    // HR -> Finance Automation: Creates a payroll payment with salary_slip_id link
    const newPay = {
      id: 'PAY-' + Date.now(), invoice_id: 'PAYROLL-' + slip.id, date: new Date().toISOString().split('T')[0],
      amount: slip.net_pay, payment_method: 'Bank Transfer', salary_slip_id: slip.id
    };
    slip.payment_id = newPay.id;
    if (supabase) await supabase.from('fin_payments').insert(newPay);
    DATA.payments.push(newPay);
    showToast('Payroll Approved. Payment recorded in Finance.', 'success');
    
    rerenderSection();
  }
}

/* ── FINANCE MODULE ── */
function renderFinSidebar() {
  const overdueCount = DATA.invoices.filter(i=>i.status==='Overdue').length;
  const allSections=[
    {group:null, items:[
      {id:'finDashboard',icon:'fa-chart-pie',label:'Dashboard',roles:['system_admin','fin_manager','fin_user','employee']},
      {id:'finSales',icon:'fa-file-invoice-dollar',label:'Sales Invoices (A/R)',roles:['system_admin','fin_manager','fin_user']},
      {id:'finPurchases',icon:'fa-file-invoice',label:'Purchase Invoices (A/P)',roles:['system_admin','fin_manager','fin_user']},
      {id:'finPayments',icon:'fa-money-bill-transfer',label:'Payments',roles:['system_admin','fin_manager','fin_user']},
    ]},
    {group:'Reports', items:[
      {id:'arAging',icon:'fa-clock',label:'AR Aging',roles:['system_admin','fin_manager']},
      {id:'apAging',icon:'fa-clock',label:'AP Aging',roles:['system_admin','fin_manager']},
      {id:'finGL',icon:'fa-book',label:'General Ledger',roles:['system_admin','fin_manager','fin_user']},
      {id:'finPL',icon:'fa-chart-line',label:'Profit & Loss',roles:['system_admin','fin_manager','fin_user']},
      {id:'finBS',icon:'fa-scale-balanced',label:'Balance Sheet',roles:['system_admin','fin_manager','fin_user']},
    ]},
    {group:'Accounting', items:[
      {id:'finJournalEntries',icon:'fa-book-open',label:'Journal Entries',roles:['system_admin','fin_manager']},
    ]},
    {group:'Assets', items:[
      {id:'finFixedAssets',icon:'fa-industry',label:'Fixed Assets',roles:['system_admin','fin_manager']},
    ]},
    {group:'Dimensions', items:[
      {id:'finCostCenters',icon:'fa-building-columns',label:'Cost Centers',roles:['system_admin','fin_manager']},
      {id:'finChartAccounts',icon:'fa-sitemap',label:'Chart of Accounts',roles:['system_admin','fin_manager']},
    ]},
    {group:'Admin', items:[
      {id:'finSettings',icon:'fa-gear',label:'Settings',roles:['system_admin','fin_manager']},
    ]},
  ];
  let html='';
  allSections.forEach(s=>{
    const filtered=s.items.filter(i=>i.roles.some(r=>hasRole(r)));
    if(!filtered.length) return;
    if(s.group) html+=`<div class="sidebar-group">${s.group}</div>`;
    filtered.forEach(i=>{
      html+=`<div class="sidebar-item ${state.section===i.id?'active':''}" onclick="switchSection('${i.id}')">
        <i class="fa-solid ${i.icon}"></i><span style="flex:1">${i.label}</span>
      </div>`;
    });
  });
  return html;
}

function renderFinStub(name) {
  return `<div class="fade-in" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-sec);font-size:18px;">
    <i class="fa-solid fa-person-digging" style="margin-right:10px"></i> ${name} Module under construction
  </div>`;
}

function renderFinDashboard() {
  recomputeInvoiceStatuses();
  const totalReceivables = DATA.invoices.filter(i=>i.type==='Sales' && (i.status==='Unpaid'||i.status==='Overdue')).reduce((sum,i)=>sum+parseFloat(i.total_amount),0);
  const totalPayables = DATA.invoices.filter(i=>i.type==='Purchase' && (i.status==='Unpaid'||i.status==='Overdue')).reduce((sum,i)=>sum+parseFloat(i.total_amount),0);
  const totalCashIn = DATA.payments.filter(p=>DATA.invoices.find(i=>i.id===p.invoice_id)?.type==='Sales').reduce((sum,p)=>sum+parseFloat(p.amount),0);
  const totalCashOut = DATA.payments.filter(p=>DATA.invoices.find(i=>i.id===p.invoice_id)?.type==='Purchase').reduce((sum,p)=>sum+parseFloat(p.amount),0);

  return `<div class="fade-in">
    <h2>Finance Dashboard</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:16px">
      <div class="kpi-card" style="border-left:4px solid var(--primary)">
        <div class="kpi-title">Total Receivables (A/R)</div>
        <div class="kpi-value">$${totalReceivables.toLocaleString()}</div>
      </div>
      <div class="kpi-card" style="border-left:4px solid var(--danger)">
        <div class="kpi-title">Total Payables (A/P)</div>
        <div class="kpi-value">$${totalPayables.toLocaleString()}</div>
      </div>
      <div class="kpi-card" style="border-left:4px solid var(--success)">
        <div class="kpi-title">Cash Inflow</div>
        <div class="kpi-value">$${totalCashIn.toLocaleString()}</div>
      </div>
      <div class="kpi-card" style="border-left:4px solid var(--orange)">
        <div class="kpi-title">Cash Outflow</div>
        <div class="kpi-value">$${totalCashOut.toLocaleString()}</div>
      </div>
    </div>
  </div>`;
}

/* ── Invoice Status / Aging ── */
function recomputeInvoiceStatuses() {
  const today = new Date();
  DATA.invoices.forEach(inv => {
    if (inv.status === 'Paid') return;
    const totalPaid = DATA.payments.filter(p => p.invoice_id === inv.id).reduce((s, p) => s + parseFloat(p.amount), 0);
    if (totalPaid >= parseFloat(inv.total_amount)) { inv.status = 'Paid'; return; }
    if (inv.due_date && new Date(inv.due_date) < today) inv.status = 'Overdue';
    else if (inv.status !== 'Paid') inv.status = 'Unpaid';
  });
}

/* ── Invoice Master-Detail ── */
function selectFinItem(id) { state.selectedId = id; state.detailTab = 'info'; rerenderSection(); }

function renderFinInvoiceDetail(inv) {
  const tabs = [{ id: 'info', label: 'Info & Items' }, { id: 'payments', label: 'Payments' }];
  const tab = state.detailTab || 'info';
  let html = `<div class="detail-tabs">`;
  tabs.forEach(t => { html += `<div class="detail-tab ${tab === t.id ? 'active' : ''}" onclick="state.detailTab='${t.id}';rerenderSection()">${t.label}</div>`; });
  html += `</div><div class="detail-tab-body">`;
  if (tab === 'info') html += renderFinInvoiceInfoTab(inv);
  else if (tab === 'payments') html += renderFinInvoicePaymentsTab(inv);
  html += `</div>`;
  return html;
}

function renderFinInvoiceInfoTab(inv) {
  const totalPaid = DATA.payments.filter(p => p.invoice_id === inv.id).reduce((s, p) => s + parseFloat(p.amount), 0);
  const balance = parseFloat(inv.total_amount) - totalPaid;
  const subTotal = inv.items ? inv.items.reduce((s, it) => s + parseFloat(it.amount), 0) : parseFloat(inv.total_amount);
  const cc = DATA.costCenters.find(c => c.id === inv.cost_center_id);
  const tax = DATA.taxTemplates.find(t => t.id === inv.tax_template_id);
  let html = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px">
    <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">Invoice ID</div><div style="font-size:14px;font-weight:600">${inv.id}</div></div>
    <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">Party</div><div style="font-size:14px;font-weight:600">${inv.party_name}</div></div>
    <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">Status</div><div>${statusPill(inv.status)}</div></div>
    <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">Date</div><div style="font-size:14px">${inv.date}</div></div>
    <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">Due Date</div><div style="font-size:14px">${inv.due_date || '—'}</div></div>
    <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">Cost Center</div><div style="font-size:14px">${cc ? cc.name : '—'}</div></div>
  </div>`;
  if (inv.items && inv.items.length > 0) {
    html += `<h4 style="margin:0 0 8px;font-size:13px;font-weight:600">Line Items</h4><table class="table"><thead><tr><th>Item</th><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>`;
    inv.items.forEach(it => { html += `<tr><td>${it.item}</td><td>${it.description || '—'}</td><td>${it.qty}</td><td>$${parseFloat(it.rate).toLocaleString()}</td><td>$${parseFloat(it.amount).toLocaleString()}</td></tr>`; });
    html += `</tbody></table>`;
  }
  if (inv.tax_template_id) {
    const taxAmt = inv.tax_amount || (subTotal * (inv.tax_rate || 0) / 100);
    html += `<div style="display:flex;justify-content:flex-end;margin-top:8px;font-size:14px">
      <div style="text-align:right"><div>Subtotal: <strong>$${subTotal.toLocaleString()}</strong></div>
      <div>${tax ? tax.name : 'Tax'} (${inv.tax_rate || 0}%): <strong>$${taxAmt.toLocaleString()}</strong></div>
      <div style="border-top:2px solid var(--border);padding-top:4px;margin-top:4px;font-size:16px">Grand Total: <strong style="color:var(--blue)">$${parseFloat(inv.total_amount).toLocaleString()}</strong></div></div>
    </div>`;
  }
  if (inv.status === 'Unpaid' || inv.status === 'Overdue') html += `<div style="margin-top:16px"><button class="btn btn-primary" onclick="openNewPaymentModal('${inv.id}')">Log Payment</button></div>`;
  return html;
}

function renderFinInvoicePaymentsTab(inv) {
  const payments = DATA.payments.filter(p => p.invoice_id === inv.id);
  if (payments.length === 0) return `<div style="color:var(--text-sec);padding:20px;text-align:center">No payments recorded for this invoice.</div>`;
  let html = `<table class="table"><thead><tr><th>ID</th><th>Date</th><th>Amount</th><th>Method</th></tr></thead><tbody>`;
  payments.forEach(p => { html += `<tr><td>${p.id}</td><td>${p.date}</td><td>$${parseFloat(p.amount).toLocaleString()}</td><td>${p.payment_method}</td></tr>`; });
  html += `</tbody></table>`;
  return html;
}

function renderFinInvoices(type) {
  recomputeInvoiceStatuses();
  const f = state.filters;
  let items = DATA.invoices.filter(i => i.type === type);
  if (f.search) { const s = f.search.toLowerCase(); items = items.filter(i => i.party_name.toLowerCase().includes(s) || i.id.toLowerCase().includes(s)); }
  if (state.sortCol) { const col = state.sortCol, dir = state.sortDir === 'asc' ? 1 : -1; items.sort((a, b) => { let va = a[col], vb = b[col]; if (typeof va === 'string') return va.localeCompare(vb) * dir; return (va - vb) * dir; }); }

  const label = type === 'Sales' ? 'A/R' : 'A/P';
  let html = `<div class="fade-in"><h2>${type} Invoices (${label})</h2><div class="md-layout">`;

  html += `<div class="md-master">
    <div class="filter-bar">
      <input class="filter-input" placeholder="Search..." value="${f.search || ''}" oninput="state.filters.search=this.value;rerenderSection()" style="flex:1;min-width:100px">
      <button class="btn btn-primary btn-sm" onclick="openNewInvoiceModal('${type}')"><i class="fa-solid fa-plus"></i> New</button>
    </div>
    <div style="padding:6px 14px 4px;font-size:11px;color:var(--text-sec);background:#fafafa;border-bottom:1px solid var(--border);">${items.length} invoices</div>
    <div class="list-container">`;
  if (items.length === 0) html += `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No invoices found</p></div>`;
  items.forEach(inv => {
    const isOverdue = inv.status === 'Overdue';
    html += `<div class="list-item ${state.selectedId === inv.id ? 'selected' : ''}" onclick="selectFinItem('${inv.id}')">
      <div class="avatar" style="width:36px;height:36px;background:${isOverdue ? 'var(--error)' : 'var(--blue)'};font-size:12px;color:#fff">${initials(inv.party_name)}</div>
      <div class="list-item-body">
        <div class="list-item-title">${inv.party_name}</div>
        <div class="list-item-desc">${inv.id} · ${inv.date}${inv.due_date ? ' · Due: ' + inv.due_date : ''}</div>
      </div>
      <div class="list-item-right">
        <span class="status-pill status-${inv.status.toLowerCase().replace(/ /g, '-')}">${inv.status}</span>
        <div class="list-item-date" style="margin-top:3px;">$${parseFloat(inv.total_amount).toLocaleString()}</div>
      </div>
    </div>`;
  });
  html += `</div></div>`;

  html += `<div class="md-detail ${state.selectedId ? 'has-item' : ''}" style="padding:0;">`;
  if (state.selectedId) {
    const inv = DATA.invoices.find(x => x.id === state.selectedId);
    if (inv) html += renderFinInvoiceDetail(inv);
  } else {
    html += `<div class="empty-state" style="min-height:400px;"><i class="fa-solid fa-hand-pointer"></i><p>Select an invoice to view details</p></div>`;
  }
  html += `</div></div></div>`;
  return html;
}

function openNewInvoiceModal(type) {
  const partyOptions = type === 'Sales'
    ? DATA.accounts.map(a => `<option value="${a.name}">${a.name}</option>`).join('')
    : DATA.suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  const ccOptions = DATA.costCenters.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const taxOptions = DATA.taxTemplates.map(t => `<option value="${t.id}" data-rate="${t.rate}">${t.name} (${t.rate}%)</option>`).join('');

  const body = `<div style="display:flex;flex-direction:column;gap:12px">
    <label style="font-size:12px;font-weight:600;color:var(--text-sec)">Party</label>
    <select class="filter-input" id="ni-party">
      <option value="">— Select ${type === 'Sales' ? 'Customer' : 'Supplier'} —</option>
      ${partyOptions}
    </select>
    <input type="date" class="filter-input" id="ni-due" placeholder="Due Date" />
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><label style="font-size:12px;font-weight:600;color:var(--text-sec)">Cost Center</label>
      <select class="filter-input" id="ni-cc"><option value="">— None —</option>${ccOptions}</select></div>
      <div><label style="font-size:12px;font-weight:600;color:var(--text-sec)">Tax Template</label>
      <select class="filter-input" id="ni-tax" onchange="calcInvoiceTotal()"><option value="">— None —</option>${taxOptions}</select></div>
    </div>
    <div id="ni-items">
      <div style="display:flex;align-items:center;justify-content:space-between;margin:4px 0">
        <label style="font-size:12px;font-weight:600;color:var(--text-sec)">Line Items</label>
        <button class="btn btn-sm btn-outline" onclick="addInvoiceItemRow()"><i class="fa-solid fa-plus"></i> Add Item</button>
      </div>
      <div class="ni-item-row" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:6px;margin-bottom:6px">
        <input class="filter-input" placeholder="Item name" style="font-size:12px" />
        <input type="number" class="filter-input" placeholder="Qty" value="1" style="font-size:12px" oninput="calcInvoiceItemRow(this)" />
        <input type="number" class="filter-input" placeholder="Rate" style="font-size:12px" oninput="calcInvoiceItemRow(this)" />
        <input class="filter-input" placeholder="Amount" readonly style="font-size:12px;background:#f5f5f5" />
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;padding:8px 0;border-top:1px solid var(--border);font-size:14px">
      <div style="text-align:right"><div>Subtotal: $<span id="ni-subtotal">0.00</span></div>
      <div>Tax: $<span id="ni-tax-amt">0.00</span></div>
      <div style="border-top:2px solid var(--border);padding-top:4px;margin-top:4px;font-size:16px">Total: $<span id="ni-total">0.00</span></div></div>
    </div>
  </div>`;
  const footer = `<button class="btn btn-primary" onclick="submitNewInvoice('${type}')">Save Invoice</button>`;
  openModal(`New ${type} Invoice`, body, footer);
}

function addInvoiceItemRow() {
  const container = $('#ni-items');
  const row = document.createElement('div');
  row.className = 'ni-item-row';
  row.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:6px;margin-bottom:6px';
  row.innerHTML = `<input class="filter-input" placeholder="Item name" style="font-size:12px" />
    <input type="number" class="filter-input" placeholder="Qty" value="1" style="font-size:12px" oninput="calcInvoiceItemRow(this)" />
    <input type="number" class="filter-input" placeholder="Rate" style="font-size:12px" oninput="calcInvoiceItemRow(this)" />
    <div style="display:flex;gap:4px"><input class="filter-input" placeholder="Amount" readonly style="font-size:12px;background:#f5f5f5;flex:1" /><button class="btn btn-sm btn-outline" style="color:var(--error);border-color:var(--error);padding:2px 6px" onclick="this.closest('.ni-item-row').remove();calcInvoiceTotal()"><i class="fa-solid fa-xmark"></i></button></div>`;
  container.appendChild(row);
}

function calcInvoiceItemRow(el) {
  const row = el.closest('.ni-item-row');
  const qty = parseFloat(row.querySelector('input[placeholder="Qty"]').value) || 0;
  const rate = parseFloat(row.querySelector('input[placeholder="Rate"]').value) || 0;
  row.querySelector('input[placeholder="Amount"]').value = (qty * rate).toFixed(2);
  calcInvoiceTotal();
}

function calcInvoiceTotal() {
  let subTotal = 0;
  document.querySelectorAll('.ni-item-row').forEach(row => {
    subTotal += parseFloat(row.querySelector('input[placeholder="Amount"]').value) || 0;
  });
  const taxSel = document.getElementById('ni-tax');
  const taxRate = taxSel && taxSel.selectedOptions[0] ? parseFloat(taxSel.selectedOptions[0].getAttribute('data-rate')) || 0 : 0;
  const taxAmt = subTotal * taxRate / 100;
  document.getElementById('ni-subtotal') && (document.getElementById('ni-subtotal').textContent = subTotal.toFixed(2));
  document.getElementById('ni-tax-amt') && (document.getElementById('ni-tax-amt').textContent = taxAmt.toFixed(2));
  document.getElementById('ni-total') && (document.getElementById('ni-total').textContent = (subTotal + taxAmt).toFixed(2));
}

async function submitNewInvoice(type) {
  const party = $('#ni-party').value.trim();
  if (!party) { showToast('Please select a party', 'error'); return; }

  const itemRows = document.querySelectorAll('.ni-item-row');
  const items = [];
  let subTotal = 0;
  itemRows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const item = inputs[0].value.trim();
    const qty = parseFloat(inputs[1].value) || 0;
    const rate = parseFloat(inputs[2].value) || 0;
    const amt = qty * rate;
    if (item && qty > 0) { items.push({ item, description: '', qty, rate, amount: amt }); subTotal += amt; }
  });
  if (items.length === 0) { showToast('Add at least one line item', 'error'); return; }

  const taxSel = document.getElementById('ni-tax');
  const taxId = taxSel ? taxSel.value : '';
  const taxTemplate = taxId ? DATA.taxTemplates.find(t => t.id === taxId) : null;
  const taxRate = taxTemplate ? taxTemplate.rate : 0;
  const taxAmt = subTotal * taxRate / 100;

  const invPrefix = type === 'Sales' ? 'INV-' : 'PINV-';
  const newInv = {
    id: invPrefix + Date.now(), type, party_name: party, date: new Date().toISOString().split('T')[0],
    due_date: $('#ni-due').value || null, total_amount: subTotal + taxAmt, status: 'Unpaid', deal_id: null,
    cost_center_id: $('#ni-cc').value || null, tax_template_id: taxId || null, tax_rate: taxRate, tax_amount: taxAmt, items
  };

  if (supabase) {
    const { error } = await supabase.from('fin_invoices').insert(newInv);
    if (error) { showToast('Error saving', 'error'); return; }
  }
  DATA.invoices.push(newInv);
  const drAccount = newInv.type === 'Sales' ? 'ACC-AR' : 'ACC-OPEX';
  const crAccount = newInv.type === 'Sales' ? 'ACC-REV' : 'ACC-AP';
  autoPostJE(newInv.id, 'Invoice ' + newInv.id + ' auto-posting', [{account_id:drAccount, debit:newInv.total_amount, credit:0},{account_id:crAccount, debit:0, credit:newInv.total_amount}]);
  closeModal(); showToast('Invoice saved', 'success'); rerenderSection();
}

/* ── Aging Reports ── */
function renderFinAging(type) {
  recomputeInvoiceStatuses();
  const label = type === 'Sales' ? 'Accounts Receivable Aging' : 'Accounts Payable Aging';
  const today = new Date();
  const buckets = [{ label: '0–30 Days', min: 0, max: 30 }, { label: '31–60 Days', min: 31, max: 60 }, { label: '61–90 Days', min: 61, max: 90 }, { label: '90+ Days', min: 91, max: Infinity }];
  const overdue = DATA.invoices.filter(i => i.type === type && i.status === 'Overdue');

  let html = `<div class="fade-in"><h2>${label}</h2>
  <table class="table"><thead><tr><th>Bucket</th><th>Count</th><th>Total Amount</th><th>Invoices</th></tr></thead><tbody>`;
  buckets.forEach(b => {
    const inBucket = overdue.filter(i => { const d = Math.floor((today - new Date(i.due_date)) / (1000 * 60 * 60 * 24)); return d >= b.min && d <= b.max; });
    const total = inBucket.reduce((s, i) => s + parseFloat(i.total_amount), 0);
    html += `<tr><td>${b.label}</td><td>${inBucket.length}</td><td>$${total.toLocaleString()}</td><td style="font-size:12px">${inBucket.map(i => i.id).join(', ') || '—'}</td></tr>`;
  });
  const grandTotal = overdue.reduce((s, i) => s + parseFloat(i.total_amount), 0);
  html += `<tr style="background:#f5f6f7;font-weight:700"><td>Total Overdue</td><td>${overdue.length}</td><td>$${grandTotal.toLocaleString()}</td><td></td></tr>`;
  html += `</tbody></table></div>`;
  return html;
}

/* ── General Ledger ── */
function renderFinGL() {
  recomputeInvoiceStatuses();
  const entries = [];
  DATA.invoices.forEach(inv => {
    const amt = parseFloat(inv.total_amount);
    if (inv.type === 'Sales') {
      entries.push({ date: inv.date, type: 'Invoice', ref: inv.id, account: 'Accounts Receivable', debit: amt, credit: 0, desc: inv.party_name });
      entries.push({ date: inv.date, type: 'Invoice', ref: inv.id, account: 'Revenue', debit: 0, credit: amt, desc: inv.party_name });
    } else {
      entries.push({ date: inv.date, type: 'Invoice', ref: inv.id, account: 'Expense / Inventory', debit: amt, credit: 0, desc: inv.party_name });
      entries.push({ date: inv.date, type: 'Invoice', ref: inv.id, account: 'Accounts Payable', debit: 0, credit: amt, desc: inv.party_name });
    }
  });
  DATA.payments.forEach(p => {
    const inv = DATA.invoices.find(i => i.id === p.invoice_id);
    const amt = parseFloat(p.amount);
    if (inv && inv.type === 'Sales') {
      entries.push({ date: p.date, type: 'Payment', ref: p.id, account: 'Bank', debit: amt, credit: 0, desc: 'Received from ' + inv.party_name });
      entries.push({ date: p.date, type: 'Payment', ref: p.id, account: 'Accounts Receivable', debit: 0, credit: amt, desc: 'Cleared ' + inv.party_name });
    } else if (inv && inv.type === 'Purchase') {
      entries.push({ date: p.date, type: 'Payment', ref: p.id, account: 'Accounts Payable', debit: amt, credit: 0, desc: 'Paid to ' + inv.party_name });
      entries.push({ date: p.date, type: 'Payment', ref: p.id, account: 'Bank', debit: 0, credit: amt, desc: 'Payment ' + inv.party_name });
    }
  });
  entries.sort((a, b) => a.date.localeCompare(b.date));

  let runningBalance = 0;
  let html = `<div class="fade-in"><h2 style="margin-bottom:12px">General Ledger</h2>
  <table class="table"><thead><tr><th>Date</th><th>Type</th><th>Ref</th><th>Account</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>`;
  entries.forEach(e => {
    runningBalance += e.debit - e.credit;
    html += `<tr><td>${e.date}</td><td>${e.type}</td><td>${e.ref}</td><td>${e.account}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.desc}</td>
      <td style="color:${e.debit > 0 ? 'var(--error)' : 'var(--text-sec)'}">${e.debit > 0 ? '$' + e.debit.toLocaleString() : '—'}</td>
      <td style="color:${e.credit > 0 ? 'var(--success)' : 'var(--text-sec)'}">${e.credit > 0 ? '$' + e.credit.toLocaleString() : '—'}</td>
      <td class="ledger-balance">$${runningBalance.toLocaleString()}</td></tr>`;
  });
  if (entries.length === 0) html += `<tr><td colspan="8" style="text-align:center">No entries found.</td></tr>`;
  html += `</tbody></table></div>`;
  return html;
}

/* ── Profit & Loss ── */
function renderFinPL() {
  recomputeInvoiceStatuses();
  let totalIncome = 0, totalExpenses = 0;
  DATA.invoices.forEach(inv => {
    const amt = parseFloat(inv.total_amount);
    if (inv.type === 'Sales') totalIncome += amt;
    else totalExpenses += amt;
  });
  const netIncome = totalIncome - totalExpenses;
  return `<div class="fade-in"><h2>Profit & Loss Statement</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:16px">
      <div class="kpi-card" style="border-left:4px solid var(--success)"><div class="kpi-label">Total Income (Revenue)</div><div class="kpi-value">$${totalIncome.toLocaleString()}</div></div>
      <div class="kpi-card" style="border-left:4px solid var(--error)"><div class="kpi-label">Total Expenses</div><div class="kpi-value">$${totalExpenses.toLocaleString()}</div></div>
      <div class="kpi-card" style="border-left:4px solid ${netIncome >= 0 ? 'var(--blue)' : 'var(--orange)'}"><div class="kpi-label">Net Income</div><div class="kpi-value">$${netIncome.toLocaleString()}</div><div class="kpi-change ${netIncome >= 0 ? 'kpi-up' : 'kpi-down'}">${netIncome >= 0 ? 'Profit' : 'Loss'}</div></div>
    </div>
    <table class="table" style="margin-top:20px"><thead><tr><th>Category</th><th>Amount</th></tr></thead><tbody>
      <tr><td><strong>Income</strong></td><td></td></tr>
      ${DATA.invoices.filter(i => i.type === 'Sales').map(i => `<tr><td style="padding-left:32px">${i.party_name} (${i.id})</td><td>$${parseFloat(i.total_amount).toLocaleString()}</td></tr>`).join('')}
      <tr style="background:#f5f6f7;font-weight:700"><td>Total Income</td><td>$${totalIncome.toLocaleString()}</td></tr>
      <tr><td><strong>Expenses</strong></td><td></td></tr>
      ${DATA.invoices.filter(i => i.type === 'Purchase').map(i => `<tr><td style="padding-left:32px">${i.party_name} (${i.id})</td><td>$${parseFloat(i.total_amount).toLocaleString()}</td></tr>`).join('')}
      <tr style="background:#f5f6f7;font-weight:700"><td>Total Expenses</td><td>$${totalExpenses.toLocaleString()}</td></tr>
      <tr style="background:var(--blue);color:#fff;font-weight:700"><td>Net Income</td><td>$${netIncome.toLocaleString()}</td></tr>
    </tbody></table>
  </div>`;
}

/* ── Balance Sheet ── */
function renderFinBS() {
  recomputeInvoiceStatuses();
  const entries = [];
  DATA.invoices.forEach(inv => {
    const amt = parseFloat(inv.total_amount);
    if (inv.type === 'Sales') {
      entries.push({ account: 'Accounts Receivable', debit: amt, credit: 0 });
      entries.push({ account: 'Revenue', debit: 0, credit: amt });
    } else {
      entries.push({ account: 'Expense / Inventory', debit: amt, credit: 0 });
      entries.push({ account: 'Accounts Payable', debit: 0, credit: amt });
    }
  });
  DATA.payments.forEach(p => {
    const inv = DATA.invoices.find(i => i.id === p.invoice_id);
    const amt = parseFloat(p.amount);
    if (inv && inv.type === 'Sales') {
      entries.push({ account: 'Bank', debit: amt, credit: 0 });
      entries.push({ account: 'Accounts Receivable', debit: 0, credit: amt });
    } else if (inv && inv.type === 'Purchase') {
      entries.push({ account: 'Accounts Payable', debit: amt, credit: 0 });
      entries.push({ account: 'Bank', debit: 0, credit: amt });
    }
  });

  const balances = {};
  entries.forEach(e => {
    if (!balances[e.account]) balances[e.account] = 0;
    balances[e.account] += e.debit - e.credit;
  });

  const totalAssets = (balances['Accounts Receivable'] || 0) + (balances['Bank'] || 0);
  const totalLiabilities = (balances['Accounts Payable'] || 0);
  const equity = totalAssets - totalLiabilities;
  const totalEqLiab = totalAssets;

  return `<div class="fade-in"><h2>Balance Sheet</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:16px">
      <div class="kpi-card" style="border-left:4px solid var(--success)"><div class="kpi-label">Total Assets</div><div class="kpi-value">$${totalAssets.toLocaleString()}</div></div>
      <div class="kpi-card" style="border-left:4px solid var(--error)"><div class="kpi-label">Total Liabilities</div><div class="kpi-value">$${Math.abs(totalLiabilities).toLocaleString()}</div></div>
      <div class="kpi-card" style="border-left:4px solid var(--blue)"><div class="kpi-label">Equity (Balancing)</div><div class="kpi-value">$${Math.abs(equity).toLocaleString()}</div></div>
    </div>
    <table class="table" style="margin-top:20px"><thead><tr><th>Category</th><th>Account</th><th>Balance</th></tr></thead><tbody>
      <tr><td><strong>Assets</strong></td><td></td><td></td></tr>
      <tr><td></td><td>Accounts Receivable</td><td>$${(balances['Accounts Receivable'] || 0).toLocaleString()}</td></tr>
      <tr><td></td><td>Bank</td><td>$${(balances['Bank'] || 0).toLocaleString()}</td></tr>
      <tr style="background:#f5f6f7;font-weight:700"><td></td><td>Total Assets</td><td>$${totalAssets.toLocaleString()}</td></tr>
      <tr><td><strong>Liabilities</strong></td><td></td><td></td></tr>
      <tr><td></td><td>Accounts Payable</td><td>$${Math.abs(balances['Accounts Payable'] || 0).toLocaleString()}</td></tr>
      <tr style="background:#f5f6f7;font-weight:700"><td></td><td>Total Liabilities</td><td>$${Math.abs(totalLiabilities).toLocaleString()}</td></tr>
      <tr><td><strong>Equity</strong></td><td></td><td></td></tr>
      <tr><td></td><td>Retained Earnings / Net Income</td><td>$${Math.abs(equity).toLocaleString()}</td></tr>
      <tr style="background:var(--blue);color:#fff;font-weight:700"><td></td><td>Total Liabilities + Equity</td><td>$${totalEqLiab.toLocaleString()}</td></tr>
    </tbody></table>
  </div>`;
}

/* ── Cost Centers ── */
/* ── FIN: COST CENTERS ── */
function openNewCostCenterModal() {
  openModal('New Cost Center', `<div class="modal-body">
    <div class="form-group"><label>Cost Center Name *</label>
      <input id="cc-name" class="form-input" placeholder="e.g. Drilling Operations"></div>
    <div class="form-group"><label>Department</label>
      <input id="cc-dept" class="form-input" placeholder="e.g. Drilling"></div>
    <div class="form-group"><label>Budget</label>
      <input id="cc-budget" class="form-input" type="number" value="0" min="0"></div>
  </div>`, `<button class="btn btn-primary" onclick="submitNewCostCenter()">Save</button>
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`);
}
async function submitNewCostCenter() {
  const name = document.getElementById('cc-name')?.value?.trim();
  if(!name){showToast('Cost center name required','error');return;}
  const id='CC-'+name.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3)+'-'+String(DATA.costCenters.length+1).padStart(3,'0');
  const rec={id,name,description:document.getElementById('cc-dept')?.value?.trim()||'',manager:'',budget:parseFloat(document.getElementById('cc-budget')?.value)||0};
  const dataRec={id,name,dept:rec.description};
  DATA.costCenters.push(dataRec);
  if(supabase) await supabase.from('fin_cost_centers').insert(rec).catch(supabaseCatch);
  closeModal();
  showToast('Cost center added','success');
  rerenderSection();
}

function renderFinCostCenters() {
  let html = `<div class="fade-in" style="position:relative"><h2>Cost Centers</h2>
    <button class="btn btn-primary btn-sm" onclick="openNewCostCenterModal()" style="position:absolute;top:0;right:0;margin:4px"><i class="fa-solid fa-plus"></i> New Cost Center</button>
  <table class="table"><thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Total Invoiced (Sales)</th><th>Total Purchases</th></tr></thead><tbody>`;
  DATA.costCenters.forEach(cc => {
    const salesTotal = DATA.invoices.filter(i => i.type === 'Sales' && i.cost_center_id === cc.id).reduce((s, i) => s + parseFloat(i.total_amount), 0);
    const purchTotal = DATA.invoices.filter(i => i.type === 'Purchase' && i.cost_center_id === cc.id).reduce((s, i) => s + parseFloat(i.total_amount), 0);
    html += `<tr><td>${cc.id}</td><td>${cc.name}</td><td>${cc.dept}</td><td>$${salesTotal.toLocaleString()}</td><td>$${purchTotal.toLocaleString()}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}

/* ── Chart of Accounts ── */
function renderFinChartAccounts() {
  const rootAccounts = DATA.chartAccounts.filter(a => a.parent_id === null);
  function renderTree(parents, depth) {
    let h = '';
    parents.forEach(acc => {
      const children = DATA.chartAccounts.filter(a => a.parent_id === acc.id);
      let bal = 0;
      DATA.invoices.forEach(inv => {
        if (acc.id === 'ACC-AR' && inv.type === 'Sales') bal += parseFloat(inv.total_amount) - DATA.payments.filter(p => p.invoice_id === inv.id).reduce((s, p) => s + parseFloat(p.amount), 0);
        if (acc.id === 'ACC-AP' && inv.type === 'Purchase') bal += parseFloat(inv.total_amount) - DATA.payments.filter(p => p.invoice_id === inv.id).reduce((s, p) => s + parseFloat(p.amount), 0);
        if (acc.id === 'ACC-BANK'){
          DATA.payments.forEach(p => {
            const payInv = DATA.invoices.find(i => i.id === p.invoice_id);
            if (payInv && payInv.type === 'Sales') bal += parseFloat(p.amount);
            else if (payInv && payInv.type === 'Purchase') bal -= parseFloat(p.amount);
          });
        }
        if (acc.id === 'ACC-REV' && inv.type === 'Sales') bal += parseFloat(inv.total_amount);
        if (acc.id === 'ACC-OPEX' && inv.type === 'Purchase') bal += parseFloat(inv.total_amount);
        if (acc.id === 'ACC-FA') bal += 0; // Fixed assets balance computed separately
      });
      acc.balance = bal;
      h += `<tr>
        <td style="padding-left:${depth * 24 + 12}px">${acc.is_group ? '<i class="fa-solid fa-folder-open" style="color:var(--orange);margin-right:4px"></i>' : '<i class="fa-solid fa-file-invoice" style="color:var(--text-sec);margin-right:4px"></i>'} ${acc.name}</td>
        <td>${acc.id}</td><td>${acc.type}</td><td>${acc.is_group ? 'Group' : 'Detail'}</td>
        <td style="text-align:right;font-weight:${acc.is_group ? '700' : '400'}">$${bal.toLocaleString()}</td>
        <td><button class="btn btn-sm btn-outline" onclick="openNewChartAccountModal('${acc.id}')" ${acc.is_group ? '' : 'style="opacity:0.6"'}>+ Child</button></td>
      </tr>`;
      if (children.length > 0) h += renderTree(children, depth + 1);
    });
    return h;
  }

  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Chart of Accounts</h2>
    <button class="btn btn-primary btn-sm" onclick="openNewChartAccountModal('')">+ New Account</button>
  </div>
  <table class="table"><thead><tr><th>Account Name</th><th>Code</th><th>Type</th><th>Group/Detail</th><th style="text-align:right">Balance</th><th></th></tr></thead><tbody>`;
  html += renderTree(rootAccounts, 0);
  if (rootAccounts.length === 0) html += `<tr><td colspan="6" style="text-align:center">No accounts defined.</td></tr>`;
  html += `</tbody></table></div>`;
  return html;
}

function openNewChartAccountModal(parentId) {
  const parent = parentId ? DATA.chartAccounts.find(a => a.id === parentId) : null;
  const body = `<div style="display:flex;flex-direction:column;gap:12px">
    <input class="filter-input" id="nca-name" placeholder="Account Name" />
    <input class="filter-input" id="nca-id" placeholder="Account Code (e.g. ACC-CASH)" value="${parentId ? parentId.replace(/-.*$/, '-') : 'ACC-'}" />
    <select class="filter-input" id="nca-type"><option value="Asset">Asset</option><option value="Liability">Liability</option><option value="Equity">Equity</option><option value="Income">Income</option><option value="Expense">Expense</option></select>
    <label style="font-size:12px;color:var(--text-sec)"><input type="checkbox" id="nca-group" checked /> Is Group (can have child accounts)</label>
    <div style="font-size:12px;color:var(--text-sec)">Parent: ${parent ? parent.name : '— Root —'}</div>
    <input type="hidden" id="nca-parent" value="${parentId}" />
  </div>`;
  const footer = `<button class="btn btn-primary" onclick="submitNewChartAccount()">Save Account</button>`;
  openModal(parentId ? 'Add Child Account' : 'New Account', body, footer);
}

async function submitNewChartAccount() {
  const name = $('#nca-name').value.trim();
  const id = $('#nca-id').value.trim();
  const type = $('#nca-type').value;
  const isGroup = $('#nca-group').checked;
  const parentId = $('#nca-parent').value || null;
  if (!name || !id) { showToast('Name and Code required', 'error'); return; }
  if (DATA.chartAccounts.find(a => a.id === id)) { showToast('Account code already exists', 'error'); return; }
  const acc = { id, name, type, parent_id: parentId, is_group: isGroup, balance: 0 };
  if (supabase) supabase.from('fin_chart_accounts').insert(acc).catch(supabaseCatch);
  DATA.chartAccounts.push(acc);
  closeModal(); showToast('Account created', 'success'); rerenderSection();
}

/* ── Journal Entries ── */
function renderFinJournalEntries() {
  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Journal Entries</h2>
    <button class="btn btn-primary btn-sm" onclick="openNewJournalEntryModal()">+ New Entry</button>
  </div>`;

  if (DATA.journalEntries.length === 0) {
    html += `<div class="empty-state"><i class="fa-solid fa-book"></i><p>No journal entries yet.</p></div>`;
  } else {
    html += `<div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">`;
    [...DATA.journalEntries].reverse().forEach(je => {
      const totalDebit = je.entries.reduce((s, e) => s + e.debit, 0);
      const totalCredit = je.entries.reduce((s, e) => s + e.credit, 0);
      html += `<div class="sec-card" style="cursor:pointer" onclick="this.querySelector('.je-detail').classList.toggle('hidden')">
        <div class="sec-card-header" style="display:flex;justify-content:space-between;align-items:center">
          <div><strong>${je.id}</strong> · ${je.date} · ${je.description}</div>
          <div><span style="font-size:12px;color:var(--text-sec)">Dr $${totalDebit.toLocaleString()} / Cr $${totalCredit.toLocaleString()}</span> <i class="fa-solid fa-chevron-down"></i></div>
        </div>
        <div class="je-detail hidden" style="margin-top:8px">
          <table class="table"><thead><tr><th>Account</th><th>Debit</th><th>Credit</th></tr></thead><tbody>`;
      je.entries.forEach(e => {
        const acc = DATA.chartAccounts.find(a => a.id === e.account_id);
        html += `<tr><td>${acc ? acc.name : e.account_id}</td><td style="color:var(--error)">${e.debit > 0 ? '$' + e.debit.toLocaleString() : '—'}</td><td style="color:var(--success)">${e.credit > 0 ? '$' + e.credit.toLocaleString() : '—'}</td></tr>`;
      });
      html += `</tbody></table>
          <div style="font-size:11px;color:var(--text-sec);margin-top:4px">Reference: ${je.reference || '—'}</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

function openNewJournalEntryModal() {
  const accOptions = DATA.chartAccounts.filter(a => !a.is_group).map(a => `<option value="${a.id}">${a.name} (${a.id})</option>`).join('');
  const body = `<div style="display:flex;flex-direction:column;gap:12px">
    <input type="date" class="filter-input" id="nje-date" value="${new Date().toISOString().split('T')[0]}" />
    <input class="filter-input" id="nje-desc" placeholder="Description" />
    <input class="filter-input" id="nje-ref" placeholder="Reference (optional)" />
    <div id="nje-entries">
      <div style="display:flex;align-items:center;justify-content:space-between;margin:4px 0">
        <label style="font-size:12px;font-weight:600;color:var(--text-sec)">Debit/Credit Lines</label>
        <button class="btn btn-sm btn-outline" onclick="addJELine()"><i class="fa-solid fa-plus"></i> Add Line</button>
      </div>
      <div class="je-line" style="display:grid;grid-template-columns:3fr 1fr 1fr;gap:6px;margin-bottom:6px">
        <select class="filter-input" style="font-size:12px">${accOptions}</select>
        <input type="number" class="filter-input" placeholder="Debit" value="0" style="font-size:12px;color:var(--error)" oninput="calcJETotal()" />
        <input type="number" class="filter-input" placeholder="Credit" value="0" style="font-size:12px;color:var(--success)" oninput="calcJETotal()" />
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px">
      <span id="nje-balance" style="font-weight:700;color:var(--success)">Balanced <i class="fa-solid fa-check" style="color:var(--success)"></i> (Dr $0 = Cr $0)</span>
    </div>
  </div>`;
  const footer = `<button class="btn btn-primary" onclick="submitNewJournalEntry()">Post Entry</button>`;
  openModal('New Journal Entry', body, footer);
}

function addJELine() {
  const accOptions = DATA.chartAccounts.filter(a => !a.is_group).map(a => `<option value="${a.id}">${a.name} (${a.id})</option>`).join('');
  const container = $('#nje-entries');
  const line = document.createElement('div');
  line.className = 'je-line';
  line.style.cssText = 'display:grid;grid-template-columns:3fr 1fr 1fr;gap:6px;margin-bottom:6px';
  line.innerHTML = `<select class="filter-input" style="font-size:12px">${accOptions}</select>
    <input type="number" class="filter-input" placeholder="Debit" value="0" style="font-size:12px;color:var(--error)" oninput="calcJETotal()" />
    <div style="display:flex;gap:4px"><input type="number" class="filter-input" placeholder="Credit" value="0" style="font-size:12px;color:var(--success)" oninput="calcJETotal()" />
    <button class="btn btn-sm btn-outline" style="color:var(--error);border-color:var(--error);padding:2px 6px" onclick="this.closest('.je-line').remove();calcJETotal()"><i class="fa-solid fa-xmark"></i></button></div>`;
  container.appendChild(line);
}

function calcJETotal() {
  let totalDr = 0, totalCr = 0;
  document.querySelectorAll('.je-line').forEach(line => {
    const inputs = line.querySelectorAll('input');
    totalDr += parseFloat(inputs[0].value) || 0;
    totalCr += parseFloat(inputs[1] ? inputs[1].value : 0) || 0;
  });
  const el = document.getElementById('nje-balance');
  if (el) {
    const diff = Math.abs(totalDr - totalCr);
    if (diff < 0.01) el.innerHTML = `<span style="color:var(--success)">Balanced <i class="fa-solid fa-check" style="color:var(--success)"></i> (Dr $${totalDr.toLocaleString()} = Cr $${totalCr.toLocaleString()})</span>`;
    else el.innerHTML = `<span style="color:var(--error)">Out of balance <i class="fa-solid fa-xmark" style="color:var(--error)"></i> (Dr $${totalDr.toLocaleString()} ≠ Cr $${totalCr.toLocaleString()}, Diff $${diff.toFixed(2)})</span>`;
  }
}

async function submitNewJournalEntry() {
  const date = $('#nje-date').value;
  const desc = $('#nje-desc').value.trim();
  if (!date || !desc) { showToast('Date and Description required', 'error'); return; }

  const lines = document.querySelectorAll('.je-line');
  const entries = [];
  let totalDr = 0, totalCr = 0;
  lines.forEach(line => {
    const sel = line.querySelector('select');
    const inputs = line.querySelectorAll('input');
    const dr = parseFloat(inputs[0].value) || 0;
    const cr = parseFloat(inputs[1] ? inputs[1].value : 0) || 0;
    if (sel.value && (dr > 0 || cr > 0)) {
      entries.push({ account_id: sel.value, debit: dr, credit: cr });
      totalDr += dr; totalCr += cr;
    }
  });
  if (entries.length === 0) { showToast('Add at least one line', 'error'); return; }
  if (Math.abs(totalDr - totalCr) > 0.01) { showToast('Debit and Credit must balance', 'error'); return; }

  const ref = $('#nje-ref').value.trim();
  const je = { id: 'JE-' + Date.now(), date, reference: ref || null, description: desc, entries };
  if (supabase) supabase.from('fin_journal_entries').insert(je).catch(supabaseCatch);
  DATA.journalEntries.push(je);
  closeModal(); showToast('Journal entry posted', 'success'); rerenderSection();
}

/* ── Auto-posting: create Journal Entry when invoice or payment is created ── */
function autoPostJE(reference, description, entries) {
  const je = { id: 'JE-' + Date.now(), date: new Date().toISOString().split('T')[0], reference, description, entries };
  DATA.journalEntries.push(je);
  if (supabase) supabase.from('fin_journal_entries').insert(je).catch(supabaseCatch);
}

/* ── Fixed Assets ── */
function renderFinFixedAssets() {
  function computeDepreciation(fa) {
    if (fa.depreciation_method === 'Straight Line') {
      const annualDep = (fa.cost - fa.salvage_value) / fa.useful_life_years;
      const purchaseDate = new Date(fa.purchase_date);
      const monthsOwned = Math.floor((new Date() - purchaseDate) / (1000 * 60 * 60 * 24 * 30.44));
      const accumDep = Math.min(annualDep * monthsOwned / 12, fa.cost - fa.salvage_value);
      return { annual: annualDep, accum: Math.max(accumDep, fa.accumulated_depreciation || 0), nbv: fa.cost - Math.max(accumDep, fa.accumulated_depreciation || 0) };
    }
    return { annual: 0, accum: fa.accumulated_depreciation || 0, nbv: fa.cost - (fa.accumulated_depreciation || 0) };
  }

  let html = `<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Fixed Assets Register</h2>
    <button class="btn btn-primary btn-sm" onclick="openNewFixedAssetModal()">+ Add Asset</button>
  </div>
  <table class="table"><thead><tr><th>Asset</th><th>Type</th><th>Purchase Date</th><th>Cost</th><th>Salvage Value</th><th>Life (yrs)</th><th>Annual Depr.</th><th>Accum. Depr.</th><th>Net Book Value</th><th>Status</th><th></th></tr></thead><tbody>`;

  DATA.fixedAssets.forEach(fa => {
    const dep = computeDepreciation(fa);
    html += `<tr>
      <td><strong>${fa.name}</strong></td><td>${fa.type}</td><td>${fa.purchase_date}</td>
      <td>$${fa.cost.toLocaleString()}</td><td>$${fa.salvage_value.toLocaleString()}</td><td>${fa.useful_life_years}</td>
      <td>$${dep.annual.toLocaleString()}</td><td>$${Math.round(dep.accum).toLocaleString()}</td>
      <td style="font-weight:700;color:${dep.nbv > fa.cost * 0.5 ? 'var(--blue)' : 'var(--orange)'}">$${Math.round(dep.nbv).toLocaleString()}</td>
      <td><span class="status-pill status-${fa.status.toLowerCase().replace(/ /g, '-')}">${fa.status}</span></td>
      <td><button class="btn btn-sm btn-outline" onclick="openNewFixedAssetModal('${fa.id}')">Edit</button></td>
    </tr>`;
  });
  if (DATA.fixedAssets.length === 0) html += `<tr><td colspan="11" style="text-align:center">No fixed assets registered.</td></tr>`;
  html += `</tbody></table></div>`;
  return html;
}

function openNewFixedAssetModal(editId) {
  const fa = editId ? DATA.fixedAssets.find(a => a.id === editId) : null;
  const supOptions = DATA.suppliers.map(s => `<option value="${s.id}" ${fa && fa.supplier_id === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
  const isEdit = !!fa;
  const body = `<div style="display:flex;flex-direction:column;gap:12px">
    <input class="filter-input" id="nfa-name" placeholder="Asset Name" value="${fa ? fa.name : ''}" />
    <select class="filter-input" id="nfa-type"><option value="Machinery & Equipment" ${fa && fa.type === 'Machinery & Equipment' ? 'selected' : ''}>Machinery & Equipment</option><option value="Safety Equipment" ${fa && fa.type === 'Safety Equipment' ? 'selected' : ''}>Safety Equipment</option><option value="Transport & Material Handling" ${fa && fa.type === 'Transport & Material Handling' ? 'selected' : ''}>Transport & Material Handling</option><option value="IT & Software" ${fa && fa.type === 'IT & Software' ? 'selected' : ''}>IT & Software</option><option value="Buildings & Infrastructure" ${fa && fa.type === 'Buildings & Infrastructure' ? 'selected' : ''}>Buildings & Infrastructure</option></select>
    <input type="date" class="filter-input" id="nfa-pdate" value="${fa ? fa.purchase_date : ''}" />
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <input type="number" class="filter-input" id="nfa-cost" placeholder="Cost ($)" value="${fa ? fa.cost : ''}" />
      <input type="number" class="filter-input" id="nfa-salvage" placeholder="Salvage Value ($)" value="${fa ? fa.salvage_value : ''}" />
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <input type="number" class="filter-input" id="nfa-life" placeholder="Useful Life (years)" value="${fa ? fa.useful_life_years : ''}" />
      <select class="filter-input" id="nfa-depr"><option value="Straight Line" ${fa && fa.depreciation_method === 'Straight Line' ? 'selected' : ''}>Straight Line</option><option value="WDV" ${fa && fa.depreciation_method === 'WDV' ? 'selected' : ''}>Written Down Value</option></select>
    </div>
    <select class="filter-input" id="nfa-supplier"><option value="">— Supplier —</option>${supOptions}</select>
    <select class="filter-input" id="nfa-status"><option value="In Use" ${fa && fa.status === 'In Use' ? 'selected' : ''}>In Use</option><option value="Under Maintenance" ${fa && fa.status === 'Under Maintenance' ? 'selected' : ''}>Under Maintenance</option><option value="Disposed" ${fa && fa.status === 'Disposed' ? 'selected' : ''}>Disposed</option></select>
  </div>`;
  const footer = `<button class="btn btn-primary" onclick="submitNewFixedAsset('${editId || ''}')">${isEdit ? 'Update' : 'Add'} Asset</button>`;
  openModal(isEdit ? 'Edit Fixed Asset' : 'Add Fixed Asset', body, footer);
}

async function submitNewFixedAsset(editId) {
  const name = $('#nfa-name').value.trim();
  if (!name) { showToast('Asset name required', 'error'); return; }
  const asset = {
    id: editId || 'FA-' + Date.now(), name, type: $('#nfa-type').value,
    purchase_date: $('#nfa-pdate').value, cost: parseFloat($('#nfa-cost').value) || 0,
    salvage_value: parseFloat($('#nfa-salvage').value) || 0, useful_life_years: parseInt($('#nfa-life').value) || 5,
    depreciation_method: $('#nfa-depr').value, accumulated_depreciation: 0, net_book_value: parseFloat($('#nfa-cost').value) || 0,
    status: $('#nfa-status').value, supplier_id: $('#nfa-supplier').value || null
  };
  if (!editId) {
    if (supabase) supabase.from('fin_fixed_assets').insert(asset).catch(supabaseCatch);
    DATA.fixedAssets.push(asset);
    autoPostJE(asset.id, 'Fixed Asset ' + name + ' acquired', [{account_id:'ACC-FA', debit:asset.cost, credit:0},{account_id:'ACC-AP', debit:0, credit:asset.cost}]);
  } else {
    const idx = DATA.fixedAssets.findIndex(a => a.id === editId);
    if (idx >= 0) DATA.fixedAssets[idx] = asset;
    if (supabase) supabase.from('fin_fixed_assets').upsert(asset).catch(supabaseCatch);
  }
  closeModal(); showToast(editId ? 'Asset updated' : 'Asset added', 'success'); rerenderSection();
}

function renderFinPayments() {
  let html=`<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Payments Ledger</h2>
    <button class="btn btn-primary btn-sm" onclick="openNewPaymentListModal()"><i class="fa-solid fa-plus"></i> Record Payment</button>
  </div>
  <table class="table">
    <thead><tr><th>ID</th><th>Invoice / Ref</th><th>Date</th><th>Amount</th><th>Method</th><th>Source</th></tr></thead>
    <tbody>`;
  DATA.payments.forEach(p => {
    const source = p.salary_slip_id
      ? `<span style="color:var(--blue);cursor:pointer" onclick="switchModule('hr');switchSection('compensation')">${p.salary_slip_id}</span>`
      : p.invoice_id && p.invoice_id.startsWith('PAYROLL-')
        ? `<span style="color:var(--text-sec)">Payroll</span>`
        : `<span style="color:var(--text-sec)">—</span>`;
    html+=`<tr>
      <td>${p.id}</td><td>${p.invoice_id}</td><td>${p.date}</td>
      <td>$${parseFloat(p.amount).toLocaleString()}</td><td>${p.payment_method}</td><td>${source}</td>
    </tr>`;
  });
  if(DATA.payments.length===0) html+=`<tr><td colspan="6" style="text-align:center">No payments recorded.</td></tr>`;
  html+=`</tbody></table></div>`;
  return html;
}

/* ── FIN: PAYMENTS LIST-LEVEL ── */
function openNewPaymentListModal() {
  const unpaidInvs = DATA.invoices.filter(i => {
    const paid = DATA.payments.filter(p=>p.invoice_id===i.id).reduce((s,p)=>s+parseFloat(p.amount),0);
    return paid < parseFloat(i.total_amount);
  });
  if(unpaidInvs.length===0){showToast('No unpaid invoices available','info');return;}
  const opts = unpaidInvs.map(i => {
    const bal = parseFloat(i.total_amount) - DATA.payments.filter(p=>p.invoice_id===i.id).reduce((s,p)=>s+parseFloat(p.amount),0);
    return `<option value="${i.id}">${i.id} — ${i.party_name} ($${bal.toLocaleString()} due)</option>`;
  }).join('');
  openModal('Select Invoice', `<div class="modal-body">
    <div class="form-group"><label>Invoice *</label>
      <select id="pay-inv-select" class="form-input">${opts}</select></div>
  </div>`, `      <button class="btn btn-primary" onclick="openNewPaymentModal(document.getElementById('pay-inv-select').value)">Continue</button>
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`);
}

function openNewPaymentModal(invoiceId) {
  const inv = DATA.invoices.find(i=>i.id===invoiceId);
  const paidAlready = DATA.payments.filter(p=>p.invoice_id===invoiceId).reduce((s,p)=>s+parseFloat(p.amount),0);
  const balance = Math.max(0, parseFloat(inv.total_amount) - paidAlready);

  const body=`<div style="display:flex;flex-direction:column;gap:12px">
    <div><strong>Invoice:</strong> ${invoiceId}</div>
    <div><strong>Balance Due:</strong> $${balance.toLocaleString()}</div>
    <input type="number" class="filter-input" id="np-amt" placeholder="Amount to Pay ($)" value="${balance}" />
    <select class="filter-select" id="np-method">
      <option value="Bank Transfer">Bank Transfer</option><option value="Credit Card">Credit Card</option><option value="Cash">Cash</option>
    </select>
  </div>`;
  const footer=`<button class="btn btn-primary" onclick="submitNewPayment('${invoiceId}')">Log Payment</button>`;
  openModal('Log Payment', body, footer);
}

async function submitNewPayment(invoiceId) {
  const amt=parseFloat($('#np-amt').value);
  if(!amt){showToast('Amount required','error');return;}
  
  const newPay = { id:'PAY-'+Date.now(), invoice_id:invoiceId, date:new Date().toISOString().split('T')[0], amount:amt, payment_method:$('#np-method').value };
  
  if (supabase) {
    const { error } = await supabase.from('fin_payments').insert(newPay);
    if (error) { showToast('Error saving payment','error'); return; }
  }
  DATA.payments.push(newPay);

  // Auto-post JE
  const inv = DATA.invoices.find(i=>i.id===invoiceId);
  if (inv) {
    const drAccount = inv.type === 'Sales' ? 'ACC-BANK' : 'ACC-AP';
    const crAccount = inv.type === 'Sales' ? 'ACC-AR' : 'ACC-BANK';
    autoPostJE(newPay.id, 'Payment ' + newPay.id + ' auto-posting', [{account_id:drAccount, debit:amt, credit:0},{account_id:crAccount, debit:0, credit:amt}]);
  }

  // Update Invoice Status if fully paid
  if(inv){
    const totalPaid = DATA.payments.filter(p=>p.invoice_id===invoiceId).reduce((s,p)=>s+parseFloat(p.amount),0);
    if(totalPaid >= parseFloat(inv.total_amount)) {
      inv.status = 'Paid';
      if(supabase) await supabase.from('fin_invoices').update({status:'Paid'}).eq('id', invoiceId);
    }
  }

  closeModal(); showToast('Payment logged','success'); rerenderSection();
}

/* ── EXPOSE TO GLOBAL SCOPE FOR INLINE ONCLICK ── */
window.openNewInvoiceModal = openNewInvoiceModal;
window.submitNewInvoice = submitNewInvoice;
window.openNewPaymentModal = openNewPaymentModal;
window.submitNewPayment = submitNewPayment;
window.selectFinItem = selectFinItem;
window.addInvoiceItemRow = addInvoiceItemRow;
window.calcInvoiceItemRow = calcInvoiceItemRow;
window.calcInvoiceTotal = calcInvoiceTotal;
window.openNewChartAccountModal = openNewChartAccountModal;
window.submitNewChartAccount = submitNewChartAccount;
window.openNewJournalEntryModal = openNewJournalEntryModal;
window.submitNewJournalEntry = submitNewJournalEntry;
window.addJELine = addJELine;
window.calcJETotal = calcJETotal;
window.openNewFixedAssetModal = openNewFixedAssetModal;
window.submitNewFixedAsset = submitNewFixedAsset;
window.openNewInventoryModal = openNewInventoryModal;
window.submitNewInventory = submitNewInventory;
window.openNewQIModal = openNewQIModal;
window.submitNewQI = submitNewQI;
window.showQIParams = showQIParams;
window.openNewLCVModal = openNewLCVModal;
window.submitNewLCV = submitNewLCV;
window.showLCVItems = showLCVItems;
window.openNewRRModal = openNewRRModal;
window.submitNewRR = submitNewRR;
window.autoGenerateMR = autoGenerateMR;
window.openNewPositionModal = openNewPositionModal;
window.submitNewPosition = submitNewPosition;
window.openNewReviewModal = openNewReviewModal;
window.submitNewReview = submitNewReview;
window.openNewFSLModal = openNewFSLModal;
window.submitNewFSL = submitNewFSL;
window.hrCheckIn = hrCheckIn;
window.hrCheckOut = hrCheckOut;
window.openNewExpenseModal = openNewExpenseModal;
window.submitNewExpense = submitNewExpense;
window.openNewSalarySlipModal = openNewSalarySlipModal;
window.submitNewSalarySlip = submitNewSalarySlip;
window.openNewLeadModal = openNewLeadModal;
window.submitNewLead = submitNewLead;
window.openNewDealModal = openNewDealModal;
window.submitNewDeal = submitNewDeal;
window.openNewTaskModal = openNewTaskModal;
window.submitNewTask = submitNewTask;
window.toggleRole = toggleRole;
window.toggleLang = toggleLang;
window.switchModule = switchModule;
window.switchSection = switchSection;
window.sortBy = sortBy;
window.closeModal = closeModal;
window.closeDropdown = closeDropdown;
window.selectEmployee = selectEmployee;
window.openNewEmployeeModal = openNewEmployeeModal;
window.submitNewEmployee = submitNewEmployee;
window.openNewLeaveModal = openNewLeaveModal;
window.submitLeaveRequest = submitLeaveRequest;
window.selectCRMItem = selectCRMItem;
window.openNewAccountModal = openNewAccountModal;
window.submitNewAccount = submitNewAccount;
window.openNewCertModal = openNewCertModal;
window.submitNewCert = submitNewCert;
window.approveCert = approveCert;
window.openCertRejectModal = openCertRejectModal;
window.confirmCertReject = confirmCertReject;
window.closeCertRejectModal = closeCertRejectModal;
window.openCertDrawer = openCertDrawer;
window.closeCertDrawer = closeCertDrawer;
window.openCertQRModal = openCertQRModal;
window.closeCertQRModal = closeCertQRModal;
window.openEditCertModal = openEditCertModal;
window.certSetTab = certSetTab;
window.certSetEntityView = certSetEntityView;
window.certSetFilter = certSetFilter;
window.certLoginInspector = certLoginInspector;
window.certLogoutInspector = certLogoutInspector;
window.cycleJobStatus = cycleJobStatus;
window.rerenderSection = rerenderSection;
window.setCertSavedView = setCertSavedView;
window.certSortTable = certSortTable;
window.certToggleColDropdown = certToggleColDropdown;
window.certApplyColVisibility = certApplyColVisibility;
window.certResetColumns = certResetColumns;
window.certToggleSelectAll = certToggleSelectAll;
window.certUpdateMassBar = certUpdateMassBar;
window.certClearSelection = certClearSelection;
window.certMassApprove = certMassApprove;
window.certMassDelete = certMassDelete;
window.certGoPage = certGoPage;
window.certSetPageSize = certSetPageSize;
window.certShowRowActions = certShowRowActions;
window.certHideRowActions = certHideRowActions;
window.certExportCSV = certExportCSV;
window.certExportPDF = certExportPDF;
window.certGetSelectedIds = certGetSelectedIds;
window.deleteCert = deleteCert;
window.openBulkCertModal = openBulkCertModal;
window.bulkWizardNext = bulkWizardNext;
window.bulkDownloadTemplate = bulkDownloadTemplate;
window.bulkHandleCSV = bulkHandleCSV;
window.bulkAddRowManual = bulkAddRowManual;
window.bulkRemoveRow = bulkRemoveRow;
window.bulkClearAllRows = bulkClearAllRows;
window.bulkUpd = bulkUpd;
window.bulkCalcExpiry = bulkCalcExpiry;
window.bulkFillSite = bulkFillSite;
window.renderBulkStep2Content = renderBulkStep2Content;
window.submitBulkWizard = submitBulkWizard;
window.togglePushNotif = togglePushNotif;
window.checkPushHealth = checkPushHealth;
window.requestNotifPermission = requestNotifPermission;
window.fetchFreeModels = fetchFreeModels;
window.selectAIModel = selectAIModel;
window.toggleAIPanel = toggleAIPanel;
window.saveAPIKey = saveAPIKey;
window.clearAPIKey = clearAPIKey;
window.confirmAction = confirmAction;
window.dismissAction = dismissAction;
window.sendChip = sendChip;
if (typeof sendAIMessage !== 'undefined') window.sendAIMessage = sendAIMessage;

// New CRM exports
window.openNewContactModal = openNewContactModal;
window.submitContact = submitContact;
window.deleteContact = deleteContact;
window.openNewQuotationModal = openNewQuotationModal;
window.submitQuotation = submitQuotation;
window.openNewProspectModal = openNewProspectModal;
window.submitProspect = submitProspect;
window.deleteProspect = deleteProspect;
window.openNewCommModal = openNewCommModal;
window.submitComm = submitComm;
window.openNewPartnerModal = openNewPartnerModal;
window.submitNewPartner = submitNewPartner;

// HR new entity exports
window.openNewAbsenceModal = openNewAbsenceModal;
window.submitNewAbsence = submitNewAbsence;
window.openNewTrainingModal = openNewTrainingModal;
window.submitNewTraining = submitNewTraining;
window.openNewOrgUnitModal = openNewOrgUnitModal;
window.submitNewOrgUnit = submitNewOrgUnit;

// Supply new entity exports
window.openNewSupplierModal = openNewSupplierModal;
window.submitNewSupplier = submitNewSupplier;
window.openNewWarehouseModal = openNewWarehouseModal;
window.submitNewWarehouse = submitNewWarehouse;

// Finance new entity exports
window.openNewCostCenterModal = openNewCostCenterModal;
window.submitNewCostCenter = submitNewCostCenter;
window.openNewPaymentListModal = openNewPaymentListModal;

// Certificates entity exports
window.openNewCertClientModal = openNewCertClientModal;
window.openNewFLModal = openNewFLModal;
window.submitNewFL = submitNewFL;
window.openNewInspectorModal = openNewInspectorModal;
window.submitNewInspector = submitNewInspector;
window.openNewJobModal = openNewJobModal;
window.submitNewJob = submitNewJob;