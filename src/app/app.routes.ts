import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'wrap',
    loadComponent: () => import('./wrap/wrap.component').then(m => m.WrapComponent),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./wrap/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'select-residences',
        loadComponent: () => import('./wrap/residences/residences').then(m => m.Residences)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    redirectTo: 'wrap',
    pathMatch: 'full'
  }
];
