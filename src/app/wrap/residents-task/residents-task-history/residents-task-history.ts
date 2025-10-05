import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  NavController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-residents-task-history',
  templateUrl: './residents-task-history.html',
  styleUrls: ['./residents-task-history.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton]
})
export class ResidentsTaskHistory {
  private navCtrl = inject(NavController);

  goBack() {
    this.navCtrl.back();
  }
}
