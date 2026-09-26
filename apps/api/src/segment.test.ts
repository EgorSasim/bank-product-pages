import assert from 'node:assert/strict';
import test from 'node:test';
import { readSegment } from './segment.js';

test('an unknown segment header falls back to default', () => {
  assert.equal(readSegment(undefined), 'default');
  assert.equal(readSegment('bot'), 'default');
  assert.equal(readSegment('salary'), 'salary');
  assert.equal(readSegment('premium'), 'premium');
});
