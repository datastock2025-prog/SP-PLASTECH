const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.tmp',
  'test-results',
  'playwright-report',
  'coverage',
]);

const BANNED_PATTERNS = [
  {
    name: 'empty catch block',
    regex: /catch\s*(?:\([^)]*\))?\s*\{\s*\}/g,
  },
  {
    name: 'swallowed catch returning empty fallback',
    regex: /catch\s*(?:\([^)]*\))?\s*\{\s*return\s+(?:\[\]|null|false|\{\s*\})\s*;?\s*\}/g,
  },
  {
    name: 'unsafe parseResult fallback (bypassing validation)',
    regex: /\.success\s*\?\s*[^:]+:\s*(?:raw|body|data)\b/g,
  },
];

let totalViolations = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name) && !entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  const relPath = path.relative(ROOT, filePath);
  // Skip check scripts themselves
  if (relPath.includes('check-banned-patterns.cjs') || relPath.includes('inspect-db.cjs')) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const { name, regex } of BANNED_PATTERNS) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const lineNo = content.slice(0, match.index).split('\n').length;
      console.warn(`[banned-pattern] ${relPath}:${lineNo} — Found ${name}: "${match[0].trim()}"`);
      totalViolations++;
    }
  }
}

console.log('Scanning codebase for banned error-handling patterns (Part A3 Specification)...');
scanDir(path.join(ROOT, 'middleware', 'src'));
scanDir(path.join(ROOT, 'frontend', 'apps', 'web', 'src'));

if (totalViolations > 0) {
  console.log(`\nScan finished: ${totalViolations} occurrences flagged.`);
} else {
  console.log('\nScan passed: 0 banned error patterns found in core sources.');
}
