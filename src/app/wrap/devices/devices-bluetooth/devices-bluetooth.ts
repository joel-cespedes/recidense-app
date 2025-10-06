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
  selector: 'app-devices-bluetooth',
  templateUrl: './devices-bluetooth.html',
  styleUrls: ['./devices-bluetooth.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonButton, IonContent]
})
export class DevicesBluetooth {
  private navCtrl = inject(NavController);

  goBack() {
    this.navCtrl.back();
  }
}
