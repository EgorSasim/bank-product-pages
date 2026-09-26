import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, PLATFORM_ID, effect, inject, input, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { validateAnswers, type FormField, type SubmitApplicationResult } from '@bank/contract';
import { AuthPrompt } from '../auth-prompt';
import { sessionFromCookie, showAuthModal } from '../session';

type ApplicationBlock = {
  id: string;
  props: { title: string; fields: FormField[] };
};

@Component({
  selector: 'app-application-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="application" [formGroup]="form" (ngSubmit)="submit()">
      <h2>{{ block().props.title }}</h2>
      @for (field of block().props.fields; track field.name) {
        <label [attr.for]="field.name">
          <span>{{ field.label }}</span>
          @switch (field.kind) {
            @case ('text') {
              <input [id]="field.name" type="text" [formControlName]="field.name" />
            }
            @case ('select') {
              <select [id]="field.name" [formControlName]="field.name">
                <option value="">Выберите</option>
                @for (option of field.options; track option) {
                  <option [value]="option">{{ option }}</option>
                }
              </select>
            }
            @case ('checkbox') {
              <input [id]="field.name" type="checkbox" [formControlName]="field.name" />
            }
          }
        </label>
        @for (error of errorsFor(field.name); track error) {
          <p class="field-error">{{ error }}</p>
        }
      }
      @if (accepted()) {
        <p class="accepted">Заявка принята.</p>
      }
      <button type="submit">Оформить</button>
    </form>
  `,
})
export class ApplicationFormBlock {
  readonly block = input.required<ApplicationBlock>();
  readonly form = new FormGroup({});
  readonly accepted = signal(false);
  readonly fieldErrors = signal<{ name: string; message: string }[]>([]);

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthPrompt);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      const fields = this.block().props.fields;
      untracked(() => {
        for (const name of Object.keys(this.form.controls)) this.form.removeControl(name);
        for (const field of fields) {
          this.form.addControl(field.name, new FormControl(field.kind === 'checkbox' ? false : '', { nonNullable: true }));
        }
      });
    });
  }

  errorsFor(name: string): string[] {
    return this.fieldErrors()
      .filter((error) => error.name === name)
      .map((error) => (error.message === 'required' ? 'Заполните поле' : error.message));
  }

  submit(): void {
    this.accepted.set(false);
    const session = sessionFromCookie(isPlatformBrowser(this.platformId) ? document.cookie : undefined);
    if (showAuthModal(session, true)) {
      this.auth.ask();
      return;
    }

    const checked = validateAnswers(this.block().props.fields, this.form.getRawValue());
    if (!checked.ok) {
      this.fieldErrors.set(checked.fieldErrors);
      return;
    }

    this.fieldErrors.set([]);
    this.http
      .post<SubmitApplicationResult>('/api/applications', { blockId: this.block().id, answers: checked.value })
      .subscribe({
        next: (result) => {
          if (result.status === 'accepted') this.accepted.set(true);
          if (result.status === 'authentication_required') this.auth.ask();
          if (result.status === 'invalid') this.fieldErrors.set(result.fieldErrors);
        },
        error: () => this.fieldErrors.set([{ name: '_form', message: 'Не удалось отправить заявку' }]),
      });
  }
}
