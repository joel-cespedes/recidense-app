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
  IonRouterOutlet,
  IonTab,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent
} from '@ionic/angular/standalone';
import { ResidentsMeasure } from './residents-measure/residents-measure';
import { ResidentsTask } from './residents-task/residents-task';
import { ResidentsTaskApply } from './residents-task/residents-task-apply/residents-task-apply';
@Component({
  selector: 'app-wrap',
  templateUrl: './wrap.component.html',
  styleUrls: ['./wrap.component.scss'],
  imports: [
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
    ResidentsMeasure,
    ResidentsTask,
    ResidentsTaskApply
  ]
})
export class WrapComponent {
  currentTab = 'home';

  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }

  onTabChange(event: { tab: string }) {
    if (!event?.tab) {
      return;
    }

    this.currentTab = event.tab;
  }
}
