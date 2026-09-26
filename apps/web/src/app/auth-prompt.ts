import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthPrompt {
  readonly open = signal(false);
  private pending: ((signedIn: boolean) => void) | undefined;

  ask(): Promise<boolean> {
    this.open.set(true);
    return new Promise((resolve) => {
      this.pending = resolve;
    });
  }

  finish(signedIn: boolean): void {
    this.open.set(false);
    this.pending?.(signedIn);
    this.pending = undefined;
  }
}
