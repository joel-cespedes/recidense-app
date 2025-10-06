import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonToolbar,
  NavController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-residents-task',
  templateUrl: './residents-task.html',
  styleUrls: ['./residents-task.scss'],
  imports: [IonHeader, IonToolbar, IonContent, IonButtons, IonButton]
})
export class ResidentsTask {
  private navCtrl = inject(NavController);

  navigateToManual() {
    this.navCtrl.navigateForward('/wrap/residents-tasks/manual');
  }

  navigateToVoice() {
    this.navCtrl.navigateForward('/wrap/residents-tasks/voice');
  }

  navigateToHistory() {
    this.navCtrl.navigateForward('/wrap/residents-tasks/history');
  }
}
