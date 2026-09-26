import { Component, input } from '@angular/core';

@Component({
  selector: 'app-rich-text',
  template: `
    <section class="prose">
      @for (paragraph of props().paragraphs; track paragraph) {
        <p>{{ paragraph }}</p>
      }
    </section>
  `,
})
export class RichTextBlock {
  readonly props = input.required<{ paragraphs: string[] }>();
}
