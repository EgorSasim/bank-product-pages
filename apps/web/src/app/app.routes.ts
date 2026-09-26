import { Routes } from '@angular/router';
import { PageView } from './page-view';
import { homePageResolver, productPageResolver } from './page.resolver';

export const routes: Routes = [
  { path: '', component: PageView, resolve: { page: homePageResolver } },
  { path: 'products/:slug', component: PageView, resolve: { page: productPageResolver } },
];
