import assert from 'node:assert/strict';
import test from 'node:test';
import { RateLimiter } from './rate-limit.js';

test('the application limit counts one address inside the window', () => {
  let time = 1_000;
  const limiter = new RateLimiter(2, 60_000, () => time);

  assert.equal(limiter.allow('10.0.0.1'), true);
  assert.equal(limiter.allow('10.0.0.1'), true);
  assert.equal(limiter.allow('10.0.0.1'), false);
  assert.equal(limiter.allow('10.0.0.2'), true);

  time += 60_000;
  assert.equal(limiter.allow('10.0.0.1'), true);
});
