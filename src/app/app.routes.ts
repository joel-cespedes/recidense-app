import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { residenceGuard } from './guards/residence.guard';

export const routes: Routes = [
  {
    path: 'wrap',
    loadComponent: () => import('./wrap/wrap.component').then(m => m.WrapComponent),
    canActivate: [authGuard],
    canActivateChild: [residenceGuard],
    children: [
      {
        path: 'select-residences',
        loadComponent: () => import('./wrap/residences/residences').then(m => m.Residences),
        canActivate: []
      },
      {
        path: 'home',
        loadComponent: () => import('./wrap/home/home.page').then(m => m.HomePage)
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
    loadComponent: () => import('./login/login').then(m => m.Login)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
