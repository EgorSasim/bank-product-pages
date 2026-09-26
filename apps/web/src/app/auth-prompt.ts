import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthPrompt {
  readonly open = signal(false);

  ask(): void {
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }
}
