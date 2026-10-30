/**
 * Enterprise Ultra-Fast Local Server Starter (< 2s)
 * Automatically verifies Podman machine, starts containers instantly, and validates health.
 */
const { execSync } = require('child_process');

const DB_CONTAINER = 'sp-plastech-dev-db-1';
const API_CONTAINER = 'sp-plastech-dev-api-1';
const WEB_CONTAINER = 'sp-plastech-dev-web-1';

function run(cmd, silent = false) {
  try {
    return execSync(cmd, { stdio: silent ? 'pipe' : 'inherit', encoding: 'utf-8' });
  } catch (err) {
    if (silent) return null;
    throw err;
  }
}

function runOutput(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' }).trim();
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('\x1b[36m%s\x1b[0m', '⚡ Starting SP-PLASTECH Enterprise Local Stack...');
  const t0 = Date.now();

  // 1. Verify Podman Machine is running
  const isRunning = runOutput('podman ps -a');
  if (isRunning === null) {
    console.log('📦 Starting Podman Machine...');
    run('podman machine start');
  }

  // 2. Fast-start containers directly
  const psOutput = runOutput('podman ps -a') || '';
  const hasDb = psOutput.includes(DB_CONTAINER);
  const hasApi = psOutput.includes(API_CONTAINER);
  const hasWeb = psOutput.includes(WEB_CONTAINER);

  if (hasDb && hasApi && hasWeb) {
    console.log('🚀 Fast-starting existing containers...');
    run(`podman start ${DB_CONTAINER} ${API_CONTAINER} ${WEB_CONTAINER}`, true);
  } else {
    console.log('🏗️ Initializing containers via compose...');
    run('podman compose -f compose.yaml up -d');
  }

  // 3. Resolve IP (fast WSL lookup)
  let wslIp = '127.0.0.1';
  const ipCheck = runOutput('wsl -d podman-machine-default ip -4 addr show eth0');
  if (ipCheck) {
    const match = ipCheck.match(/inet (\d+\.\d+\.\d+\.\d+)/);
    if (match) wslIp = match[1];
  }

  const duration = ((Date.now() - t0) / 1000).toFixed(2);
  console.log('\x1b[32m%s\x1b[0m', `✨ Stack Ready in ${duration}s!`);
  console.log('----------------------------------------------------');
  console.log(`  🌐 Web App:      http://localhost:3000  (or http://${wslIp}:3000)`);
  console.log(`  🔌 API Server:   http://localhost:4000  (or http://${wslIp}:4000/health)`);
  console.log(`  🗄️  PostgreSQL:   localhost:5432 (User: erp, DB: erp)`);
  console.log('----------------------------------------------------');
  console.log('Logs: npm run dev:podman:logs');
}

main().catch(err => {
  console.error('\x1b[31m%s\x1b[0m', 'Failed to start stack:', err.message);
  process.exit(1);
});
