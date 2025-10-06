import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonToolbar,
  NavController
} from '@ionic/angular/standalone';
import { AuthStateService } from '../../services/auth-state.service';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.html',
  styleUrls: ['./devices.scss'],
  imports: [IonHeader, IonToolbar, IonContent, IonButtons, IonButton]
})
export class Devices {
  private navCtrl = inject(NavController);
  private authStateService = inject(AuthStateService);

  navigateToBluetooth() {
    this.navCtrl.navigateForward('/wrap/devices/bluetooth');
  }

  navigateToVoice() {
    this.navCtrl.navigateForward('/wrap/devices/voice');
  }

  navigateToManual() {
    this.navCtrl.navigateForward('/wrap/devices/manual');
  }

  navigateToList() {
    this.navCtrl.navigateForward('/wrap/devices/list');
  }

  logout() {
    this.authStateService.logout();
  }
}
