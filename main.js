import { supabase } from './supabase.js';

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
    {id:'DL-001', title:'Acme SaaS Deal', lead_id:'LD-001', account_id:null, value:15000, stage:'Prospecting', expected_close_date:'2026-08-01'}
  ],
  tasks: [
    {id:'TSK-001', description:'Follow up with Acme', due_date:'2026-06-25', status:'pending', assigned_to:'EMP-001', related_lead_id:'LD-001', related_deal_id:null}
  ],
  attendance: [
    {id:'ATT-001', employee_id:'EMP-001', date:new Date().toISOString().split('T')[0], status:'Present', check_in_time:'08:00', check_out_time:null}
  ],
  expenses: [
    {id:'EXP-001', employee_id:'EMP-001', date:'2026-06-15', amount:250, category:'Travel', description:'Flight to site', status:'Pending'}
  ],
  salarySlips: [
    {id:'SAL-001', employee_id:'EMP-001', month:6, year:2026, base_pay:5000, allowances:1000, deductions:500, net_pay:5500, status:'Paid'}
  ],
  invoices: [
    {id:'INV-001', type:'Sales', party_name:'Acme Corp', date:'2026-06-01', due_date:'2026-06-30', total_amount:15000, status:'Unpaid'},
    {id:'PINV-001', type:'Purchase', party_name:'DrillTech Supplies', date:'2026-06-10', due_date:'2026-07-10', total_amount:4500, status:'Unpaid'}
  ],
  payments: [
    {id:'PAY-001', invoice_id:'INV-001', date:'2026-06-15', amount:5000, payment_method:'Bank Transfer'}
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
  ]
};

/* ═══════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════ */
function $(s){ return document.querySelector(s); }
function $$(s){ return document.querySelectorAll(s); }
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

// Phase 6.4: Generic Delete Record
window.deleteRecord = async function(table, id, dataArrayName) {
  if(state.currentUserRole !== 'Manager' && state.currentUserRole !== 'Admin') {
    return showToast('Access denied: Requires Manager/Admin role', 'error');
  }
  if(confirm(`Are you sure you want to permanently delete record ${id}?`)) {
    if(supabase) await supabase.from(table).delete().eq('id', id);
    if(DATA[dataArrayName]) {
      DATA[dataArrayName] = DATA[dataArrayName].filter(item => item.id !== id);
    }
    showToast(`${id} deleted`, 'success');
    rerenderSection();
  }
}

// Phase 6.4: Generic Edit Record
window.editRecord = async function(table, id, dataArrayName, newValues) {
  if(state.currentUserRole !== 'Manager' && state.currentUserRole !== 'Admin') {
    return showToast('Access denied: Requires Manager/Admin role', 'error');
  }
  if(supabase) {
    const { error } = await supabase.from(table).update(newValues).eq('id', id);
    if(error) return showToast('Error updating record', 'error');
  }
  if(DATA[dataArrayName]) {
    let obj = DATA[dataArrayName].find(item => item.id === id);
    if(obj) Object.assign(obj, newValues);
  }
  showToast(`${id} updated successfully`, 'success');
  rerenderSection();
}

function daysFromNow(d){ if(!d) return null; return Math.round((new Date(d+'T00:00:00')-new Date())/(1000*60*60*24)); }
function initials(name){ return name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
function avatarColor(name){ const colors=['#0070f2','#188918','#e9730c','#6b3fa0','#0f6c6c','#354a5e','#bb0000','#0047ab']; let h=0; for(const c of name) h=(h*31+c.charCodeAt(0))&0xffffff; return colors[Math.abs(h)%colors.length]; }
function destroyCharts(){ state.charts.forEach(c=>{try{c.destroy();}catch(e){}}); state.charts=[]; }

function statusPill(status){
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
  const cls = map[status]||'pill-blue';
  return `<span class="pill ${cls}">${labelMap[status]||status}</span>`;
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
  $('#tabBar').innerHTML = MODULES.map(m=>`
    <div class="tab-item ${state.module===m.id?'active':''}" onclick="switchModule('${m.id}')">
      <i class="fa-solid ${m.icon}"></i> ${t(m.labelKey)}
    </div>`).join('');
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
const pendingLeave = DATA.leaveRequests.filter(l=>l.status==='pending').length;
const newHireCount = DATA.employees.filter(e=>{ const d=new Date(e.startDate); const n=new Date(); return (n-d)/(1000*60*60*24*30)<3; }).length;
const probationCount = DATA.employees.filter(e=>e.status==='probation').length;

function renderHRSidebar(){
  const sections=[
    {group:null, items:[
      {id:'allEmployees',icon:'fa-users',label:t('allEmployees')},
      {id:'newHires',icon:'fa-user-plus',label:t('newHires'),badge:newHireCount,badgeCls:'blue'},
      {id:'onProbation',icon:'fa-clock',label:t('onProbation'),badge:probationCount,badgeCls:'orange'},
      {id:'leaveRequests',icon:'fa-calendar-xmark',label:t('leaveRequests'),badge:pendingLeave},
      {id:'timesheets',icon:'fa-table-list',label:t('timesheets'),badge:2},
      {id:'absenceCalendar',icon:'fa-calendar-days',label:t('absenceCalendar')},
    ]},
    {group:'Workforce', items:[
      {id:'openPositions',icon:'fa-briefcase',label:t('openPositions'),badge:4},
      {id:'performanceCycle',icon:'fa-chart-line',label:t('performanceCycle')},
      {id:'trainingHSE',icon:'fa-hard-hat',label:t('trainingHSE')},
      {id:'compensation',icon:'fa-money-bill-wave',label:t('compensation')},
      {id:'expenseClaims',icon:'fa-file-invoice-dollar',label:'Expense Claims'},
      {id:'orgUnits',icon:'fa-sitemap',label:t('orgUnits')},
    ]},
    {group:'Admin', items:[
      {id:'hrSettings',icon:'fa-gear',label:t('hrSettings')},
    ]},
  ];
  let html='';
  sections.forEach(s=>{
    if(s.group) html+=`<div class="sidebar-group">${s.group}</div>`;
    s.items.forEach(i=>{
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
  const pending=pendingLeave+2;
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
      <button class="btn btn-primary btn-sm" onclick="openNewEmployeeModal()"><i class="fa-solid fa-plus"></i> ${t('newEmployee')}</button>
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
    html+=`<div class="sec-card"><div class="sec-card-head">Employment Details <button class="btn btn-ghost btn-sm" onclick="showToast('Editing ${e.name}','info')"><i class="fa-solid fa-pen"></i> ${t('edit')}</button></div>
    <div class="sec-card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
      ${[['Email',e.email],['Phone',e.phone],['Employment Type',e.empType],['Salary Band',e.salaryBand],['Cost Center',e.costCenter],['Manager',e.manager?DATA.employees.find(x=>x.id===e.manager)?.name||e.manager:'—'],['H2S Level',e.h2sLevel],['Work Permit',e.workPermit],['Visa Expiry',e.visa],['Med. Fitness',e.medFit?'✔ Fit':'✘ Unfit'],['Med. Expiry',fmtDate(e.medExpiry)]].map(([k,v])=>`<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">${k}</div><div style="font-size:13px;">${v}</div></div>`).join('')}
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
      await supabase.from('employee_leave_balances').insert({
        employee_id: newEmp.id, leave_type: type, used: bal.used, total: bal.total
      });
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
    <td>${l.status==='Pending'?`<button class="btn btn-primary btn-sm" onclick="approveLeave('${l.id}')">Approve</button>`:''}</td></tr>`; });
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
  const newReq = { id:'LR-'+Date.now(), employeeName:empName, type:$('#nl-type').value, startDate:from, endDate:to, days, status:'Pending' };
  
  if(supabase) await supabase.from('leave_requests').insert(newReq);
  DATA.leaveRequests.push(newReq);
  closeModal(); showToast('Leave requested successfully', 'success'); rerenderSection();
}

window.approveLeave = async function(id) {
  const req = DATA.leaveRequests.find(l => l.id === id);
  if(req) {
    req.status = 'Approved';
    if(supabase) await supabase.from('leave_requests').update({status:'Approved'}).eq('id', id);
    
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
}
function renderHRStub(label){
  return `<div class="fade-in"><div class="empty-state" style="padding:80px 20px;"><i class="fa-solid fa-hard-hat" style="font-size:48px;opacity:.2;margin-bottom:16px;"></i><p style="font-size:15px;font-weight:600;">${label}</p><p style="margin-top:6px;font-size:13px;">This section is planned for Chunk 3.</p></div></div>`;
}

/* ═══════════════════════════════════════════════
   DATA — CRM MODULE
═══════════════════════════════════════════════ */
DATA.accounts = [
  {id:'ACC-001',name:'OQ (Oman Oil & Gas)',type:'Operator',country:'Oman',region:'Middle East',owner:'Khalid Al-Rashidi',status:'active',contractValue:4200000,rating:'Hot',blockRef:'Block 15',openOpps:2,
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
  {id:'ACC-004',name:'PDO – Petroleum Development Oman',type:'Operator',country:'Oman',region:'Middle East',owner:'Khalid Al-Rashidi',status:'active',contractValue:11500000,rating:'Hot',blockRef:'South Oman',openOpps:4,
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
  });
})();

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
});
Object.assign(i18n.ar,{
  allCerts:'كل الشهادات',expiredCerts:'منتهية الصلاحية',expiringSoon:'تنتهي قريباً',catRotating:'المعدات الدوارة',catStatic:'المعدات الثابتة',catLifting:'معدات الرفع',catElectrical:'المعدات الكهربائية',catPressure:'أنظمة الضغط',catFire:'الحريق والسلامة',catInstrumentation:'الأجهزة والقياس',catVehicles:'المركبات',uploadCert:'رفع شهادة',complianceReport:'تقرير الامتثال',
  totalCerts:'إجمالي الشهادات',validCerts:'سارية',expiringIn30:'تنتهي خلال 30 يوم',expiredCount:'منتهية (حرجة)',complianceRate:'معدل الامتثال',
  equipName:'اسم المعدة',assetTag:'رقم الأصل',category:'الفئة',certType:'نوع الشهادة',issuer:'جهة الإصدار',issueDate:'تاريخ الإصدار',expiryDate:'تاريخ الانتهاء',daysRemaining:'الأيام المتبقية',responsibleEngineer:'المهندس',
  newCertificate:'شهادة جديدة',
});

/* ═══════════════════════════════════════════════
   CRM SIDEBAR
═══════════════════════════════════════════════ */
function renderCRMSidebar(){
  const openContracts = DATA.accounts.filter(a=>a.status==='active'&&a.contractValue>0).length;
  const overdueCount = 2;
  const sections=[
    {group:null,items:[
      {id:'crmLeads',icon:'fa-users-viewfinder',label:'Leads'},
      {id:'crmDeals',icon:'fa-kanban',label:'Deals Pipeline'},
      {id:'allAccounts',icon:'fa-building',label:t('allAccounts')},
      {id:'myFavorites',icon:'fa-star',label:t('myFavorites')},
      {id:'openContracts',icon:'fa-file-signature',label:t('openContracts'),badge:openContracts,badgeCls:'blue'},
      {id:'wonThisQuarter',icon:'fa-trophy',label:t('wonThisQuarter')},
    ]},
    {group:'Activities',items:[
      {id:'myTasks',icon:'fa-list-check',label:t('myTasks'),badge:overdueCount},
      {id:'fieldServiceLogs',icon:'fa-screwdriver-wrench',label:t('fieldServiceLogs')},
      {id:'partnersJVs',icon:'fa-handshake',label:t('partnersJVs')},
    ]},
    {group:'Admin',items:[
      {id:'crmSettings',icon:'fa-gear',label:t('crmSettings')},
    ]},
  ];
  let html='';
  sections.forEach(s=>{
    if(s.group) html+=`<div class="sidebar-group">${s.group}</div>`;
    s.items.forEach(i=>{
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
  const allO=DATA.allOpps;
  const won=allO.filter(o=>o.stage==='Award').length;
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
function renderAllAccounts(){
  const f=state.filters;
  let items=[...DATA.accounts];
  if(f.search){const s=f.search.toLowerCase();items=items.filter(a=>a.name.toLowerCase().includes(s)||a.country.toLowerCase().includes(s)||a.owner.toLowerCase().includes(s)||a.id.toLowerCase().includes(s));}
  if(f.type&&f.type!=='all') items=items.filter(a=>a.type===f.type);
  if(f.rating&&f.rating!=='all') items=items.filter(a=>a.rating===f.rating);
  if(state.sortCol){const col=state.sortCol,dir=state.sortDir==='asc'?1:-1;items.sort((a,b)=>{let va=a[col],vb=b[col];if(typeof va==='string')return va.localeCompare(vb)*dir;return (va-vb)*dir;});}
  const types=[...new Set(DATA.accounts.map(a=>a.type))];
  const ratingPill=r=>r==='Hot'?'<span style="color:#b71c1c;font-weight:700">🔴 Hot</span>':r==='Warm'?'<span style="color:#b35d00;font-weight:700">🟡 Warm</span>':'<span style="color:#6a6d70;font-weight:700">🔵 Cold</span>';

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
      <span style="font-weight:700;color:${ratingColors[a.rating]};font-size:13px;">● ${a.rating}</span>
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
  const expired=certs.filter(c=>c.status==='expired').length;
  const expiring=certs.filter(c=>c.status==='expiring').length;
  const cats=['Rotating','Static','Lifting','Electrical','Pressure','Fire & Safety','Instrumentation','Vehicles'];
  const catIcons={'Rotating':'fa-rotate','Static':'fa-industry','Lifting':'fa-weight-hanging','Electrical':'fa-bolt','Pressure':'fa-gauge-high','Fire & Safety':'fa-fire-extinguisher','Instrumentation':'fa-sliders','Vehicles':'fa-truck'};
  const catKeys={'Rotating':'catRotating','Static':'catStatic','Lifting':'catLifting','Electrical':'catElectrical','Pressure':'catPressure','Fire & Safety':'catFire','Instrumentation':'catInstrumentation','Vehicles':'catVehicles'};
  let html=`<div class="sidebar-item ${state.section==='allCerts'?'active':''}" onclick="switchSection('allCerts')"><i class="fa-solid fa-certificate"></i><span style="flex:1">${t('allCerts')}</span></div>
    <div class="sidebar-item ${state.section==='expiredCerts'?'active':''}" onclick="switchSection('expiredCerts')"><i class="fa-solid fa-circle-xmark" style="color:var(--error)"></i><span style="flex:1">${t('expiredCerts')}</span><span class="sidebar-badge">${expired}</span></div>
    <div class="sidebar-item ${state.section==='expiringSoon'?'active':''}" onclick="switchSection('expiringSoon')"><i class="fa-solid fa-clock" style="color:var(--warning)"></i><span style="flex:1">${t('expiringSoon')}</span><span class="sidebar-badge orange">${expiring}</span></div>
    <div class="sidebar-group">Equipment Categories</div>`;
  cats.forEach(cat=>{
    const id='cat_'+cat.replace(/[^a-z]/gi,'');
    const cnt=certs.filter(c=>c.category===cat).length;
    html+=`<div class="sidebar-item ${state.section===id?'active':''}" onclick="switchSection('${id}')"><i class="fa-solid ${catIcons[cat]}"></i><span style="flex:1">${t(catKeys[cat])}</span><span class="sidebar-badge blue">${cnt}</span></div>`;
  });
  html+=`<div class="sidebar-group">Actions</div>
    <div class="sidebar-item" onclick="openNewCertModal()"><i class="fa-solid fa-upload"></i><span>${t('uploadCert')}</span></div>
    <div class="sidebar-item" onclick="showToast('Generating compliance report...','info')"><i class="fa-solid fa-chart-bar"></i><span>${t('complianceReport')}</span></div>`;
  return html;
}

/* ═══════════════════════════════════════════════
   CERTIFICATE KPI CARDS
═══════════════════════════════════════════════ */
function renderCertKPIs(){
  const certs=DATA.certificates;
  const total=certs.length;
  const valid=certs.filter(c=>c.status==='valid').length;
  const expiring=certs.filter(c=>c.status==='expiring').length;
  const expired=certs.filter(c=>c.status==='expired').length;
  const compliance=Math.round((valid+certs.filter(c=>c.status==='renewal').length)/total*100);
  return `<div class="kpi-grid">
    <div class="kpi-card"><span class="kpi-label">${t('totalCerts')}</span><span class="kpi-value">${total}</span><span class="kpi-change" style="color:var(--text-sec)"><i class="fa-solid fa-certificate"></i> Registered</span></div>
    <div class="kpi-card green"><span class="kpi-label">${t('validCerts')}</span><span class="kpi-value">${valid}</span><span class="kpi-change kpi-up"><i class="fa-solid fa-check-circle"></i> In compliance</span></div>
    <div class="kpi-card orange"><span class="kpi-label">${t('expiringIn30')}</span><span class="kpi-value">${expiring}</span><span class="kpi-change kpi-warn"><i class="fa-solid fa-triangle-exclamation"></i> Action required</span></div>
    <div class="kpi-card red"><span class="kpi-label">${t('expiredCount')}</span><span class="kpi-value">${expired}</span><span class="kpi-change kpi-down"><i class="fa-solid fa-circle-xmark"></i> Immediate action!</span></div>
    <div class="kpi-card ${compliance>=90?'green':compliance>=75?'orange':'red'}"><span class="kpi-label">${t('complianceRate')}</span><span class="kpi-value">${compliance}%</span><span class="kpi-change ${compliance>=90?'kpi-up':'kpi-warn'}"><i class="fa-solid fa-${compliance>=90?'check':'triangle-exclamation'}"></i> ${compliance>=90?'On target':'Below target'}</span></div>
  </div>`;
}

/* ═══════════════════════════════════════════════
   CERTIFICATE MODULE — TABLE VIEW
═══════════════════════════════════════════════ */
function renderCertificates(filterFn){
  const f=state.filters;
  let items=DATA.certificates.filter(filterFn||(_=>true));
  if(f.search){const s=f.search.toLowerCase();items=items.filter(c=>c.equipName.toLowerCase().includes(s)||c.assetTag.toLowerCase().includes(s)||c.certType.toLowerCase().includes(s)||c.site.toLowerCase().includes(s)||c.id.toLowerCase().includes(s));}
  if(f.category&&f.category!=='all') items=items.filter(c=>c.category===f.category);
  if(f.status&&f.status!=='all') items=items.filter(c=>c.status===f.status);
  if(state.sortCol){const col=state.sortCol,dir=state.sortDir==='asc'?1:-1;items.sort((a,b)=>{let va=a[col],vb=b[col];if(typeof va==='string')return va.localeCompare(vb)*dir;return(va-vb)*dir;});}

  const certStatusPill=(c)=>{
    if(c.status==='expired') return `<span class="pill pill-expired">Expired</span>`;
    if(c.status==='expiring') return `<span class="pill pill-expiring">Expiring Soon</span>`;
    if(c.status==='renewal') return `<span class="pill pill-probation">Due Renewal</span>`;
    return `<span class="pill pill-valid">Valid</span>`;
  };
  const daysCell=(c)=>{
    const d=c.daysRemaining;
    const col=d<0?'var(--error)':d<=30?'var(--warning)':d<=90?'var(--purple)':'var(--success)';
    const icon=d<0?'fa-circle-xmark':d<=30?'fa-triangle-exclamation':d<=90?'fa-clock':'fa-circle-check';
    return `<span style="color:${col};font-weight:700;display:flex;align-items:center;gap:4px;"><i class="fa-solid ${icon}" style="font-size:11px;"></i>${d<0?'Expired '+Math.abs(d)+'d ago':d+'d'}</span>`;
  };
  const catIcons={'Rotating':'🔁','Static':'🏗️','Lifting':'🏋️','Electrical':'⚡','Pressure':'💧','Fire & Safety':'🔥','Instrumentation':'📡','Vehicles':'🚗'};
  const cats=[...new Set(DATA.certificates.map(c=>c.category))];

  let html=`<div class="fade-in">`;
  html+=renderCertKPIs();
  html+=`<div class="md-layout">`;

  // MASTER LIST
  html+=`<div class="md-master">
    <div class="filter-bar">
      <input class="filter-input" placeholder="Search certs..." value="${f.search||''}" oninput="state.filters.search=this.value;rerenderSection()" style="flex:1;min-width:100px">
      <select class="filter-select" onchange="state.filters.status=this.value;rerenderSection()">
        <option value="all">All Status</option><option value="valid">Valid</option><option value="renewal">Due Renewal</option><option value="expiring">Expiring</option><option value="expired">Expired</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="openNewCertModal()"><i class="fa-solid fa-plus"></i> New</button>
    </div>
    <div style="padding:6px 14px 4px;font-size:11px;color:var(--text-sec);background:#fafafa;border-bottom:1px solid var(--border);">${items.length} certificates</div>
    <div class="list-container">`;
  if(items.length===0) html+=`<div class="empty-state"><i class="fa-solid fa-certificate"></i><p>No certificates found</p></div>`;
  items.forEach(c=>{
    const borderCol=c.status==='expired'?'var(--error)':c.status==='expiring'?'var(--warning)':c.status==='renewal'?'var(--purple)':'var(--success)';
    html+=`<div class="list-item ${state.selectedId===c.id?'selected':''}" onclick="selectCertItem('${c.id}')" style="border-left-color:${state.selectedId===c.id?'var(--blue)':borderCol}">
      <div style="font-size:20px;width:32px;text-align:center;flex-shrink:0;">${catIcons[c.category]||'📋'}</div>
      <div class="list-item-body">
        <div class="list-item-title">${c.equipName}</div>
        <div class="list-item-desc">${c.certType}</div>
      </div>
      <div class="list-item-right">
        ${certStatusPill(c)}
        <div class="list-item-date" style="margin-top:3px;">${daysCell(c)}</div>
      </div>
    </div>`;
  });
  html+=`</div></div>`;

  // DETAIL
  html+=`<div class="md-detail ${state.selectedId?'has-item':''}" style="padding:0;">`;
  if(state.selectedId){
    const c=DATA.certificates.find(x=>x.id===state.selectedId);
    if(c) html+=renderCertDetail(c);
  } else {
    html+=`<div class="empty-state" style="min-height:400px;"><i class="fa-solid fa-hand-pointer"></i><p>Select a certificate to view details</p></div>`;
  }
  html+=`</div></div></div>`;
  return html;
}

function selectCertItem(id){ state.selectedId=id; state.detailTab='info'; rerenderSection(); }

function renderCertDetail(c){
  const statusColors={valid:'var(--success)',expiring:'var(--warning)',renewal:'var(--purple)',expired:'var(--error)'};
  const statusLabels={valid:'✔ Valid',expiring:'⚠ Expiring Soon',renewal:'🔄 Due for Renewal',expired:'✘ Expired'};
  const col=statusColors[c.status]||'var(--text-sec)';
  const catIcons={'Rotating':'🔁','Static':'🏗️','Lifting':'🏋️','Electrical':'⚡','Pressure':'💧','Fire & Safety':'🔥','Instrumentation':'📡','Vehicles':'🚗'};

  let html=`<div class="obj-header">
    <div class="obj-header-top">
      <div style="font-size:36px;width:52px;text-align:center;">${catIcons[c.category]||'📋'}</div>
      <div style="flex:1;"><h2>${c.equipName}</h2><div class="obj-sub">${c.assetTag} · ${c.certType}</div></div>
      <span style="font-weight:700;color:${col};font-size:13px;">${statusLabels[c.status]}</span>
    </div>
    <div class="obj-kv">
      <div class="obj-kv-item"><span class="obj-kv-label">Cert ID</span><span class="obj-kv-value">${c.id}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Category</span><span class="obj-kv-value">${c.category}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Site</span><span class="obj-kv-value">${c.site}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Issuing Authority</span><span class="obj-kv-value">${c.issuer}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Expiry Date</span><span class="obj-kv-value" style="color:${col};font-weight:700;">${fmtDate(c.expiryDate)}</span></div>
      <div class="obj-kv-item"><span class="obj-kv-label">Days Remaining</span><span class="obj-kv-value" style="color:${col};font-weight:700;">${c.daysRemaining<0?'Expired '+Math.abs(c.daysRemaining)+'d ago':c.daysRemaining+' days'}</span></div>
    </div>
  </div>
  <div class="detail-tab-body">
    <div class="sec-card"><div class="sec-card-head">Certificate Details
      <div style="display:flex;gap:8px;">
        ${c.pdfUrl?`<button class="btn btn-ghost btn-sm" onclick="showToast('Opening ${c.pdfUrl}','info')"><i class="fa-solid fa-file-pdf"></i> View PDF</button>`:'<span style="font-size:12px;color:var(--text-sec);font-style:italic;">No PDF attached</span>'}
        <button class="btn btn-primary btn-sm" onclick="showToast('Renewal initiated for ${c.id}','success')"><i class="fa-solid fa-rotate"></i> Renew</button>
      </div>
    </div>
    <div class="sec-card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
      ${[['Certificate ID',c.id],['Equipment Name',c.equipName],['Asset Tag',c.assetTag],['Category',c.category],['Site / Location',c.site],['Certificate Type',c.certType],['Issuing Authority',c.issuer],['Issue Date',fmtDate(c.issueDate)],['Expiry Date',fmtDate(c.expiryDate)],['Responsible Engineer',c.engineer],['PDF Attached',c.pdfUrl?'Yes – '+c.pdfUrl:'No']].map(([k,v])=>`<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-sec);margin-bottom:2px;">${k}</div><div style="font-size:13px;">${v}</div></div>`).join('')}
    </div></div>
    ${c.remarks?`<div class="sec-card"><div class="sec-card-head">Remarks / Inspector Notes</div><div class="sec-card-body" style="font-size:13px;line-height:1.7;">${c.remarks}</div></div>`:''}
    <div class="sec-card"><div class="sec-card-head">Expiry Status</div><div class="sec-card-body">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="flex:1;height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden;">
          <div style="height:100%;width:${Math.max(0,Math.min(100,c.daysRemaining>0?Math.min(100,c.daysRemaining/365*100):0))}%;background:${col};border-radius:5px;"></div>
        </div>
        <span style="font-size:13px;font-weight:700;color:${col};">${c.daysRemaining<0?'Expired':'Valid'}</span>
      </div>
      <div style="display:flex;gap:16px;font-size:11px;">
        <span style="color:var(--success);">● Valid: &gt;90 days</span>
        <span style="color:var(--purple);">● Due Renewal: 31–90 days</span>
        <span style="color:var(--warning);">● Expiring: ≤30 days</span>
        <span style="color:var(--error);">● Expired</span>
      </div>
    </div></div>
  </div>`;
  return html;
}

/* ═══════════════════════════════════════════════
   NEW CERTIFICATE MODAL
═══════════════════════════════════════════════ */
function openNewCertModal(){
  const body=`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Equipment Name</label><input class="form-input" id="nc-name" placeholder="e.g. HP Centrifugal Pump – P-201"></div>
      <div class="form-group"><label class="form-label">Asset Tag / No.</label><input class="form-input" id="nc-tag" placeholder="e.g. ROT-P201"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Equipment Category</label>
        <select class="form-select" id="nc-cat"><option>Rotating</option><option>Static</option><option>Lifting</option><option>Electrical</option><option>Pressure</option><option>Fire & Safety</option><option>Instrumentation</option><option>Vehicles</option></select>
      </div>
      <div class="form-group"><label class="form-label">Site / Location</label>
        <select class="form-select" id="nc-site"><option>Block 15 – Rig Alpha</option><option>Block 7 – Offshore Platform</option><option>Onshore Processing Facility – South</option><option>Gas Treatment Plant – North</option><option>Head Office – Muscat</option><option>Block 3 – Exploration Camp</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Certificate Type</label><input class="form-input" id="nc-type" placeholder="e.g. API 510, LOLER, IEC 60079"></div>
      <div class="form-group"><label class="form-label">Issuing Authority</label><input class="form-input" id="nc-issuer" placeholder="e.g. Bureau Veritas, DNV, SGS"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Issue Date</label><input class="form-input" id="nc-issue" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="form-label">Expiry Date</label><input class="form-input" id="nc-expiry" type="date"></div>
      <div class="form-group"><label class="form-label">Upload Certificate (PDF)</label>
      <input class="form-input" id="nc-file" type="file" accept=".pdf"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Responsible Engineer</label>
        <select class="form-select" id="nc-eng">${DATA.employees.filter(e=>e.dept==='HSE'||e.dept==='Maintenance'||e.dept==='Instrumentation').map(e=>`<option>${e.name}</option>`).join('')}</select>
      </div>
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
  
  // Phase 5: Actual Storage Upload logic (with mock fallback)
  let uploadedPdfUrl = $('#nc-pdf').value;
  if(fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    if(supabase) {
      showToast('Uploading to Supabase Storage...', 'info');
      const { data, error } = await supabase.storage.from('certificates').upload(`public/${newId}-${file.name}`, file);
      if(!error && data) {
        uploadedPdfUrl = supabase.storage.from('certificates').getPublicUrl(`public/${newId}-${file.name}`).data.publicUrl;
      }
    } else {
      uploadedPdfUrl = URL.createObjectURL(fileInput.files[0]);
    }
    showToast('File securely uploaded', 'success');
  }

  const cert={id:newId,equipName:name,assetTag:$('#nc-tag').value,category:$('#nc-cat').value,site:$('#nc-site').value,certType:$('#nc-type').value,issuer:$('#nc-issuer').value,issueDate:$('#nc-issue').value,expiryDate:expiry,daysRemaining:days,status,engineer:$('#nc-eng').value,pdfUrl:uploadedPdfUrl,remarks:$('#nc-remarks').value};
  if(supabase){
    const{error}=await supabase.from('certificates').insert({id:newId,employee_id:null,cert_type:cert.certType,expiry_date:expiry,status});
    if(error){showToast('Error saving certificate','error');return;}
  }
  DATA.certificates.push(cert);
  closeModal();state.selectedId=newId;state.section='allCerts';showToast(name+' certificate added','success');rerenderSection();
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
  {id:'INV-003',name:'Drill Bits – PDC 8.5"',partNo:'DRL-PDC085',category:'Drilling Consumables',site:'Block 15 – Rig Alpha',warehouse:'WH-Block15-01',uom:'Unit',qtyOnHand:4,reorderPoint:3,maxStock:12,unitCost:14500,status:'normal',lastReceived:'2025-04-20',supplierId:'SUP-002'},
  {id:'INV-004',name:'Mud Pump Liner 7.5"',partNo:'DRL-MPL075',category:'Drilling Consumables',site:'Block 15 – Rig Alpha',warehouse:'WH-Block15-01',uom:'Unit',qtyOnHand:1,reorderPoint:4,maxStock:8,unitCost:4500,status:'critical',lastReceived:'2025-03-15',supplierId:'SUP-002'},
  {id:'INV-008',name:'H2S Gas Detector – Portable',partNo:'INS-GT-H2S',category:'Gas Detection',site:'All Sites',warehouse:'WH-HO-01',uom:'Unit',qtyOnHand:0,reorderPoint:10,maxStock:25,unitCost:3200,status:'out',lastReceived:'2024-12-01',supplierId:'SUP-013'},
  {id:'INV-009',name:'Nitrogen Cylinders 50L',partNo:'GAS-N2-50L',category:'Industrial Gases',site:'All Sites',warehouse:'WH-HO-01',uom:'Cylinder',qtyOnHand:28,reorderPoint:20,maxStock:80,unitCost:185,status:'normal',lastReceived:'2025-05-31',supplierId:'SUP-011'},
  {id:'INV-010',name:'Control Valve – Fisher V250 4"',partNo:'INS-CV-V250',category:'Instrumentation',site:'Gas Treatment Plant – North',warehouse:'WH-North-01',uom:'Unit',qtyOnHand:0,reorderPoint:1,maxStock:4,unitCost:48000,status:'out',lastReceived:'2024-09-10',supplierId:'SUP-005'},
  {id:'INV-011',name:'Premium Tubing 3.5" TenarisHydril',partNo:'DRL-TBG035',category:'Drilling Consumables',site:'Block 7 – Offshore Platform',warehouse:'WH-Block7-01',uom:'Joint',qtyOnHand:85,reorderPoint:50,maxStock:200,unitCost:1400,status:'normal',lastReceived:'2025-04-30',supplierId:'SUP-001'},
  {id:'INV-012',name:'Demulsifier DM-880',partNo:'CHM-DM880',category:'Production Chemicals',site:'Onshore Processing Facility – South',warehouse:'WH-South-01',uom:'Litre',qtyOnHand:420,reorderPoint:400,maxStock:2000,unitCost:31,status:'low',lastReceived:'2025-05-31',supplierId:'SUP-003'},
  {id:'INV-013',name:'Calibration Gas H2S Mix',partNo:'GAS-CAL-H2S',category:'Gas Detection',site:'Gas Treatment Plant – North',warehouse:'WH-North-01',uom:'Cylinder',qtyOnHand:6,reorderPoint:8,maxStock:30,unitCost:480,status:'low',lastReceived:'2025-05-20',supplierId:'SUP-013'},
];

Object.assign(i18n.en,{
  scDashboard:'SC Dashboard',allPOs:'Purchase Orders',prRequests:'PR Requests',pendingApprovalPO:'Pending Approval',orderedItems:'Ordered / In Transit',receivedItems:'Received',cancelledItems:'Cancelled',allSuppliers:'Suppliers',supplierPerformance:'Supplier Performance',inventoryItems:'Inventory',lowStockAlerts:'Low Stock Alerts',warehouses:'Warehouses',scSettings:'SC Settings',
  openPOs:'Open POs',poValueMTD:'PO Value MTD',pendingPRs:'Pending PRs',lowStockItems:'Low Stock Items',activeSuppliers:'Active Suppliers',
  poNumber:'PO Number',supplier:'Supplier',scCategory:'Category',description:'Description',amount:'Amount',priority:'Priority',requestedBy:'Requested By',requiredDate:'Required Date',poStatus:'Status',
  newPO:'New Purchase Order',
  stockStatus:'Stock Status',qtyOnHand:'Qty On Hand',reorderPoint:'Reorder Point',partNo:'Part No.',warehouseLbl:'Warehouse',lastReceived:'Last Received',
  normal:'Normal',low:'Low',critical:'Critical',out:'Out of Stock',
  finDashboard:'Finance',finSales:'Sales Invoices',finPurchases:'Purchase Invoices',finPayments:'Payments',finSettings:'Finance Settings',
  totalRevenue:'Total Revenue',totalExpenses:'Total Expenses',netProfit:'Net Profit',
  invoiceId:'Invoice ID',date:'Date',dueDate:'Due Date',status:'Status',
  unpaid:'Unpaid',paid:'Paid',overdue:'Overdue'
});
Object.assign(i18n.ar,{
  scDashboard:'لوحة قيادة المشتريات',allPOs:'جميع الطلبات',prRequests:'طلبات الشراء',pendingApprovalPO:'بانتظار الموافقة',orderedItems:'قيد التنفيذ / تم الطلب',receivedItems:'مستلم',cancelledItems:'ملغى',allSuppliers:'الموردين',supplierPerformance:'أداء الموردين',inventoryItems:'المخزون',lowStockAlerts:'تنبيهات انخفاض المخزون',warehouses:'المستودعات',scSettings:'إعدادات المشتريات',
  openPOs:'طلبات الشراء المفتوحة',poValueMTD:'قيمة الطلبات هذا الشهر',pendingPRs:'طلبات الشراء المعلقة',lowStockItems:'عناصر المخزون المنخفض',activeSuppliers:'الموردين النشطين',
  poNumber:'رقم أمر الشراء',supplier:'المورد',scCategory:'الفئة',description:'الوصف',amount:'المبلغ',priority:'الأولوية',requestedBy:'طلب بواسطة',requiredDate:'التاريخ المطلوب',poStatus:'الحالة',
  newPO:'أمر شراء جديد',
  stockStatus:'حالة المخزون',qtyOnHand:'الكمية المتوفرة',reorderPoint:'نقطة إعادة الطلب',partNo:'رقم القطعة',warehouseLbl:'المستودع',lastReceived:'آخر استلام',
  normal:'عادي',low:'منخفض',critical:'حرج',out:'غير متوفر',
  finDashboard:'المالية',finSales:'فواتير المبيعات',finPurchases:'فواتير المشتريات',finPayments:'المدفوعات',finSettings:'الإعدادات المالية',
  totalRevenue:'إجمالي الإيرادات',totalExpenses:'إجمالي المصروفات',netProfit:'صافي الربح',
  invoiceId:'رقم الفاتورة',date:'التاريخ',dueDate:'تاريخ الاستحقاق',status:'الحالة',
  unpaid:'غير مدفوع',paid:'مدفوع',overdue:'متأخر'
});

async function editRecord(table, id, data) {
  if (supabase) {
    const { error } = await supabase.from(table).update(data).eq('id', id);
    if (error) showToast('Error updating record', 'error');
    else showToast('Record updated', 'success');
  }
}

async function deleteRecord(table, id, section) {
  if (!confirm('Are you sure you want to delete this record?')) return;
  if (supabase) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { showToast('Error deleting record', 'error'); return; }
  }
  DATA[section] = DATA[section].filter(r => r.id !== id);
  showToast('Record deleted', 'success');
  rerenderSection();
}

/* ═══════════════════════════════════════════════
   SC SIDEBAR
═══════════════════════════════════════════════ */
function renderSCSidebar(){
  const pendingPOs = DATA.purchaseOrders.filter(p=>p.status==='draft').length;
  const lowStock = DATA.inventory.filter(i=>i.status==='low'||i.status==='critical'||i.status==='out').length;
  const sections=[
    {group:null,items:[
      {id:'scDashboard',icon:'fa-gauge-high',label:t('scDashboard')},
      {id:'allPOs',icon:'fa-file-invoice',label:t('allPOs')},
      {id:'pendingApprovalPO',icon:'fa-clock',label:t('pendingApprovalPO'),badge:pendingPOs},
      {id:'orderedItems',icon:'fa-truck-fast',label:t('orderedItems'),badge:DATA.purchaseOrders.filter(p=>p.status==='ordered').length,badgeCls:'blue'},
      {id:'receivedItems',icon:'fa-box-archive',label:t('receivedItems')},
    ]},
    {group:'Suppliers',items:[
      {id:'allSuppliers',icon:'fa-building-user',label:t('allSuppliers')},
      {id:'supplierPerformance',icon:'fa-chart-line',label:t('supplierPerformance')},
    ]},
    {group:'Inventory',items:[
      {id:'inventoryItems',icon:'fa-boxes-stacked',label:t('inventoryItems')},
      {id:'lowStockAlerts',icon:'fa-triangle-exclamation',label:t('lowStockAlerts'),badge:lowStock},
      {id:'warehouses',icon:'fa-warehouse',label:t('warehouses')},
    ]},
    {group:'Admin',items:[
      {id:'scSettings',icon:'fa-gear',label:t('scSettings')},
    ]},
  ];
  let html='';
  sections.forEach(s=>{
    if(s.group) html+=`<div class="sidebar-group">${s.group}</div>`;
    s.items.forEach(i=>{
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
  const pending = pos.filter(p=>p.status==='draft').length;
  const lowStock = DATA.inventory.filter(i=>i.status==='low'||i.status==='critical'||i.status==='out').length;
  const activeSup = DATA.suppliers.filter(s=>s.status==='active').length;
  return `<div class="kpi-grid">
    <div class="kpi-card"><span class="kpi-label">${t('openPOs')}</span><span class="kpi-value">${open}</span><span class="kpi-change" style="color:var(--text-sec)"><i class="fa-solid fa-file-invoice"></i> Active orders</span></div>
    <div class="kpi-card green"><span class="kpi-label">${t('poValueMTD')}</span><span class="kpi-value" style="font-size:18px">${fmt(mtd)}</span><span class="kpi-change kpi-up"><i class="fa-solid fa-arrow-up"></i> This month</span></div>
    <div class="kpi-card orange"><span class="kpi-label">${t('pendingPRs')}</span><span class="kpi-value">${pending}</span><span class="kpi-change kpi-warn"><i class="fa-solid fa-clock"></i> Awaiting approval</span></div>
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
  const lowStockItems=inv.filter(i=>i.status!=='normal').sort((a,b)=>{'out critical low'.indexOf(a.status)-'out critical low'.indexOf(b.status)});
  const catSpend={};
  pos.filter(p=>p.status!=='cancelled').forEach(p=>{ catSpend[p.category]=(catSpend[p.category]||0)+p.amount; });

  const stockBadge=s=>s==='out'?'<span class="pill pill-expired">Out of Stock</span>':s==='critical'?'<span class="pill pill-expiring">Critical</span>':s==='low'?'<span class="pill pill-leave">Low</span>':'<span class="pill pill-valid">Normal</span>';
  const poBadge=s=>s==='approved'?'<span class="pill pill-valid">Approved</span>':s==='ordered'?'<span class="pill pill-blue">Ordered</span>':s==='received'?'<span class="pill pill-active">Received</span>':s==='cancelled'?'<span class="pill pill-inactive">Cancelled</span>':'<span class="pill pill-draft">Draft</span>';
  const priorityBadge=p=>p==='Critical'?'<span style="color:var(--error);font-weight:700;font-size:11px;">● Critical</span>':p==='High'?'<span style="color:var(--warning);font-weight:700;font-size:11px;">● High</span>':'<span style="color:var(--text-sec);font-size:11px;">● Normal</span>';

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
  const priorityBadge=p=>p==='Critical'?'<span style="color:var(--error);font-weight:700;font-size:11px;">●</span>':p==='High'?'<span style="color:var(--warning);font-weight:700;font-size:11px;">●</span>':'<span style="color:var(--text-sec);font-size:11px;">●</span>';

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
      <button class="btn btn-primary btn-sm" onclick="openNewPOModal()"><i class="fa-solid fa-plus"></i> New PO</button>
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
      <span style="font-weight:700;font-size:13px;color:${priorityColors[p.priority]}">● ${p.priority}</span>
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
        ${p.status==='approved'||p.status==='ordered'?`<button class="btn btn-primary btn-sm" onclick="receivePO('${p.id}')"><i class="fa-solid fa-box-open"></i> Receive</button>`:''}
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
      const stars='★'.repeat(Math.round(sup.rating))+'☆'.repeat(5-Math.round(sup.rating));
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

async function approvePO(id){
  if(state.currentUserRole !== 'Manager' && state.currentUserRole !== 'Admin') {
    return showToast('Access denied: Requires Manager role', 'error');
  }
  const po=DATA.purchaseOrders.find(p=>p.id===id);
  if(po){
    po.status='ordered'; po.approvedBy=DATA.employees[0].name;
    if(supabase) await supabase.from('purchase_orders').update({status:'ordered'}).eq('id',id);
    showToast(id+' approved and ordered','success'); rerenderSection();
  }
}

window.receivePO = async function(id) {
  const po=DATA.purchaseOrders.find(p=>p.id===id);
  if(po) {
    po.status = 'received';
    if(supabase) await supabase.from('purchase_orders').update({status:'received'}).eq('id', id);
    
    // Auto-update inventory
    const itemName = po.description || 'Received Item';
    let invItem = DATA.inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    if(invItem) {
      invItem.stock += 1;
      if(supabase) await supabase.from('inventory').update({stock_level: invItem.stock}).eq('id', invItem.id);
      showToast('PO Received. Inventory updated for ' + itemName, 'success');
    } else {
      const newInv = { id: 'INV-ITM-'+Date.now(), name: itemName, category: po.category, stock: 1, min: 5, unit: 'Lot', location: po.site };
      DATA.inventory.push(newInv);
      if(supabase) {
        await supabase.from('inventory').insert({id: newInv.id, item_name: itemName, category: po.category, stock_level: 1, min_stock: 5, unit: 'Lot', location: po.site});
      }
      showToast('PO Received. New inventory item created for ' + itemName, 'success');
    }
    rerenderSection();
  }
}

/* ═══════════════════════════════════════════════
   SC — SUPPLIERS LIST
═══════════════════════════════════════════════ */
function renderAllSuppliers(){
  const f=state.filters;
  let items=[...DATA.suppliers];
  if(f.search){const s=f.search.toLowerCase();items=items.filter(x=>x.name.toLowerCase().includes(s)||x.country.toLowerCase().includes(s)||x.category.toLowerCase().includes(s));}
  if(f.category&&f.category!=='all') items=items.filter(x=>x.category===f.category);
  const cats=[...new Set(DATA.suppliers.map(s=>s.category))].sort();
  const ratingBar=r=>`<div style="display:flex;align-items:center;gap:4px;"><span style="color:#f5a623;font-size:12px;">${'★'.repeat(Math.round(r))}</span><span style="font-size:11px;color:var(--text-sec)">${r}</span></div>`;

  let html=`<div class="fade-in">`;
  html+=renderSCKPIs();
  html+=`<div class="md-layout">`;

  html+=`<div class="md-master">
    <div class="filter-bar">
      <input class="filter-input" placeholder="Search suppliers..." value="${f.search||''}" oninput="state.filters.search=this.value;rerenderSection()" style="flex:1;min-width:90px">
      <select class="filter-select" onchange="state.filters.category=this.value;rerenderSection()">
        <option value="all">All Categories</option>${cats.map(c=>`<option value="${c}" ${f.category===c?'selected':''}>${c}</option>`).join('')}
      </select>
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
  const stars='★'.repeat(Math.round(s.rating))+'☆'.repeat(5-Math.round(s.rating));
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



async function hrCheckIn() {
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});
  const rec = { id:'ATT-'+Date.now(), employee_id:'EMP-001', date:today, status:'Present', check_in_time:time, check_out_time:null };
  
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
  const myAtt = DATA.attendance.find(a => a.employee_id === 'EMP-001' && a.date === today);
  
  if(myAtt) {
    myAtt.check_out_time = time;
    if(supabase) await supabase.from('hr_attendance').update({check_out_time:time}).eq('id', myAtt.id);
    showToast('Checked out successfully!','success'); rerenderSection();
  }
}

async function submitNewExpense() {
  const amt=parseFloat($('#nx-amt').value)||0;
  const desc=$('#nx-desc').value.trim();
  const date=$('#nx-date').value;
  const fileInput = document.getElementById('nx-file');
  if(!desc || amt<=0 || !date) { showToast('Please fill all required fields', 'error'); return; }
  
  let uploadedUrl = null;
  if(fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    if(supabase) {
      showToast('Uploading receipt...', 'info');
      const { data, error } = await supabase.storage.from('expense-receipts').upload(`public/${Date.now()}-${file.name}`, file);
      if(!error && data) {
        uploadedUrl = supabase.storage.from('expense-receipts').getPublicUrl(data.path).data.publicUrl;
      }
    } else {
      uploadedUrl = URL.createObjectURL(file);
    }
    showToast('Receipt securely uploaded', 'success');
  }

  const newExp = { id:'EXP-'+Date.now(), employee_id:DATA.employees[0].id, date:date, amount:amt, category:$('#nx-cat').value, description:desc, status:'Pending', receipt_url: uploadedUrl };
  if(supabase) await supabase.from('hr_expense_claims').insert(newExp);
  DATA.expenses.push(newExp);
  closeModal(); showToast('Expense submitted', 'success'); rerenderSection();
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

  let html = `<div class="fade-in"><div class="filter-bar"><h2>Absence & Leave Calendar</h2></div>
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

function renderHRTraining() {
  let html = `<div class="fade-in"><div class="filter-bar"><h2>HSE & Training</h2></div>
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

function renderHROrgUnits() {
  let html = `<div class="fade-in"><div class="filter-bar"><h2>Organizational Units</h2></div>
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



/* ── HR PAYROLL ── */
function renderHRPayroll() {
  let html=`<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Payroll & Compensation</h2>
    <button class="btn btn-primary" onclick="openNewSalarySlipModal()">Generate Slip</button>
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
      <td>${s.status==='Draft'?`<button class="btn btn-primary btn-sm" onclick="approveSalarySlip('${s.id}')">Approve</button>`:''}</td>
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
  if(state.currentUserRole !== 'Manager' && state.currentUserRole !== 'Admin') {
    return showToast('Access denied: Requires Manager role', 'error');
  }
  const slip = DATA.salarySlips.find(s => s.id === id);
  if(slip) {
    slip.status = 'Approved';
    if(supabase) await supabase.from('hr_salary_slips').update({status:'Approved'}).eq('id', id);
    
    // HR -> Finance Automation: Auto-journal / Payment record
    const newPay = {
      id: 'PAY-' + Date.now(), invoice_id: 'Payroll', date: new Date().toISOString().split('T')[0], amount: slip.net_pay, payment_method: 'Bank Transfer'
    };
    if (supabase) await supabase.from('fin_payments').insert(newPay);
    DATA.payments.push(newPay);
    showToast('Payroll Approved. Payment recorded in Finance.', 'success');
    
    rerenderSection();
  }
}

/* ── FINANCE MODULE ── */
function renderFinSidebar() {
  const overdueCount = DATA.invoices.filter(i=>i.status==='Overdue').length;
  const sections=[
    {group:null, items:[
      {id:'finDashboard',icon:'fa-chart-pie',label:'Dashboard'},
      {id:'finSales',icon:'fa-file-invoice-dollar',label:'Sales Invoices (A/R)'},
      {id:'finPurchases',icon:'fa-file-invoice',label:'Purchase Invoices (A/P)'},
      {id:'finPayments',icon:'fa-money-bill-transfer',label:'Payments'},
    ]},
    {group:'Admin', items:[
      {id:'finSettings',icon:'fa-gear',label:'Settings'},
    ]},
  ];
  let html='';
  sections.forEach(s=>{
    if(s.group) html+=`<div class="sidebar-group">${s.group}</div>`;
    s.items.forEach(i=>{
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

function renderFinInvoices(type) {
  let html=`<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>${type} Invoices</h2>
    <button class="btn btn-primary" onclick="openNewInvoiceModal('${type}')">+ New ${type} Invoice</button>
  </div>
  <table class="table">
    <thead><tr><th>ID</th><th>Party Name</th><th>Date</th><th>Due Date</th><th>Total Amount</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>`;
  DATA.invoices.filter(i=>i.type===type).forEach(i => {
    html+=`<tr style="cursor:pointer" onclick="alert('Details for ${i.id}')">
      <td><strong>${i.id}</strong></td><td>${i.party_name}</td><td>${i.date}</td><td>${i.due_date||'-'}</td>
      <td>$${parseFloat(i.total_amount).toLocaleString()}</td>
      <td><span class="status-pill status-${i.status.toLowerCase().replace(' ','-')}">${i.status}</span></td>
      <td>
        ${(i.status==='Unpaid'||i.status==='Overdue') ? `<button class="btn btn-sm btn-outline" onclick="event.stopPropagation();openNewPaymentModal('${i.id}')">Log Payment</button>` : ''}
      </td>
    </tr>`;
  });
  if(DATA.invoices.filter(i=>i.type===type).length===0) html+=`<tr><td colspan="7" style="text-align:center">No invoices found.</td></tr>`;
  html+=`</tbody></table></div>`;
  return html;
}

function openNewInvoiceModal(type) {
  const body=`<div style="display:flex;flex-direction:column;gap:12px">
    <input class="filter-input" id="ni-party" placeholder="${type==='Sales'?'Customer Name':'Supplier Name'}" />
    <input type="date" class="filter-input" id="ni-due" placeholder="Due Date" />
    <input type="number" class="filter-input" id="ni-amt" placeholder="Total Amount ($)" />
  </div>`;
  const footer=`<button class="btn btn-primary" onclick="submitNewInvoice('${type}')">Save Invoice</button>`;
  openModal(`New ${type} Invoice`, body, footer);
}

async function submitNewInvoice(type) {
  const party=$('#ni-party').value.trim();
  const amt=parseFloat($('#ni-amt').value);
  if(!party||!amt){showToast('Party Name and Amount required','error');return;}
  
  const invPrefix = type==='Sales' ? 'INV-' : 'PINV-';
  const newInv = { id:invPrefix+Date.now(), type, party_name:party, date:new Date().toISOString().split('T')[0], due_date:$('#ni-due').value||null, total_amount:amt, status:'Unpaid' };
  
  if (supabase) {
    const { error } = await supabase.from('fin_invoices').insert(newInv);
    if (error) { showToast('Error saving','error'); return; }
  }
  DATA.invoices.push(newInv);
  closeModal(); showToast('Invoice saved','success'); rerenderSection();
}

function renderFinPayments() {
  let html=`<div class="fade-in"><div class="filter-bar" style="justify-content:space-between">
    <h2>Payments Ledger</h2>
  </div>
  <table class="table">
    <thead><tr><th>ID</th><th>Invoice ID</th><th>Date</th><th>Amount</th><th>Method</th></tr></thead>
    <tbody>`;
  DATA.payments.forEach(p => {
    html+=`<tr>
      <td>${p.id}</td><td>${p.invoice_id}</td><td>${p.date}</td>
      <td>$${parseFloat(p.amount).toLocaleString()}</td><td>${p.payment_method}</td>
    </tr>`;
  });
  if(DATA.payments.length===0) html+=`<tr><td colspan="5" style="text-align:center">No payments recorded.</td></tr>`;
  html+=`</tbody></table></div>`;
  return html;
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

  // Update Invoice Status if fully paid
  const inv = DATA.invoices.find(i=>i.id===invoiceId);
  const totalPaid = DATA.payments.filter(p=>p.invoice_id===invoiceId).reduce((s,p)=>s+parseFloat(p.amount),0);
  if(totalPaid >= parseFloat(inv.total_amount)) {
    inv.status = 'Paid';
    if(supabase) await supabase.from('fin_invoices').update({status:'Paid'}).eq('id', invoiceId);
  }

  closeModal(); showToast('Payment logged','success'); rerenderSection();
}

/* ── EXPOSE TO GLOBAL SCOPE FOR INLINE ONCLICK ── */
window.openNewInvoiceModal = openNewInvoiceModal;
window.submitNewInvoice = submitNewInvoice;
window.openNewPaymentModal = openNewPaymentModal;
window.submitNewPayment = submitNewPayment;
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
window.toggleLang = toggleLang;
window.switchModule = switchModule;
window.switchSection = switchSection;
window.sortBy = sortBy;
window.closeModal = closeModal;
window.closeDropdown = closeDropdown;
window.selectEmployee = selectEmployee;
window.openNewEmployeeModal = openNewEmployeeModal;
window.submitNewEmployee = submitNewEmployee;
window.selectCRMItem = selectCRMItem;
window.openNewAccountModal = openNewAccountModal;
window.submitNewAccount = submitNewAccount;
window.selectCertItem = selectCertItem;
window.openNewCertModal = openNewCertModal;
window.submitNewCert = submitNewCert;
window.selectPOItem = selectPOItem;
window.approvePO = approvePO;
window.selectSupplierItem = selectSupplierItem;
window.openNewPOModal = openNewPOModal;
window.submitNewPO = submitNewPO;
window.toggleAIPanel = toggleAIPanel;
window.saveAPIKey = saveAPIKey;
window.clearAPIKey = clearAPIKey;
window.confirmAction = confirmAction;
window.dismissAction = dismissAction;
window.sendChip = sendChip;
if (typeof sendAIMessage !== 'undefined') window.sendAIMessage = sendAIMessage;window.deleteRecord = deleteRecord; window.editRecord = editRecord;
