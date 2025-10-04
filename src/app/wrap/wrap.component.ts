import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonRouterOutlet,
  IonTab,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent,
  NavController
} from '@ionic/angular/standalone';
import { ResidentsMeasure } from './residents-measure/residents-measure';
import { ResidenceStateService } from '../services/residence-state.service';

@Component({
  selector: 'app-wrap',
  templateUrl: './wrap.component.html',
  styleUrls: ['./wrap.component.scss'],
  imports: [
    CommonModule,
    IonRouterOutlet,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
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
    ResidentsMeasure
  ]
})
export class WrapComponent {
  private residenceStateService = inject(ResidenceStateService);
  private router = inject(Router);
  private navCtrl = inject(NavController);

  currentTab = 'home';

  hasResidence = computed(() => !!this.residenceStateService.residenceId());

  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }

  onTabWillChange(event: { tab: string }) {
    if (!event?.tab) {
      return;
    }

    const tab = event.tab;

    // Si no hay residencia y está intentando ir a otro tab que no sea home
    if (!this.hasResidence() && tab !== 'home') {
      // Redirigir a selección de residencia
      this.router.navigate(['/wrap/select-residences']);
      return;
    }
  }

  onTabChange(event: { tab: string }) {
    if (!event?.tab) {
      return;
    }

    this.currentTab = event.tab;
  }
}
