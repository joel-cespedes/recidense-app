import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'wrap',
    loadComponent: () => import('./wrap/wrap.component').then(m => m.WrapComponent)
  },

  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'select-residences',
    loadComponent: () => import('./residences/residences').then(m => m.Residences)
  },
  {
    path: 'message/:id',
    loadComponent: () => import('./view-message/view-message.page').then(m => m.ViewMessagePage)
  },
  {
    path: '',
    redirectTo: 'wrap',
    pathMatch: 'full'
  }
];
