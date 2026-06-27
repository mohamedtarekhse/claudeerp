const fs = require('fs');

let code = fs.readFileSync('main.js', 'utf8');

if (!code.includes('const generateId =')) {
  code = code.replace(/(import .*;\n)+/, "$&\nconst generateId = (prefix, collection) => prefix + '-' + String(collection.length + 1).padStart(3, '0') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();\n");
}

let count = 0;
// Replace ID generators: id: 'INV-' + String(DATA.inventory.length + 1).padStart(3, '0')
code = code.replace(/'([A-Z]+)-'\s*\+\s*String\((?:DATA\.)?([a-zA-Z0-9_]+)\.length\s*\+\s*1\)\.padStart\(\s*3\s*,\s*'0'\s*\)/g, (match, p1, p2) => {
    count++;
    return `generateId('${p1}', DATA.${p2})`;
});
console.log(`Replaced ${count} ID generation strings.`);

// Fix optimistic UI in specific functions
function fixOptimistic(collection, tableName, itemVar, dbItemVar, funcName) {
    const funcRegex = new RegExp(`function ${funcName}\\s*\\(`, 'g');
    code = code.replace(funcRegex, `async function ${funcName}(`);

    const oldInsert = new RegExp(
      `if \\(!editId\\) \\{ DATA\\.${collection}\\.push\\(${itemVar}\\); if\\(supabase\\) supabase\\.from\\('${tableName}'\\)\\.insert\\(${dbItemVar}\\)\\.then\\(\\(\\{error:_\\}\\)=>_&&supabaseCatch\\(_\\)\\); \\}\\s*else \\{ const idx = DATA\\.${collection}\\.findIndex\\([a-zA-Z0-9_]+ => [a-zA-Z0-9_]+\\.id === editId\\); DATA\\.${collection}\\[idx\\] = ${itemVar}; if\\(supabase\\) supabase\\.from\\('${tableName}'\\)\\.upsert\\(${dbItemVar}\\)\\.then\\(\\(\\{error:_\\}\\)=>_&&supabaseCatch\\(_\\)\\); \\}`, 'g'
    );
    
    const newInsert = `if (!editId) {
    if(supabase) { const { error } = await supabase.from('${tableName}').insert(${dbItemVar}); if(error) { supabaseCatch(error); return; } }
    DATA.${collection}.push(${itemVar});
  } else {
    if(supabase) { const { error } = await supabase.from('${tableName}').upsert(${dbItemVar}); if(error) { supabaseCatch(error); return; } }
    const idx = DATA.${collection}.findIndex(x => x.id === editId);
    if(idx > -1) DATA.${collection}[idx] = ${itemVar};
  }`;
    
    if (!code.match(oldInsert)) {
      console.log('Failed to match optimistic pattern for', funcName);
    } else {
      code = code.replace(oldInsert, newInsert);
      console.log('Fixed optimistic UI for', funcName);
    }
}

fixOptimistic('qualityInspections', 'quality_inspections', 'qi', 'dbQi', 'saveQualityInspection');
fixOptimistic('landedCostVouchers', 'landed_cost_vouchers', 'v', 'dbV', 'saveLandedCost');
fixOptimistic('reorderRules', 'reorder_rules', 'r', 'dbR', 'saveReorderRule');

// Fix submitNewInventory
code = code.replace('function submitNewInventory()', 'async function submitNewInventory()');
const invOld = `DATA.inventory.push(item);
  if (supabase) supabase.from('inventory').insert({
    id: item.id, item_name: item.name, category: item.category,
    part_no: item.partNo, site: item.site, warehouse: item.warehouse,
    uom: item.uom, qty_on_hand: item.qtyOnHand,
    reorder_point: item.reorderPoint, max_stock: item.maxStock,
    unit_cost: item.unitCost, status: item.status,
    last_received: item.lastReceived, supplier_id: item.supplierId,
    parent_item: item.parent_item, serial_tracking: item.serial_tracking,
    batch_tracking: item.batch_tracking, has_variants: item.has_variants
  }).then(({error:_})=>_&&supabaseCatch(_));`;
  
const invNew = `if (supabase) {
    const { error } = await supabase.from('inventory').insert({
      id: item.id, item_name: item.name, category: item.category,
      part_no: item.partNo, site: item.site, warehouse: item.warehouse,
      uom: item.uom, qty_on_hand: item.qtyOnHand,
      reorder_point: item.reorderPoint, max_stock: item.maxStock,
      unit_cost: item.unitCost, status: item.status,
      last_received: item.lastReceived, supplier_id: item.supplierId,
      parent_item: item.parent_item, serial_tracking: item.serial_tracking,
      batch_tracking: item.batch_tracking, has_variants: item.has_variants
    });
    if (error) { supabaseCatch(error); return; }
  }
  DATA.inventory.push(item);`;

if(code.includes(invOld)) {
  code = code.replace(invOld, invNew);
  console.log("Fixed submitNewInventory");
} else {
  console.log("Failed to match submitNewInventory");
}

// Fix submitNewSupplier
const supOld = `DATA.suppliers.push(rec);
  if(supabase) await supabase.from('suppliers').insert(rec).then(({error:_})=>_&&supabaseCatch(_));`;
const supNew = `if(supabase) { const { error } = await supabase.from('suppliers').insert(rec); if(error) { supabaseCatch(error); return; } }
  DATA.suppliers.push(rec);`;
if(code.includes(supOld)) {
  code = code.replace(supOld, supNew);
  console.log("Fixed submitNewSupplier");
} else {
  console.log("Failed to match submitNewSupplier");
}

// Fix submitNewWarehouse
const whOld = `DATA.warehouses.push(rec);
  if(supabase) await supabase.from('warehouses').insert(rec).then(({error:_})=>_&&supabaseCatch(_));`;
const whNew = `if(supabase) { const { error } = await supabase.from('warehouses').insert(rec); if(error) { supabaseCatch(error); return; } }
  DATA.warehouses.push(rec);`;
if(code.includes(whOld)) {
  code = code.replace(whOld, whNew);
  console.log("Fixed submitNewWarehouse");
} else {
  console.log("Failed to match submitNewWarehouse");
}

fs.writeFileSync('main.js', code, 'utf8');
