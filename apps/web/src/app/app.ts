import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthModal } from './auth-modal';
import { AuthPrompt } from './auth-prompt';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, AuthModal],
  templateUrl: './app.html',
})
export class App {
  readonly auth = inject(AuthPrompt);
}
