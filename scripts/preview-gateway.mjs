import { createServer, request } from 'node:http';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const cookieName = 'innerpause_preview';
const ttl = 7 * 24 * 60 * 60 * 1000;
const digest = value => createHash('sha256').update(value).digest();
const permittedApi = (method, path) =>
  (method === 'GET' && ['/api/v1/me', '/api/v1/revised/emotions', '/api/v1/revised/journeys'].includes(path)) ||
  (method === 'POST' && ['/api/v1/revised/detect', '/api/v1/revised/journeys'].includes(path)) ||
  (['GET', 'PATCH'].includes(method) && /^\/api\/v1\/revised\/journeys\/[0-9a-f-]{36}$/.test(path));

const loginPage = error => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inner Pause · Private preview</title><style>body{margin:0;background:#f6f0e6;color:#1b2742;font:16px/1.6 system-ui;display:grid;place-items:center;min-height:100dvh}main{box-sizing:border-box;width:min(440px,calc(100% - 40px));padding:36px;background:#fffbf6;border:1px solid #e4d9cb;border-radius:26px}h1{font-size:30px;letter-spacing:-1px}label{display:block;font-weight:600;font-size:14px}input,button{box-sizing:border-box;width:100%;padding:15px;border-radius:14px;font:inherit;margin-top:10px}input{border:1px solid #e4d9cb;background:white;color:#1b2742}button{border:0;background:#1d1b4c;color:white;border-radius:30px;cursor:pointer;font-weight:600}small{color:#64748b}p[role=alert]{color:#a63232}</style><main><small>INNER PAUSE · PRIVATE PREVIEW</small><h1>A little space.<br>Just for you.</h1><p>Enter the testing password shared by Sahil.</p>${error ? '<p role="alert">Incorrect password. Please try again.</p>' : ''}<form method="post" action="/preview-login"><label for="password">Testing password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button>Open Inner Pause</button></form></main></html>`;

export function createPreviewServer({ password, frontendPort = 3011, apiPort = 4011, publicOrigin }) {
  if (typeof password !== 'string' || password.length < 16) throw new Error('A preview password of at least 16 characters is required.');
  if (publicOrigin && (new URL(publicOrigin).origin !== publicOrigin || !publicOrigin.startsWith('https://'))) throw new Error('The public preview origin must be an HTTPS origin.');
  const sessions = new Map();
  const attempts = new Map();
  const passwordHash = digest(password);
  function end(res, status, body, headers = {}) {
    res.writeHead(status, { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'same-origin', ...headers });
    res.end(body);
  }
  async function body(req, limit) {
    const parts = []; let bytes = 0;
    for await (const part of req) {
      bytes += part.length;
      if (bytes > limit) throw new Error('Request body too large');
      parts.push(part);
    }
    return Buffer.concat(parts);
  }
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://preview.local');
      const path = url.pathname;
      const method = req.method;
      const now = Date.now();
      const host = req.headers.host;
      const secure = Boolean(publicOrigin) || req.headers['x-forwarded-proto'] === 'https';
      // Mutations must originate from this preview, never an unrelated website.
      if (!['GET', 'HEAD'].includes(method) && req.headers.origin !== (publicOrigin || `${secure ? 'https' : 'http'}://${host}`)) return end(res, 403, 'Origin not allowed');
      if (path === '/preview-login' && ['GET', 'POST'].includes(method)) {
        if (method === 'GET') return end(res, 200, loginPage(false), { 'content-type': 'text/html; charset=utf-8' });
        const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
        for (const [key, entry] of attempts) if (entry.until < now) attempts.delete(key);
        const attempt = attempts.get(ip) || { count: 0, until: now + 15 * 60 * 1000 };
        if (attempt.count >= 10 || attempts.size > 1000) return end(res, 429, 'Too many attempts. Try again in 15 minutes.');
        attempt.count++; attempts.set(ip, attempt);
        const fields = new URLSearchParams((await body(req, 4096)).toString());
        if (!timingSafeEqual(digest(fields.get('password') || ''), passwordHash)) return end(res, 401, loginPage(true), { 'content-type': 'text/html; charset=utf-8' });
        attempts.delete(ip);
        for (const [key, expiry] of sessions) if (expiry < now) sessions.delete(key);
        const token = randomBytes(32).toString('hex');
        sessions.set(token, now + ttl);
        return end(res, 303, '', { location: '/local-test-sign-in', 'set-cookie': `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${ttl / 1000}${secure ? '; Secure' : ''}` });
      }
      const token = (req.headers.cookie || '').split(';').map(item => item.trim()).find(item => item.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
      if (!token || (sessions.get(token) || 0) <= now) {
        if (path.startsWith('/api/') || path.startsWith('/audio/')) return end(res, 401, 'Preview sign-in required');
        return end(res, 303, '', { location: '/preview-login' });
      }
      const api = path.startsWith('/api/');
      if (api && !permittedApi(method, path)) return end(res, 403, 'This endpoint is not part of the testing preview.');
      if (!api && !['GET', 'HEAD'].includes(method)) return end(res, 405, 'Method not allowed');
      if (path === '/admin' || path.startsWith('/admin/')) return end(res, 404, 'Not found');
      if (path === '/') return end(res, 302, '', { location: '/local-test-sign-in' });
      const payload = ['POST', 'PATCH'].includes(method) ? await body(req, 128 * 1024) : undefined;
      if (payload) {
        try { JSON.parse(payload.toString()); } catch { return end(res, 400, 'Invalid JSON'); }
      }
      const port = api ? apiPort : frontendPort;
      const headers = { ...req.headers, host: `127.0.0.1:${port}` };
      for (const key of ['cookie', 'authorization', 'connection', 'transfer-encoding', 'x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-for', 'cf-connecting-ip', 'origin']) delete headers[key];
      // A visitor cannot impersonate another test user or test-admin.
      if (api) headers.authorization = 'Bearer test-user-b';
      if (payload) headers['content-length'] = String(payload.length);
      const upstream = request({ hostname: '127.0.0.1', port, path: url.pathname + url.search, method, headers }, response => {
        const outgoing = { ...response.headers, 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'same-origin' };
        delete outgoing['set-cookie'];
        res.writeHead(response.statusCode || 502, outgoing);
        response.pipe(res);
      });
      upstream.setTimeout(60000, () => upstream.destroy(new Error('Upstream timeout')));
      upstream.on('error', () => { if (!res.headersSent) end(res, 502, 'The local app is restarting. Please try again shortly.'); else res.destroy(); });
      req.on('aborted', () => upstream.destroy());
      upstream.end(payload);
    } catch {
      if (!res.headersSent) end(res, 400, 'Invalid request');
      else res.destroy();
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { password } = JSON.parse(readFileSync(process.env.PREVIEW_SECRET_FILE, 'utf8'));
  const server = createPreviewServer({ password, publicOrigin: process.env.PREVIEW_PUBLIC_URL });
  server.listen(3012, '127.0.0.1', () => console.log('Protected Inner Pause preview listening on http://127.0.0.1:3012'));
}
