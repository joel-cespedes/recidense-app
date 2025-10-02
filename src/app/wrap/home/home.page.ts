import { Component, inject, computed } from '@angular/core';
import { NavController } from '@ionic/angular/standalone';
import { AuthStateService } from '../../services/auth-state.service';
import { ResidenceStateService } from '../../services/residence-state.service';

import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonTab,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonModal,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonIcon,
    IonTab,
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonItem,
    IonLabel,
    IonList
  ]
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
    this.navCtrl.navigateForward('/wrap/select-residences', {
      animated: true
    });
  }
}
