import { fail, isRecord, ok, readString, type ParseResult } from './result.js';

export const productCategories = ['card', 'loan', 'leasing', 'installment', 'deposit'] as const;

export type ProductCategory = (typeof productCategories)[number];

export type ProductTerms =
  | { category: 'card'; gracePeriod: string }
  | { category: 'loan'; rateFrom: string; amountTo: string }
  | { category: 'leasing'; downPayment: string }
  | { category: 'installment'; months: string }
  | { category: 'deposit'; rate: string };

export type ProductRecord = {
  slug: string;
  title: string;
  summary: string;
  category: ProductCategory;
  highlight: string;
  terms: ProductTerms;
};

export type ProductCard = {
  slug: string;
  title: string;
  summary: string;
  category: ProductCategory;
  highlight: string;
};

export function isProductCategory(value: unknown): value is ProductCategory {
  return typeof value === 'string' && productCategories.some((category) => category === value);
}

export function toProductCard(product: ProductRecord): ProductCard {
  return {
    slug: product.slug,
    title: product.title,
    summary: product.summary,
    category: product.category,
    highlight: product.highlight,
  };
}

export function parseProductRecord(input: unknown): ParseResult<ProductRecord> {
  if (!isRecord(input)) {
    return fail('product must be an object');
  }

  const slug = readString(input.slug, 'slug');
  const title = readString(input.title, 'title');
  const summary = readString(input.summary, 'summary');
  const highlight = readString(input.highlight, 'highlight');
  if (!slug.ok) return slug;
  if (!title.ok) return title;
  if (!summary.ok) return summary;
  if (!highlight.ok) return highlight;
  if (!isProductCategory(input.category)) {
    return fail('category must be a known product kind');
  }

  const terms = parseTerms(input.category, input.terms);
  if (!terms.ok) return terms;

  return ok({
    slug: slug.value,
    title: title.value,
    summary: summary.value,
    category: input.category,
    highlight: highlight.value,
    terms: terms.value,
  });
}

export function parseProductCard(input: unknown): ParseResult<ProductCard> {
  if (!isRecord(input)) {
    return fail('product card must be an object');
  }

  const slug = readString(input.slug, 'card.slug');
  const title = readString(input.title, 'card.title');
  const summary = readString(input.summary, 'card.summary');
  const highlight = readString(input.highlight, 'card.highlight');
  if (!slug.ok) return slug;
  if (!title.ok) return title;
  if (!summary.ok) return summary;
  if (!highlight.ok) return highlight;
  if (!isProductCategory(input.category)) {
    return fail('card.category must be a known product kind');
  }

  return ok({
    slug: slug.value,
    title: title.value,
    summary: summary.value,
    category: input.category,
    highlight: highlight.value,
  });
}

function parseTerms(category: ProductCategory, input: unknown): ParseResult<ProductTerms> {
  if (!isRecord(input)) {
    return fail('terms must be an object');
  }
  if (input.category !== category) {
    return fail('terms.category must match the product category');
  }

  switch (category) {
    case 'card': {
      const gracePeriod = readString(input.gracePeriod, 'terms.gracePeriod');
      return gracePeriod.ok ? ok({ category, gracePeriod: gracePeriod.value }) : gracePeriod;
    }
    case 'loan': {
      const rateFrom = readString(input.rateFrom, 'terms.rateFrom');
      const amountTo = readString(input.amountTo, 'terms.amountTo');
      if (!rateFrom.ok) return rateFrom;
      if (!amountTo.ok) return amountTo;
      return ok({ category, rateFrom: rateFrom.value, amountTo: amountTo.value });
    }
    case 'leasing': {
      const downPayment = readString(input.downPayment, 'terms.downPayment');
      return downPayment.ok ? ok({ category, downPayment: downPayment.value }) : downPayment;
    }
    case 'installment': {
      const months = readString(input.months, 'terms.months');
      return months.ok ? ok({ category, months: months.value }) : months;
    }
    case 'deposit': {
      const rate = readString(input.rate, 'terms.rate');
      return rate.ok ? ok({ category, rate: rate.value }) : rate;
    }
  }
}
