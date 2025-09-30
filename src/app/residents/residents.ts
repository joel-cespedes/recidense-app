import { Component, inject, OnInit } from '@angular/core';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonButtons,
  IonButton,
  RefresherCustomEvent
} from '@ionic/angular/standalone';
import { DataService, Message } from '../services/data.service';
import { MessageComponent } from './message/message.component';

@Component({
  selector: 'app-residents',
  templateUrl: './residents.html',
  styleUrls: ['./residents.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonButtons,
    IonButton,
    MessageComponent
  ]
})
export class Residents implements OnInit {
  ngOnInit() {
    console.log('ResidentsComponent');
  }

  private data = inject(DataService);

  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 1000);
  }

  getMessages(): Message[] {
    return this.data.getMessages();
  }
}
