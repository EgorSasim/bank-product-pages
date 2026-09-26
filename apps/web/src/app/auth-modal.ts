import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import type { SignInResult } from '@bank/contract';
import { AuthPrompt } from './auth-prompt';

@Component({
  selector: 'app-auth-modal',
  template: `
    <div class="modal-backdrop" (click)="auth.finish(false)">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" (click)="$event.stopPropagation()">
        <h2 id="auth-title">Вход</h2>
        <p>Заявка пока не отправлена. Если почты ещё нет, учётная запись создастся при входе.</p>
        <label>
          Эл. почта
          <input #emailInput type="email" autocomplete="username" />
        </label>
        <label>
          Пароль
          <input #passwordInput type="password" autocomplete="current-password" />
        </label>
        @if (error()) {
          <p class="field-error">{{ error() }}</p>
        }
        <div class="modal-actions">
          <button type="button" class="secondary" (click)="auth.finish(false)">Закрыть</button>
          <button type="button" (click)="submit(emailInput.value, passwordInput.value)">Войти</button>
        </div>
      </section>
    </div>
  `,
})
export class AuthModal {
  readonly auth = inject(AuthPrompt);
  readonly error = signal('');
  private readonly http = inject(HttpClient);

  submit(email: string, password: string): void {
    this.error.set('');
    this.http.post<SignInResult>('/api/session', { email, password }).subscribe({
      next: () => this.auth.finish(true),
      error: (error: HttpErrorResponse) => {
        const body = error.error as SignInResult | undefined;
        if (body?.status === 'invalid') {
          this.error.set(body.fieldErrors.some((item) => item.message === 'wrong password') ? 'Неверная почта или пароль' : 'Укажите почту и пароль не короче 8 символов');
          return;
        }
        this.error.set('Не удалось войти');
      },
    });
  }
}
