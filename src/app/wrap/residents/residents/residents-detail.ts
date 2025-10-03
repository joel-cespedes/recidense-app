import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, NavController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-residents-details',
  templateUrl: './residents-detail.html',
  styleUrls: ['./residents-detail.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton
  ]
})
export class ResidentsDetail implements OnInit {
  residentId: string = '';
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);

  ngOnInit() {
    this.residentId = this.route.snapshot.paramMap.get('id') || '';
  }

  goBack() {
    this.navCtrl.back();
  }
}
