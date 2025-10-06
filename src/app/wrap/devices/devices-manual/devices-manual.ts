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
  selector: 'app-devices-manual',
  templateUrl: './devices-manual.html',
  styleUrls: ['./devices-manual.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonButton, IonContent]
})
export class DevicesManual {
  private navCtrl = inject(NavController);

  goBack() {
    this.navCtrl.back();
  }
}
