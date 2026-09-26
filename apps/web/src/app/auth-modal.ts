import { Component, inject } from '@angular/core';
import { AuthPrompt } from './auth-prompt';

@Component({
  selector: 'app-auth-modal',
  template: `
    <div class="modal-backdrop" (click)="auth.close()">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" (click)="$event.stopPropagation()">
        <h2 id="auth-title">Вход</h2>
        <p>Заявка не отправлена. Чтобы оформить продукт, войдите.</p>
        <label>
          Эл. почта
          <input type="email" name="email" autocomplete="username" />
        </label>
        <label>
          Пароль
          <input type="password" name="password" autocomplete="current-password" />
        </label>
        <div class="modal-actions">
          <button type="button" (click)="auth.close()">Закрыть</button>
        </div>
      </section>
    </div>
  `,
})
export class AuthModal {
  readonly auth = inject(AuthPrompt);
}
