import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withComponentInputBinding
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideApiConfiguration } from './openapi/api-config.provider';
import { pageTransition } from './app/helpers/page-transition';
import { authInterceptor } from './app/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideIonicAngular({
      mode: 'ios',
      animated: true,
      navAnimation: pageTransition
    }),
    provideApiConfiguration(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding())
  ]
});
