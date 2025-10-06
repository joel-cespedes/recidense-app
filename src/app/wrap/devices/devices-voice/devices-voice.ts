import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonContent,
  NavController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-devices-voice',
  templateUrl: './devices-voice.html',
  styleUrls: ['./devices-voice.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonButton, IonContent]
})
export class DevicesVoice {
  private navCtrl = inject(NavController);

  goBack() {
    this.navCtrl.back();
  }
}
