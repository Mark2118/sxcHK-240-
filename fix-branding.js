const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  ['百度', 'WinGo'],
  ['清华', 'WinGo'],
  ['OpenMAIC', 'WinGo'],
  ['THU-MAIC', 'WinGo'],
];

function fixDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixDir(fullPath);
    } else if (entry.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;
      for (const [old, newStr] of REPLACEMENTS) {
        if (content.includes(old)) {
          content = content.split(old).join(newStr);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log('Fixed:', fullPath);
      }
    }
  }
}

fixDir('/app/.next/server');
console.log('Done.');
