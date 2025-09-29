import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './services/theme';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  themeService = inject(ThemeService); 

  isDark = this.themeService.theme; 
  constructor() {
    this.themeService.theme.set('light');
  }
}
