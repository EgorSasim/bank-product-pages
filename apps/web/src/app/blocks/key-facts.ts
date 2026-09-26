import { Component, input } from '@angular/core';

@Component({
  selector: 'app-key-facts',
  template: `
    <section class="facts">
      <h2>{{ props().title }}</h2>
      <dl>
        @for (item of props().items; track item.label) {
          <div>
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        }
      </dl>
    </section>
  `,
})
export class KeyFactsBlock {
  readonly props = input.required<{ title: string; items: { label: string; value: string }[] }>();
}
