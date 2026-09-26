import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-banner-carousel',
  template: `
    <section class="banner-carousel" aria-roledescription="карусель" aria-label="Баннеры">
      <button type="button" (click)="step(-1)" aria-label="Предыдущий баннер">
        <span aria-hidden="true">‹</span>
      </button>
      <img [src]="slide().src" [alt]="slide().alt" />
      <button type="button" (click)="step(1)" aria-label="Следующий баннер">
        <span aria-hidden="true">›</span>
      </button>
    </section>
  `,
})
export class BannerCarouselBlock {
  readonly props = input.required<{ slides: { src: string; alt: string }[] }>();
  private readonly index = signal(0);
  readonly slide = computed(() => {
    const slides = this.props().slides;
    const index = modulo(this.index(), slides.length);
    return slides[index] ?? slides[0] ?? { src: '', alt: '' };
  });

  step(delta: number): void {
    this.index.update((current) => current + delta);
  }
}

function modulo(value: number, length: number): number {
  if (length === 0) return 0;
  return ((value % length) + length) % length;
}
