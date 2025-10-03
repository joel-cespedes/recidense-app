import { Component, input, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-residents-details',
  templateUrl: './residents-detail.html',
  styleUrls: ['./residents-detail.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton
  ]
})
export class ResidentsDetail {
  residentId!: string;
  private modalController = inject(ModalController);

  dismiss() {
    this.modalController.dismiss();
  }
}
