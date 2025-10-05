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
  selector: 'app-residents-task-voice',
  templateUrl: './residents-task-voice.html',
  styleUrls: ['./residents-task-voice.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton]
})
export class ResidentsTaskVoice {
  private navCtrl = inject(NavController);

  goBack() {
    this.navCtrl.back();
  }
}
