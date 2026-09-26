import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stats',
  template: `
    <section class="stats">
      @for (item of props().items; track item.label) {
        <article>
          <p>{{ item.value }}</p>
          <h2>{{ item.label }}</h2>
        </article>
      }
    </section>
  `,
})
export class StatsBlock {
  readonly props = input.required<{ items: { label: string; value: string }[] }>();
}
