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
        path: 'residents-measurements',
        loadComponent: () =>
          import('./wrap/residents-measure/residents-measure').then(m => m.ResidentsMeasure)
      },
      {
        path: 'residents/residents-measures/:id',
        loadComponent: () =>
          import('./wrap/residents-measure/residents-measure-detail/residents-measure-detail').then(
            m => m.ResidentsDetail
          )
      },
      {
        path: 'residents-tasks',
        loadComponent: () =>
          import('./wrap/residents-task/residents-task').then(m => m.ResidentsTask)
      },
      {
        path: 'residents/residents-tasks/:id',
        loadComponent: () =>
          import('./wrap/residents-task/residents-task-apply/residents-task-apply').then(
            m => m.ResidentsTaskApply
          )
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
