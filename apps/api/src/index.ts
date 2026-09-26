import { canSubmit, readPageDocument, type PageDocument, type Session } from '@bank/contract';

export function openPage(input: unknown): PageDocument | undefined {
  const page = readPageDocument(input);
  return page.ok ? page.value : undefined;
}

export function submissionAllowed(session: Session): boolean {
  return canSubmit(session);
}
