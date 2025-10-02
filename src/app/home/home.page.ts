import { Component } from '@angular/core';
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
  IonTab,
  IonTabBar,
  IonItem,
  IonLabel,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent,
  IonModal
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
  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 2000);
  }

  toToSelectResidences() {
    console.log('showModalResidents');
  }
}
