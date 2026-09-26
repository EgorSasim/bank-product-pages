import type { Session } from '@bank/contract';

const sessionCookie = /(?:^|;\s*)session=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:;|$)/i;
const segmentCookie = /(?:^|;\s*)segment=(default|salary|premium)(?:;|$)/;

export function sessionFromCookie(cookieHeader: string | undefined): Session {
  const id = cookieHeader?.match(sessionCookie)?.[1];
  return id ? { state: 'authenticated', userId: id } : { state: 'anonymous' };
}

export function showAuthModal(session: { state: Session['state'] }, submitting: boolean): boolean {
  return submitting && session.state === 'anonymous';
}

export function segmentFromCookie(cookieHeader: string | undefined): 'salary' | 'premium' | undefined {
  const segment = cookieHeader?.match(segmentCookie)?.[1];
  return segment === 'salary' || segment === 'premium' ? segment : undefined;
}
