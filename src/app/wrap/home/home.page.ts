import { Component, computed, inject } from '@angular/core';
import { NavController } from '@ionic/angular/standalone';
import { AuthStateService } from '../../services/auth-state.service';
import { ResidenceStateService } from '../../services/residence-state.service';

import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonToolbar
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonContent, IonButtons, IonButton, IonCard, IonContent]
})
export class HomePage {
  private navCtrl = inject(NavController);
  private authStateService = inject(AuthStateService);
  private residenceStateService = inject(ResidenceStateService);

  userName = computed(() => {
    const user = this.authStateService.user();
    return user?.name || user?.alias || 'Usuario';
  });

  residenceName = this.residenceStateService.residenceName;

  navigateToResidences(event: Event) {
    event.preventDefault();
    this.navCtrl.navigateForward('/wrap/home/select-residences', {
      animated: true
    });
  }

  navigateTo(event: Event, route: string) {
    event.preventDefault();
    this.navCtrl.navigateForward(`/wrap/${route}`, {
      animated: true
    });
  }
}
