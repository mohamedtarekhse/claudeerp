function renderContent(){
  let html='';
  if(state.module==='hr'){
    if(state.section==='allEmployees'||state.section==='newHires') html=renderAllEmployees();
    else if(state.section==='leaveRequests') html=renderLeaveRequests();
    else html=renderHRStub(state.section.replace(/([A-Z])/g,' $1').trim());
  }
  else if(state.module==='crm'){
    if(state.section==='crmLeads') html=renderCRMLeads();
    else if(state.section==='crmDeals') html=renderCRMDeals();
    else if(state.section==='myTasks') html=renderCRMTasks();
    else if(state.section==='fieldServiceLogs') html=renderCRMFieldServiceLogs();
    else if(state.section==='partnersJVs') html=renderCRMPartners();
    else if(state.section==='crmSettings') html=renderCRMSettings();
    else if(state.section==='allAccounts') html=renderAllAccounts();
    else if(state.section==='myFavorites') html=renderAllAccounts(a=>a.rating==='Hot');
    else if(state.section==='wonThisQuarter') html=renderAllAccounts(a=>a.openOpps>0);
    else if(state.section==='crmContacts') html=renderCRMContacts();
    else if(state.section==='crmQuotations') html=renderCRMQuotations();
    else if(state.section==='crmProspects') html=renderCRMProspects();
    else if(state.section==='crmCommunications') html=renderCRMCommunications();
    else if(state.section==='crmWinLoss') html=renderCRMWinLoss();
    else if(state.section==='crmTerritory') html=renderCRMTerritory();
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
    if(state.section==='scDashboard'||state.section==='warehouses') html=renderSCDashboard();
    else if(state.section==='allPOs') html=renderAllPOs();
    else if(state.section==='pendingApprovalPO') html=renderAllPOs(p=>p.status==='draft');
    else if(state.section==='orderedItems') html=renderAllPOs(p=>p.status==='ordered');
    else if(state.section==='receivedItems') html=renderAllPOs(p=>p.status==='received');
    else if(state.section==='allSuppliers'||state.section==='supplierPerformance') html=renderAllSuppliers();
    else if(state.section==='inventoryItems') html=renderInventory();
    else if(state.section==='lowStockAlerts') html=renderInventory(i=>i.status!=='normal');
    else html=renderSCDashboard();
  }
  $('#modContent').innerHTML=html;
}

function renderAll(){
  renderTabBar();
  renderSidebar();
  renderContent();
}

function rerenderSection(){
  destroyCharts();
  renderTabBar();
  renderSidebar();
  renderContent();
}

/* ═══════════════════════════════════════════════
   SHELL EVENTS
═══════════════════════════════════════════════ */
$('#notifBtn').addEventListener('click',e=>{
  e.stopPropagation();
  if(activeDropdown===$('#notifBtn')){ closeDropdown(); return; }
  let html=`<div class="dropdown-header">${t('notifications')}</div>`;
  DATA.notifications.forEach(n=>{ html+=`<div class="dropdown-item"><i class="fa-solid ${n.icon}" style="color:${n.color};"></i><div><div style="font-size:13px;">${n.text}</div><div style="font-size:11px;color:var(--text-sec);margin-top:1px;">${n.time}</div></div></div>`; });
  html+=`<div style="padding:8px 14px;border-top:1px solid var(--border);text-align:center;"><a style="font-size:12px;color:var(--blue);cursor:pointer;" onclick="closeDropdown();$('#notifBadge').style.display='none';showToast('All notifications cleared','success')">Mark all read</a></div>`;
  openDropdown($('#notifBtn'),html);
});

$('#userBtn').addEventListener('click',e=>{
  e.stopPropagation();
  if(activeDropdown===$('#userBtn')){ closeDropdown(); return; }
  const roles=['System Admin','HR Manager','HSE / Inspection Engineer','Procurement Officer','Executive / C-Level'];
  let html=`<div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;">
    <div class="avatar" style="width:40px;height:40px;font-size:14px;background:var(--blue)">KA</div>
    <div><div style="font-size:14px;font-weight:600;">Khalid Al-Rashidi</div><div style="font-size:12px;color:var(--text-sec);">k.alrashidi@amici.com</div></div>
  </div>
  <div class="dropdown-header" style="font-size:11px;padding:8px 14px 4px;">Switch Role (Demo)</div>
  ${roles.map(r=>`<div class="dropdown-item" onclick="showToast('Role: ${r}','info');closeDropdown()"><i class="fa-solid fa-user-tag"></i>${r}</div>`).join('')}
  <div style="border-top:1px solid var(--border);"><div class="dropdown-item" style="color:var(--error);" onclick="showToast('Signed out','success');closeDropdown()"><i class="fa-solid fa-right-from-bracket" style="color:var(--error);"></i>Sign Out</div></div>`;
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
  model: 'google/gemini-2.5-flash:free',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  history: [],
  isOpen: false,
  isLoading: false,

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

    const contactSummary = DATA.contacts.map(c=>
      `${c.id}|${c.first_name} ${c.last_name}|${c.email}|${c.designation}|acct:${c.account_id}`
    ).join('\n');

    const qtnSummary = DATA.quotations.map(q=>
      `${q.id}|${q.account_name}|${q.grand_total}|${q.status}|items:${q.items.length}`
    ).join('\n');

    const prospectSummary = DATA.prospects.map(p=>
      `${p.id}|${p.company_name}|${p.industry}|${p.territory}|${p.status}|owner:${p.prospect_owner}`
    ).join('\n');

    const commSummary = DATA.communications.map(m=>
      `${m.id}|${m.type}|${m.subject}|${m.reference_type}:${m.reference_id}|${m.date}|by:${m.sender}`
    ).join('\n');

    const invSummary = DATA.inventory.map(i=>
      `${i.id}|${i.name}|${i.partNo}|onHand:${i.qtyOnHand}${i.uom}|reorder:${i.reorderPoint}|${i.status}`
    ).join('\n');

    const expiredCerts = DATA.certificates.filter(c=>getCertStatus(c)==='expired').map(c=>c.equipName).join(', ');
    const expiringCerts = DATA.certificates.filter(c=>getCertStatus(c)==='expiring').map(c=>`${c.equipName}(${getCertDays(c)}d)`).join(', ');
    const lowStock = DATA.inventory.filter(i=>i.status!=='normal').map(i=>`${i.name}(${i.qtyOnHand}${i.uom})`).join(', ');
    const pendingPOs = DATA.purchaseOrders.filter(p=>p.status==='draft').map(p=>p.id).join(', ');

    return `You are AMICI AI, an intelligent ERP assistant for AMICI Oil & Gas company operating in Oman and the Middle East.
You have real-time access to all system data and can both answer questions AND execute actions.

TODAY: ${new Date().toISOString().split('T')[0]}

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

=== CRM CONTACTS (${DATA.contacts.length} total) ===
Format: ID|Name|Email|Designation|AccountID
${contactSummary}

=== CRM QUOTATIONS (${DATA.quotations.length} total) ===
Format: ID|Account|GrandTotal|Status|Items
${qtnSummary}

=== CRM PROSPECTS (${DATA.prospects.length} total) ===
Format: ID|Company|Industry|Territory|Status|Owner
${prospectSummary}

=== CRM COMMUNICATIONS (${DATA.communications.length} total) ===
Format: ID|Type|Subject|Reference|Date|Sender
${commSummary}

=== INVENTORY (${DATA.inventory.length} items) ===
Format: ID|Name|PartNo|OnHand|ReorderPoint|Status
${invSummary}

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
- navigate: { "module": "hr"|"crm"|"certificates"|"supply"|"fin", "section": "allEmployees"|"allPOs"|"allCerts"|"allAccounts"|"scDashboard"|"inventoryItems"|"lowStockAlerts"|"expiredCerts"|"expiringSoon"|"leaveRequests"|"crmLeads"|"crmDeals"|"crmContacts"|"crmQuotations"|"crmProspects"|"crmCommunications"|"crmWinLoss"|"crmTerritory"|"finDashboard"|"finSales"|"finPurchases"|"finPayments"|"finGL"|"finPL"|"finBS"|"finJournalEntries"|"finFixedAssets"|"finCostCenters"|"finChartAccounts" }
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
        const cert = DATA.certificates.find(x=>x.id===p.cert_id);
        if(cert){ cert.remarks=(cert.remarks||'')+'\n<i class="fa-solid fa-triangle-exclamation" style="color:var(--warning)"></i> AI Flag: '+p.note; showToast(`${p.cert_id} flagged`,'warning'); }
        else showToast('Certificate not found','error');
        break;
      }
      case 'create_po_draft': {
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

/* ── AI PANEL TOGGLE ── */
function toggleAIPanel(){
  AI.isOpen = !AI.isOpen;
  $('#aiPanel').classList.toggle('open', AI.isOpen);
  $('#aiBtn').classList.toggle('active', AI.isOpen);
  if(AI.isOpen){
    renderAIMessages();
    // Show key bar only if no key saved
    const hasKey = !!AI.getKey();
    $('#aiKeyBar').style.display = hasKey ? 'none' : 'flex';
    if(hasKey) $('#aiInput').focus();
  }
}

$('#aiBtn').addEventListener('click', e=>{ e.stopPropagation(); toggleAIPanel(); });

/* ── API KEY ── */
function saveAPIKey(){
  const key = $('#aiKeyInput').value.trim();
  if(!key.startsWith('sk-or-')){ showToast('Key must start with sk-or-','error'); return; }
  sessionStorage.setItem('amici_or_key', key);
  $('#aiKeyBar').innerHTML = `<span class="ai-key-saved"><i class="fa-solid fa-check-circle"></i> API key saved for this session</span>
    <button class="ai-key-btn" style="background:var(--text-sec)" onclick="clearAPIKey()">Change</button>
    <button class="ai-key-btn" style="background:var(--danger)" onclick="removeAPIKey()"><i class="fa-solid fa-trash"></i> Remove</button>`;
  showToast('OpenRouter key saved','success');
  $('#aiInput').focus();
}

function clearAPIKey(){
  sessionStorage.removeItem('amici_or_key');
  $('#aiKeyBar').innerHTML = `<input class="ai-key-input" id="aiKeyInput" type="password" placeholder="Paste OpenRouter API key (sk-or-…)">
    <button class="ai-key-btn" onclick="saveAPIKey()">Save</button>`;
  $('#aiKeyBar').style.display='flex';
}

function removeAPIKey(){
  sessionStorage.removeItem('amici_or_key');
  $('#aiKeyBar').innerHTML = `<input class="ai-key-input" id="aiKeyInput" type="password" placeholder="Paste OpenRouter API key (sk-or-…)">
    <button class="ai-key-btn" onclick="saveAPIKey()">Save</button>`;
  $('#aiKeyBar').style.display='none';
  showToast('API key removed','info');
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
    ].map(q=>`<button class="ai-chip" onclick="sendChip('${q}')">${q}</button>`).join('');
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
        <button class="ai-action-btn confirm" onclick="confirmAction(${i})">
          <i class="fa-solid fa-check"></i> Confirm & Execute
        </button>
        <button class="ai-action-btn" style="background:var(--text-sec);margin-left:4px;" onclick="dismissAction(${i})">
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
  sendAIMessage();
}

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
renderAll();
// Update notification badge with live cert alert count
const certAlerts = DATA.certificates.filter(c=>{const s=getCertStatus(c);return s==='expired'||s==='expiring';}).length;
document.getElementById('notifBadge').textContent = certAlerts + DATA.leaveRequests.filter(l=>l.status==='pending').length;
setTimeout(()=> showToast('Welcome to AMICI ERP · All 4 modules live','success'), 700);
</script>