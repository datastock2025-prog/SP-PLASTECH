const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.resolve(__dirname, '../frontend/src'),
  path.resolve(__dirname, '../frontend/apps')
];

function scanFile(filePath) {
  // Allow the architecture guide documentation that explains why localStorage is banned
  if (filePath.endsWith('ReactArchitectureGuide.tsx')) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  const localStorageRegex = /\blocalStorage\b/;

  lines.forEach((line, index) => {
    if (localStorageRegex.test(line)) {
      violations.push({ line: index + 1, content: line.trim() });
    }
  });

  return violations;
}

function walkDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    if (file === 'node_modules' || file === 'dist' || file === '.git') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.d.ts')) {
      const v = scanFile(fullPath);
      if (v.length > 0) {
        results.push({ file: fullPath, violations: v });
      }
    }
  });
  return results;
}

console.log('[check-storage] Scanning frontend code for storage violations...');
let allViolations = [];
for (const dir of targetDirs) {
  allViolations = allViolations.concat(walkDir(dir));
}

if (allViolations.length > 0) {
  console.error('\n[check-storage] FAILED: Found storage references in frontend code:');
  allViolations.forEach((item) => {
    console.error(`\nFile: ${path.relative(path.resolve(__dirname, '..'), item.file)}`);
    item.violations.forEach((v) => {
      console.error(`  Line ${v.line}: ${v.content}`);
    });
  });
  console.error('\nRule: Enterprise Rule #3 forbids client storage for state/cache. Use TanStack Query or db adapter.');
  process.exit(1);
} else {
  console.log('[check-storage] PASSED: Zero storage violations across all frontend modules.');
}
