const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

const files = walk(path.resolve('apps/web/src/modules'));
const missing = [];
const importRegex = /(?:import|export)\s+.*?from\s+['"](.*?)['"]/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      const dir = path.dirname(file);
      const resolved = path.resolve(dir, importPath);
      const exts = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
      const exists = exts.some(ext => fs.existsSync(resolved + ext));
      if (!exists) {
        missing.push({ file: path.relative('.', file), importPath });
      }
    }
  }
}

console.log('Total broken relative imports:', missing.length);
const summary = {};
for (const item of missing) {
  summary[item.importPath] = (summary[item.importPath] || 0) + 1;
}
console.log('Import paths summary:', JSON.stringify(summary, null, 2));
