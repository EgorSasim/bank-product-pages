export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function ok<T>(value: T): ParseResult<T> {
  return { ok: true, value };
}

export function fail(error: string): ParseResult<never> {
  return { ok: false, error };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(value: unknown, field: string): ParseResult<string> {
  if (typeof value !== 'string' || value.trim() === '') {
    return fail(`${field} must be a non-empty string`);
  }
  return ok(value);
}
