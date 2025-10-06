import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
export class DevicesManual implements OnInit {
  private navCtrl = inject(NavController);
  private router = inject(Router);

  ngOnInit() {
    // Redirigir automáticamente a la lista
    this.router.navigateByUrl('/wrap/devices/manual/list');
  }

  goBack() {
    this.navCtrl.back();
  }
}
