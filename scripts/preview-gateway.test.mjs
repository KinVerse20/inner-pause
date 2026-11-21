import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createPreviewServer } from './preview-gateway.mjs';

test('preview gates pages, audio and APIs and fixes the test identity', async t => {
  const upstream = createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ authorization: req.headers.authorization, path: req.url }));
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const port = upstream.address().port;
  const gateway = createPreviewServer({ password: 'preview-password-for-test', apiPort: port, frontendPort: port });
  await new Promise(resolve => gateway.listen(0, '127.0.0.1', resolve));
  t.after(() => { gateway.closeAllConnections(); gateway.close(); upstream.closeAllConnections(); upstream.close(); });
  const base = `http://127.0.0.1:${gateway.address().port}`;
  assert.equal((await fetch(base + '/revised', { redirect: 'manual' })).status, 303);
  for (const path of ['/api/v1/me', '/audio/revised/sounds/rain.m4a']) assert.equal((await fetch(base + path)).status, 401);
  assert.equal((await fetch(base + '/preview-login', { method: 'POST', headers: { origin: base }, body: 'password=wrong' })).status, 401);
  assert.equal((await fetch(base + '/preview-login', { method: 'POST', headers: { origin: 'https://evil.example' }, body: 'password=preview-password-for-test' })).status, 403);
  const login = await fetch(base + '/preview-login', { method: 'POST', headers: { origin: base }, body: 'password=preview-password-for-test', redirect: 'manual' });
  assert.equal(login.status, 303);
  assert.match(login.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const headers = { cookie, authorization: 'Bearer test-admin', origin: base };
  assert.equal((await (await fetch(base + '/api/v1/me', { headers })).json()).authorization, 'Bearer test-user-b');
  assert.equal((await fetch(base + '/audio/revised/sounds/rain.m4a', { headers })).status, 200);
  assert.equal((await fetch(base + '/api/v1/admin/overview', { headers })).status, 403);
  assert.equal((await fetch(base + '/api/v1/revised/detect', { method: 'POST', headers, body: '{broken' })).status, 400);
  assert.equal((await fetch(base + '/api/v1/revised/detect', { method: 'POST', headers: { ...headers, origin: 'https://evil.example' }, body: '{}' })).status, 403);
});

test('HTTPS tunnel sign-in uses the configured public origin even when the proxy changes Host', async t => {
  const publicOrigin = 'https://preview.trycloudflare.com';
  const gateway = createPreviewServer({ password: 'preview-password-for-test', publicOrigin });
  await new Promise(resolve => gateway.listen(0, '127.0.0.1', resolve));
  t.after(() => { gateway.closeAllConnections(); gateway.close(); });
  const base = `http://127.0.0.1:${gateway.address().port}`;
  const login = await fetch(base + '/preview-login', { method: 'POST', headers: { origin: publicOrigin }, body: 'password=preview-password-for-test', redirect: 'manual' });
  assert.equal(login.status, 303);
  assert.match(login.headers.get('set-cookie'), /; Secure$/);
  const wrongOrigin = await fetch(base + '/preview-login', { method: 'POST', headers: { origin: 'https://other.trycloudflare.com' }, body: 'password=preview-password-for-test', redirect: 'manual' });
  assert.equal(wrongOrigin.status, 403);
});
