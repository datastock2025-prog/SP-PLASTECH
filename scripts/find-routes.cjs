const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../middleware/src/routes.ts'), 'utf8');
const lines = content.split('\n');

const routeMatches = [];
lines.forEach((line, idx) => {
  const match = line.match(/^\s*(?:r\.(get|post|put|patch|delete)|registerResourceRoutes)\s*\(\s*['"]?([^'",\s]+)/);
  if (match) {
    routeMatches.push({ lineNo: idx + 1, method: match[1] || 'resource', path: match[2] });
  } else if (line.includes('// ---') || line.includes('// ===')) {
    routeMatches.push({ lineNo: idx + 1, section: line.trim() });
  }
});

console.log(`Found ${routeMatches.length} route/section entries in routes.ts:`);
routeMatches.forEach((m) => {
  if (m.section) {
    console.log(`\n--- Line ${m.lineNo}: ${m.section} ---`);
  } else {
    console.log(`  L${m.lineNo}: [${m.method.toUpperCase()}] ${m.path}`);
  }
});
