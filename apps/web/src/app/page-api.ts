import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, REQUEST } from '@angular/core';
import { blockTypes, readPageDocument, type BlockType, type PageDocument } from '@bank/contract';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { segmentFromCookie } from './session';

@Injectable({ providedIn: 'root' })
export class PageApi {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true });

  load(slug: string): Observable<PageDocument | null> {
    const headers: Record<string, string> = {};
    const segment = segmentFromCookie(this.cookieHeader());
    if (segment) headers['X-Segment'] = segment;

    return this.http.get<unknown>(`${this.origin()}/api/pages/${encodeURIComponent(slug)}`, { headers }).pipe(
      map((body) => {
        this.logSkippedBlocks(body);
        const parsed = readPageDocument(body);
        if (!parsed.ok) throw new Error('page did not match the block contract');
        return parsed.value;
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) return of(null);
        return throwError(() => error);
      }),
    );
  }

  private cookieHeader(): string | undefined {
    if (isPlatformBrowser(this.platformId)) return document.cookie;
    return this.request?.headers.get('cookie') ?? undefined;
  }

  private origin(): string {
    if (!isPlatformServer(this.platformId)) return '';
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
    return env?.['API_URL'] ?? 'http://127.0.0.1:3001';
  }

  private logSkippedBlocks(body: unknown): void {
    if (!isPlatformServer(this.platformId) || !isRecord(body) || !Array.isArray(body['blocks'])) return;
    for (const block of body['blocks']) {
      if (!isRecord(block) || typeof block['type'] !== 'string') continue;
      if (!blockTypes.includes(block['type'] as BlockType)) {
        console.error(`skipped unknown block type ${block['type']}`);
      }
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
