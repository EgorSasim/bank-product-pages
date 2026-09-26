import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import type { PageDocument } from '@bank/contract';
import { PageApi } from './page-api';

export const homePageResolver: ResolveFn<PageDocument | null> = () => inject(PageApi).load('home');

export const productPageResolver: ResolveFn<PageDocument | null> = (route) => {
  const slug = route.paramMap.get('slug');
  return slug ? inject(PageApi).load(slug) : null;
};
