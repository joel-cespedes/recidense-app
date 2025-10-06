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

    // Si haces click en el tab que ya está activo, scroll to top
    if (this.currentTab === event.tab) {
      // Buscar el ion-content activo y hacer scroll to top
      const ionContent = document.querySelector('ion-content');
      if (ionContent) {
        ionContent.scrollToTop(300);
      }
    } else {
      // Si cambias de tab, ir a la raíz de ese tab
      const tabRoutes: { [key: string]: string } = {
        'home': '/wrap/home',
        'residents-measurements': '/wrap/residents-measurements',
        'residents-tasks': '/wrap/residents-tasks',
        'measures': '/wrap/measures'
      };

      const rootRoute = tabRoutes[event.tab];
      if (rootRoute) {
        this.router.navigate([rootRoute]);
      }
    }

    this.currentTab = event.tab;
  }
}
