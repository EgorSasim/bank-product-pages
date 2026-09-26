import { isPlatformServer } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { Component, PLATFORM_ID, effect, inject, input } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { REQUEST } from '@angular/core';
import type { PageDocument } from '@bank/contract';
import { ApplicationFormBlock } from './blocks/application-form';
import { HeroBlock } from './blocks/hero';
import { KeyFactsBlock } from './blocks/key-facts';
import { ProductCardsBlock } from './blocks/product-cards';
import { RichTextBlock } from './blocks/rich-text';
import { StatsBlock } from './blocks/stats';

@Component({
  selector: 'app-page-view',
  imports: [HeroBlock, RichTextBlock, KeyFactsBlock, StatsBlock, ProductCardsBlock, ApplicationFormBlock],
  template: `
    @if (page(); as page) {
      <article>
        @for (block of page.blocks; track block.id) {
          @switch (block.type) {
            @case ('hero') {
              <app-hero [props]="block.props" />
            }
            @case ('richText') {
              <app-rich-text [props]="block.props" />
            }
            @case ('keyFacts') {
              <app-key-facts [props]="block.props" />
            }
            @case ('stats') {
              <app-stats [props]="block.props" />
            }
            @case ('productCards') {
              <app-product-cards [props]="block.props" />
            }
            @case ('applicationForm') {
              <app-application-form [block]="block" />
            }
            @default {}
          }
        }
      </article>
    } @else {
      <p class="missing">Страница не найдена.</p>
    }
  `,
})
export class PageView {
  readonly page = input.required<PageDocument | null>();

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      const page = this.page();
      if (!page) {
        this.title.setTitle('Страница не найдена');
        return;
      }
      this.title.setTitle(page.title);
      this.meta.updateTag({ name: 'description', content: page.description });
      const path = page.slug === 'home' ? '/' : `/products/${page.slug}`;
      this.setCanonical(path);
      this.setJsonLd(page);
    });
  }

  private setCanonical(path: string): void {
    const href = `${this.origin()}${path}`;
    let link = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setJsonLd(page: PageDocument): void {
    const payload = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.title,
      description: page.description,
    }).replace(/</g, '\\u003c');
    let script = this.document.getElementById('page-jsonld');
    if (!script) {
      script = this.document.createElement('script');
      script.id = 'page-jsonld';
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.textContent = payload;
  }

  private origin(): string {
    if (isPlatformServer(this.platformId) && this.request) {
      try {
        return new URL(this.request.url).origin;
      } catch {
        const host = this.request.headers.get('host');
        if (host) return `http://${host}`;
      }
    }
    return this.document.location?.origin ?? '';
  }
}
