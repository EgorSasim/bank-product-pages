import { Component, input } from '@angular/core';

@Component({
  selector: 'app-hero',
  template: `
    <header class="hero">
      <h1>{{ props().title }}</h1>
      <p>{{ props().subtitle }}</p>
    </header>
  `,
})
export class HeroBlock {
  readonly props = input.required<{ title: string; subtitle: string }>();
}
