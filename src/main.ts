import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideApiConfiguration } from './openapi/api-config.provider';
import { pageTransition } from './app/helpers/page-transition';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'ios',
      animated: true,
      navAnimation: pageTransition
    }),
    provideApiConfiguration(),
    provideRouter(routes, withPreloading(PreloadAllModules))
  ]
});
