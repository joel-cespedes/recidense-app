import { Component, OnInit, inject } from '@angular/core';
import { NavController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar
} from '@ionic/angular/standalone';

interface Residence {
  id: number;
  name: string;
  address: string;
  residents: number;
  status: 'active' | 'inactive';
  image: string;
}

@Component({
  selector: 'app-residences',
  templateUrl: './residences.html',
  styleUrls: ['./residences.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar
  ]
})
export class Residences implements OnInit {
  private navCtrl = inject(NavController);

  residences: Residence[] = [
    {
      id: 1,
      name: 'Residencia Los Pinos',
      address: 'Calle Mayor 123, Madrid',
      residents: 45,
      status: 'active',
      image: 'https://ionicframework.com/docs/img/demos/avatar.svg'
    },
    {
      id: 2,
      name: 'Residencia San José',
      address: 'Av. Libertad 456, Barcelona',
      residents: 32,
      status: 'active',
      image: 'https://ionicframework.com/docs/img/demos/avatar.svg'
    },
    {
      id: 3,
      name: 'Residencia El Roble',
      address: 'Plaza España 78, Valencia',
      residents: 28,
      status: 'active',
      image: 'https://ionicframework.com/docs/img/demos/avatar.svg'
    },
    {
      id: 4,
      name: 'Residencia Vista Alegre',
      address: 'Paseo del Prado 90, Sevilla',
      residents: 38,
      status: 'inactive',
      image: 'https://ionicframework.com/docs/img/demos/avatar.svg'
    },
    {
      id: 5,
      name: 'Residencia Santa Clara',
      address: 'Calle Sol 234, Bilbao',
      residents: 41,
      status: 'active',
      image: 'https://ionicframework.com/docs/img/demos/avatar.svg'
    }
  ];

  ngOnInit() {
    console.log('ResidencesComponent');
  }

  goBack() {
    this.navCtrl.back();
  }

  selectResidence(residence: Residence) {
    console.log('Selected residence:', residence);
  }
}
