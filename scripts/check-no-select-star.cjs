const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../middleware/src');

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  // Exclude system tables, schema reflection, or internal proxies
  const isExcluded = filePath.endsWith('db.ts') || filePath.endsWith('migrate.ts');
  if (isExcluded) return violations;

  const selectStarRegex = /SELECT\s+\*\s+FROM\s+(?!information_schema|pg_)/i;

  lines.forEach((line, index) => {
    // Skip single-line comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    if (selectStarRegex.test(line)) {
      violations.push({ line: index + 1, content: line.trim() });
    }
  });

  return violations;
}

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      const v = scanFile(fullPath);
      if (v.length > 0) {
        results.push({ file: fullPath, violations: v });
      }
    }
  });
  return results;
}

console.log('[check-no-select-star] Scanning server code in middleware/src...');
const violations = walkDir(targetDir);

if (violations.length > 0) {
  console.error('\n[check-no-select-star] FAILED: Found raw SELECT * in server code:');
  violations.forEach((item) => {
    console.error(`\nFile: ${item.file}`);
    item.violations.forEach((v) => {
      console.error(`  Line ${v.line}: ${v.content}`);
    });
  });
  console.error('\nRule: Explicit named column projections are required across all server queries (P4 Step 7).');
  process.exit(1);
} else {
  console.log('[check-no-select-star] PASSED: All server queries use explicit column projections.');
}
