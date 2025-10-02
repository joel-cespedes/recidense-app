import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonViewWillEnter, IonViewDidEnter, IonViewWillLeave, IonViewDidLeave } from '@ionic/angular';
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
    IonList,
    RouterLink
  ]
})
export class HomePage implements IonViewWillEnter, IonViewDidEnter, IonViewWillLeave, IonViewDidLeave {
  isPageVisible: boolean = false;

  ionViewWillEnter() {
    console.log('ionViewWillEnter - La página está a punto de entrar');
  }

  ionViewDidEnter() {
    console.log('ionViewDidEnter - La página ha terminado de entrar');
    this.isPageVisible = true;
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave - La página está a punto de salir');
    this.isPageVisible = false;
  }

  ionViewDidLeave() {
    console.log('ionViewDidLeave - La página ha terminado de salir');
  }

  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 2000);
  }

  toToSelectResidences() {
    console.log('showModalResidents');
  }
}
