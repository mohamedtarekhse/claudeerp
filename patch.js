const fs = require('fs');

let code = fs.readFileSync('main.js', 'utf8');

if (!code.includes('const generateId =')) {
  code = code.replace(/(import .*;\n)+/, "$&\nconst generateId = (prefix, collection) => prefix + '-' + String(collection.length + 1).padStart(3, '0') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();\n");
}

let count = 0;
code = code.replace(/'([A-Z]+)-'\s*\+\s*String\((?:DATA\.)?([a-zA-Z0-9_]+)\.length\s*\+\s*1\)\.padStart\(\s*3\s*,\s*'0'\s*\)/g, (match, p1, p2) => {
    count++;
    return `generateId('${p1}', DATA.${p2})`;
});

console.log(`Replaced ${count} ID generation strings.`);

fs.writeFileSync('main.js', code, 'utf8');
