import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { residenceGuard } from './guards/residence.guard';
import { loginGuard } from './guards/login.guard';
import { WrapComponent } from './wrap/wrap.component';

export const routes: Routes = [
  {
    path: 'wrap',
    component: WrapComponent,
    canActivate: [authGuard],
    canActivateChild: [residenceGuard],
    children: [
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
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wrap/residents-measure/residents-measure').then(m => m.ResidentsMeasure)
          },
          {
            path: 'chart/:id',
            loadComponent: () =>
              import(
                './wrap/residents-measure/residents-measure-detail/chart-measure/chart-measure'
              ).then(m => m.ChartMeasure)
          },
          {
            path: ':resident_id/:date',
            loadComponent: () =>
              import(
                './wrap/residents-measure/residents-measure-detail/residents-measure-detail'
              ).then(m => m.ResidentsDetail)
          }
        ]
      },
      {
        path: 'residents-tasks',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wrap/residents-task/residents-task').then(m => m.ResidentsTask)
          },
          {
            path: 'categories',
            loadComponent: () =>
              import('./wrap/residents-task/residents-categories/residents-categories').then(
                m => m.ResidentsCategories
              )
          },
          {
            path: 'manual',
            loadComponent: () =>
              import('./wrap/residents-task/residents-task-list/residents-task-list').then(
                m => m.ResidentsTaskList
              )
          },
          {
            path: 'manual/apply',
            loadComponent: () =>
              import('./wrap/residents-task/residents-task-apply/residents-task-apply').then(
                m => m.ResidentsTaskApply
              )
          },
          {
            path: 'voice',
            loadComponent: () =>
              import('./wrap/residents-task/residents-task-voice/residents-task-voice').then(
                m => m.ResidentsTaskVoice
              )
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./wrap/residents-task/residents-task-history/residents-task-history').then(
                m => m.ResidentsTaskHistory
              )
          },
          {
            path: 'history/detail',
            loadComponent: () =>
              import(
                './wrap/residents-task/residents-task-history/residents-task-history-detail/residents-task-history-detail'
              ).then(m => m.ResidentsTaskHistoryDetail)
          },
          {
            path: 'chronology/list',
            loadComponent: () =>
              import('./wrap/residents-task/residents-chronology-list/residents-chronology-list').then(
                m => m.ResidentsChronologyList
              )
          },
          {
            path: 'chronology',
            loadComponent: () =>
              import('./wrap/residents-task/residents-chronology/residents-chronology').then(
                m => m.ResidentsChronology
              )
          }
        ]
      },
      {
        path: 'devices',
        children: [
          {
            path: '',
            loadComponent: () => import('./wrap/devices/devices').then(m => m.Devices)
          },
          {
            path: 'bluetooth',
            loadComponent: () =>
              import('./wrap/devices/devices-bluetooth/devices-bluetooth').then(
                m => m.DevicesBluetooth
              )
          },
          {
            path: 'voice',
            loadComponent: () =>
              import('./wrap/devices/devices-voice/devices-voice').then(m => m.DevicesVoice)
          },
          {
            path: 'manual',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./wrap/devices/devices-manual/devices-manual-list/devices-manual-list').then(
                    m => m.DevicesManualList
                  )
              },
              {
                path: 'apply',
                loadComponent: () =>
                  import('./wrap/devices/devices-manual/devices-manual-apply/devices-manual-apply').then(
                    m => m.DevicesManualApply
                  )
              }
            ]
          },
          {
            path: 'list',
            loadComponent: () =>
              import('./wrap/devices/devices-list/devices-list').then(m => m.DevicesList)
          }
        ]
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
    loadComponent: () => import('./login/login').then(m => m.Login),
    canActivate: [loginGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
