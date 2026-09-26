import assert from 'node:assert/strict';
import test from 'node:test';
import { segmentFromCookie, sessionFromCookie, showAuthModal } from './session.ts';

const sessionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

test('an application click without a session opens the auth modal and does not pretend to be logged in', () => {
  const anonymous = sessionFromCookie(undefined);
  assert.equal(showAuthModal(anonymous, true), true);
  assert.equal(showAuthModal(anonymous, false), false);
  assert.equal(showAuthModal(sessionFromCookie(`theme=light; session=${sessionId}`), true), false);
  assert.equal(sessionFromCookie('session=not-a-uuid').state, 'anonymous');
});

test('only a known visitor segment is forwarded to the page API', () => {
  assert.equal(segmentFromCookie('segment=salary'), 'salary');
  assert.equal(segmentFromCookie('segment=premium'), 'premium');
  assert.equal(segmentFromCookie('segment=bot'), undefined);
  assert.equal(segmentFromCookie(undefined), undefined);
});
