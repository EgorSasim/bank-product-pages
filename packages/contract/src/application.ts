import type { FormField } from './page.js';
import { isRecord } from './result.js';

export type Session =
  | { state: 'anonymous' }
  | { state: 'authenticated'; userId: string };

export type FieldError = {
  name: string;
  message: string;
};

export type ApplicationRequest = {
  blockId: string;
  answers: Record<string, string | boolean>;
};

export type SubmitApplicationResult =
  | { status: 'authentication_required' }
  | { status: 'accepted'; submissionId: string }
  | { status: 'invalid'; fieldErrors: FieldError[] }
  | { status: 'rate_limited' };

export function canSubmit(session: Session): session is { state: 'authenticated'; userId: string } {
  return session.state === 'authenticated';
}

export function validateAnswers(
  fields: FormField[],
  answers: unknown,
): { ok: true; value: Record<string, string | boolean> } | { ok: false; fieldErrors: FieldError[] } {
  if (!isRecord(answers)) {
    return { ok: false, fieldErrors: [{ name: '_form', message: 'answers must be an object' }] };
  }

  const fieldErrors: FieldError[] = [];
  const value: Record<string, string | boolean> = {};

  for (const field of fields) {
    const raw = answers[field.name];
    if (raw === undefined || raw === '') {
      if (field.required) {
        fieldErrors.push({ name: field.name, message: 'required' });
      }
      continue;
    }

    if (field.kind === 'checkbox') {
      if (typeof raw !== 'boolean') {
        fieldErrors.push({ name: field.name, message: 'must be a boolean' });
        continue;
      }
      if (field.required && !raw) {
        fieldErrors.push({ name: field.name, message: 'required' });
        continue;
      }
      value[field.name] = raw;
      continue;
    }

    if (typeof raw !== 'string') {
      fieldErrors.push({ name: field.name, message: 'must be a string' });
      continue;
    }
    if (field.kind === 'select' && !field.options.includes(raw)) {
      fieldErrors.push({ name: field.name, message: 'must be one of the options' });
      continue;
    }
    value[field.name] = raw;
  }

  return fieldErrors.length > 0 ? { ok: false, fieldErrors } : { ok: true, value };
}
