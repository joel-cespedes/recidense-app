import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { residenceGuard } from './guards/residence.guard';
import { WrapComponent } from './wrap/wrap.component';

export const routes: Routes = [
  {
    path: 'wrap',
    component: WrapComponent,
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
        path: 'home/select-residences',
        loadComponent: () => import('./wrap/residences/residences').then(m => m.Residences),
        canActivate: []
      },
      {
        path: 'residents',
        loadComponent: () => import('./wrap/residents/residents').then(m => m.Residents)
      },
      {
        path: 'residents/residents-details/:id',
        loadComponent: () =>
          import('./wrap/residents/residents/residents-detail').then(m => m.ResidentsDetail)
      },
      {
        path: '',
        redirectTo: '/wrap/home',
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
