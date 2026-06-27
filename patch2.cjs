const fs = require('fs');

let code = fs.readFileSync('main.js', 'utf8');

// Fix submitNewInventory
code = code.replace(/function submitNewInventory\(\)/g, 'async function submitNewInventory()');
const invOldRegex = /DATA\.inventory\.push\(item\);\s*if\s*\(supabase\)\s*supabase\.from\('inventory'\)\.insert\(\{\s*id:\s*item\.id,\s*item_name:\s*item\.name,\s*category:\s*item\.category,\s*part_no:\s*item\.partNo,\s*site:\s*item\.site,\s*warehouse:\s*item\.warehouse,\s*uom:\s*item\.uom,\s*qty_on_hand:\s*item\.qtyOnHand,\s*reorder_point:\s*item\.reorderPoint,\s*max_stock:\s*item\.maxStock,\s*unit_cost:\s*item\.unitCost,\s*status:\s*item\.status,\s*last_received:\s*item\.lastReceived,\s*supplier_id:\s*item\.supplierId,\s*parent_item:\s*item\.parent_item,\s*serial_tracking:\s*item\.serial_tracking,\s*batch_tracking:\s*item\.batch_tracking,\s*has_variants:\s*item\.has_variants\s*\}\)\.then\(\(\s*\{\s*error:_\s*\}\s*\)\s*=>\s*_\s*&&\s*supabaseCatch\(_\)\);/g;

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

if(code.match(invOldRegex)) {
  code = code.replace(invOldRegex, invNew);
  console.log("Fixed submitNewInventory");
} else {
  console.log("Failed to match submitNewInventory");
}

// Fix submitNewSupplier
const supOldRegex = /DATA\.suppliers\.push\(rec\);\s*if\s*\(supabase\)\s*await\s*supabase\.from\('suppliers'\)\.insert\(rec\)\.then\(\(\s*\{\s*error:_\s*\}\s*\)\s*=>\s*_\s*&&\s*supabaseCatch\(_\)\);/g;
const supNew = `if(supabase) { const { error } = await supabase.from('suppliers').insert(rec); if(error) { supabaseCatch(error); return; } }
  DATA.suppliers.push(rec);`;
if(code.match(supOldRegex)) {
  code = code.replace(supOldRegex, supNew);
  console.log("Fixed submitNewSupplier");
} else {
  console.log("Failed to match submitNewSupplier");
}

// Fix submitNewWarehouse
const whOldRegex = /DATA\.warehouses\.push\(rec\);\s*if\s*\(supabase\)\s*await\s*supabase\.from\('warehouses'\)\.insert\(rec\)\.then\(\(\s*\{\s*error:_\s*\}\s*\)\s*=>\s*_\s*&&\s*supabaseCatch\(_\)\);/g;
const whNew = `if(supabase) { const { error } = await supabase.from('warehouses').insert(rec); if(error) { supabaseCatch(error); return; } }
  DATA.warehouses.push(rec);`;
if(code.match(whOldRegex)) {
  code = code.replace(whOldRegex, whNew);
  console.log("Fixed submitNewWarehouse");
} else {
  console.log("Failed to match submitNewWarehouse");
}

fs.writeFileSync('main.js', code, 'utf8');
