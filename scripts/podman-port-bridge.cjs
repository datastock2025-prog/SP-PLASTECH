const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getWslIp() {
  try {
    const out = execSync('wsl hostname -I', { encoding: 'utf8' }).trim();
    const ip = out.split(/\s+/)[0];
    if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return ip;
    }
  } catch (e) {
    // Fallback to static WSL adapter IP if query fails
  }
  return '172.18.214.127';
}

const targetIp = getWslIp();
const distDir = path.resolve(__dirname, '../frontend/dist');
console.log(`[Podman Bridge] Routing localhost traffic to WSL2 Podman VM at ${targetIp}...`);

const webAgent = new http.Agent({ keepAlive: true, maxSockets: 64 });
const apiAgent = new http.Agent({ keepAlive: true, maxSockets: 64 });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Sub-millisecond static file server from pre-built frontend/dist with SPA fallback
function tryServeDist(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const rawUrl = (req.url || '/').split('?')[0];
  if (rawUrl.startsWith('/api/') || rawUrl === '/api' || rawUrl.startsWith('/src/') || rawUrl.startsWith('/@')) {
    return false;
  }
  const indexHtml = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtml)) return false;

  const safePath = path.normalize(rawUrl).replace(/^(\.\.[/\\])+/, '');
  const candidate = path.join(distDir, safePath);

  if (rawUrl !== '/' && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    const ext = path.extname(candidate).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isImmutable = rawUrl.startsWith('/assets/');
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': isImmutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    fs.createReadStream(candidate).pipe(res);
    return true;
  }

  // SPA fallback to index.html for routes like / or /?view=itemList
  if (!path.extname(rawUrl)) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    });
    fs.createReadStream(indexHtml).pipe(res);
    return true;
  }

  return false;
}

const webServer = http.createServer((req, res) => {
  if (tryServeDist(req, res)) return;

  const isApi = req.url && (req.url.startsWith('/api/') || req.url === '/api' || req.url.startsWith('/api?'));
  const destPort = isApi ? 4000 : 3000;
  const agent = isApi ? apiAgent : webAgent;

  const proxyReq = http.request(
    {
      hostname: targetIp,
      port: destPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
      agent,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'BAD_GATEWAY', message: err.message } }));
    } else {
      res.end();
    }
  });

  req.pipe(proxyReq);
});

webServer.on('upgrade', (req, clientSocket, head) => {
  const destPort = req.url && req.url.startsWith('/api/') ? 4000 : 3000;
  const serverSocket = net.connect(destPort, targetIp, () => {
    const reqLines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      reqLines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
    }
    reqLines.push('', '');
    serverSocket.write(reqLines.join('\r\n'));
    if (head && head.length) serverSocket.write(head);
    clientSocket.pipe(serverSocket);
    serverSocket.pipe(clientSocket);
  });
  clientSocket.on('error', () => serverSocket.destroy());
  serverSocket.on('error', () => clientSocket.destroy());
});

webServer.listen(3000, '127.0.0.1', () => {
  console.log(`[Podman Bridge] ✔ http://localhost:3000 -> fast dist + web (${targetIp}:3000) + direct /api -> api (${targetIp}:4000)`);
});

const apiServer = net.createServer((clientSocket) => {
  clientSocket.setNoDelay(true);
  const serverSocket = net.connect(4000, targetIp, () => {
    serverSocket.setNoDelay(true);
    clientSocket.pipe(serverSocket);
    serverSocket.pipe(clientSocket);
  });
  clientSocket.on('error', () => serverSocket.destroy());
  serverSocket.on('error', () => clientSocket.destroy());
  clientSocket.on('close', () => serverSocket.destroy());
  serverSocket.on('close', () => clientSocket.destroy());
});

apiServer.listen(4000, '127.0.0.1', () => {
  console.log(`[Podman Bridge] ✔ http://localhost:4000 -> http://${targetIp}:4000`);
});
