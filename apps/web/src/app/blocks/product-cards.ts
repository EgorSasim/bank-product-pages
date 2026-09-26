import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ProductCard, ProductCategory } from '@bank/contract';

const categoryLabels: Record<ProductCategory, string> = {
  card: 'Карта',
  loan: 'Кредит',
  leasing: 'Лизинг',
  installment: 'Рассрочка',
  deposit: 'Вклад',
};

@Component({
  selector: 'app-product-cards',
  imports: [RouterLink],
  template: `
    <ul class="cards">
      @for (card of props().cards; track card.slug) {
        <li>
          <a [routerLink]="['/products', card.slug]">
            <span>{{ label(card.category) }}</span>
            <h2>{{ card.title }}</h2>
            <p>{{ card.summary }}</p>
            <strong>{{ card.highlight }}</strong>
          </a>
        </li>
      }
    </ul>
  `,
})
export class ProductCardsBlock {
  readonly props = input.required<{ cards: ProductCard[] }>();

  label(category: ProductCategory): string {
    return categoryLabels[category];
  }
}
