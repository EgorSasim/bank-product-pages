import { readPageDocument, type PageDocument, type Session } from '@bank/contract';

export function showAuthModal(session: Session, submitting: boolean): boolean {
  return submitting && session.state === 'anonymous';
}

export function renderablePage(input: unknown): PageDocument | undefined {
  const page = readPageDocument(input);
  return page.ok ? page.value : undefined;
}
