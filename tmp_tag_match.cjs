const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'components', 'AdminDashboard.tsx');
const text = fs.readFileSync(filePath, 'utf8');
const lines = text.split(/\r?\n/);
const tags = [];
const openRe = /<motion\.div\b[^>]*>/g;
const closeRe = /<\/motion\.div>/g;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let m;
  while ((m = openRe.exec(line)) !== null) {
    tags.push({ line: i+1, type: 'open', text: m[0]});
  }
  while ((m = closeRe.exec(line)) !== null) {
    tags.push({ line: i+1, type: 'close', text: m[0]});
  }
}
let depth = 0;
for (const tag of tags) {
  console.log(`${tag.line}: ${tag.type.toUpperCase()} ${tag.text}`);
  if (tag.type === 'open') depth++;
  if (tag.type === 'close') depth--;
  if (depth < 0) {
    console.error('NEGATIVE DEPTH at', tag.line);
    depth = 0;
  }
}
console.log('FINAL DEPTH', depth);
