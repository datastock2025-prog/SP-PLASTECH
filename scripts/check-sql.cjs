// check:sql — ratchet gate: raw SQL in middleware/src may only shrink.
// Counts `.query(` / `.execute(` call sites per file and compares with docs/baseline/sql-allowlist.json.
// Fails if any file exceeds its allowance (or a new file appears). Run with --update to lower the baseline.
// db.ts and migrate.ts are infrastructure (transaction/GUC binding, schema version probe) and always allowed.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'middleware', 'src');
const BASELINE = path.join(__dirname, '..', 'docs', 'baseline', 'sql-allowlist.json');
const ALWAYS_ALLOWED = new Set(['db.ts', 'migrate.ts']);
const PATTERN = /\.(query|execute)\(/g;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.ts$/.test(e.name) && !/\.test\.ts$/.test(e.name)) out.push(p);
  }
  return out;
}

const counts = {};
for (const f of walk(ROOT)) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (ALWAYS_ALLOWED.has(rel)) continue;
  const n = (fs.readFileSync(f, 'utf8').match(PATTERN) || []).length;
  if (n) counts[rel] = n;
}

if (process.argv.includes('--update')) {
  fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
  fs.writeFileSync(BASELINE, JSON.stringify(Object.fromEntries(Object.entries(counts).sort()), null, 2) + '\n');
  console.log(`baseline written: ${Object.values(counts).reduce((a, b) => a + b, 0)} call sites in ${Object.keys(counts).length} files`);
  process.exit(0);
}

const base = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : {};
const bad = Object.entries(counts).filter(([f, n]) => n > (base[f] ?? 0));
const total = Object.values(counts).reduce((a, b) => a + b, 0);
const allowed = Object.values(base).reduce((a, b) => a + b, 0);
if (bad.length) {
  console.error('check:sql FAILED — raw SQL grew (use Drizzle via core/query.ts):');
  for (const [f, n] of bad) console.error(`  ${f}: ${n} > allowed ${base[f] ?? 0}`);
  process.exit(1);
}
console.log(`check:sql ok — ${total} raw call sites (baseline ${allowed}); target 0`);
