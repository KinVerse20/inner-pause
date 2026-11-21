import test from 'node:test';
import assert from 'node:assert/strict';
import { localTestAllowed, sharedTestAllowed } from '../lib/auth/local-test.ts';

test('test sign-in requires explicit opt-in and both endpoints on loopback', () => {
  assert.equal(localTestAllowed('true', 'localhost', 'http://localhost:4011/api/v1'), true);
  assert.equal(localTestAllowed('true', '127.0.0.1', 'http://127.0.0.1:4011'), true);
  for (const [flag, host, api] of [
    [undefined, 'localhost', 'http://localhost:4011'],
    ['false', 'localhost', 'http://localhost:4011'],
    ['true', 'theinnerpause.com', 'http://localhost:4011'],
    ['true', 'localhost', 'https://api.theinnerpause.com'],
    ['true', 'localhost', 'https://localhost.attacker.example'],
    ['true', 'localhost', 'not a URL'],
    ['true', 'localhost', 'file://localhost/test'],
  ]) assert.equal(localTestAllowed(flag, host, api), false);
});

test('shared preview requires explicit opt-in and the protected same-origin API', () => {
  assert.equal(sharedTestAllowed('true', 'https://preview.trycloudflare.com', '/api/v1'), true);
  assert.equal(sharedTestAllowed('true', 'http://127.0.0.1:3012', '/api/v1'), true);
  assert.equal(sharedTestAllowed(undefined, 'https://preview.trycloudflare.com', '/api/v1'), false);
  assert.equal(sharedTestAllowed('true', 'http://example.com', '/api/v1'), false);
  assert.equal(sharedTestAllowed('true', 'https://preview.trycloudflare.com', 'http://localhost:4011/api/v1'), false);
  assert.equal(sharedTestAllowed('true', 'https://preview.trycloudflare.com', '//api.example.com'), false);
});
