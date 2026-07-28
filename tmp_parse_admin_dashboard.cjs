const fs = require('fs');
const parser = require('./node_modules/@babel/parser');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'components', 'AdminDashboard.tsx');
const src = fs.readFileSync(filePath, 'utf8');
try {
  parser.parse(src, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  console.log('PARSED_OK');
} catch (e) {
  console.error('ERR', e.message);
  if (e.loc) console.error('LINE', e.loc.line, 'COL', e.loc.column);
  const lines = src.split(/\r?\n/);
  const start = Math.max(0, (e.loc ? e.loc.line : 1) - 6);
  const end = Math.min(lines.length, (e.loc ? e.loc.line : 1) + 4);
  for (let i = start; i < end; i++) {
    console.error(`${i+1}: ${lines[i]}`);
  }
  process.exit(1);
}
