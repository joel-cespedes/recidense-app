import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController
} from '@ionic/angular/standalone';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { ResidenceStateService } from '../../services/residence-state.service';

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
    IonSearchbar,
    IonSpinner
  ]
})
export class Residences implements OnInit {
  private navCtrl = inject(NavController);
  private router = inject(Router);
  private residencesService = inject(ResidencesService);
  private residenceStateService = inject(ResidenceStateService);

  // Signals
  residences = signal<any[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadResidences();
  }

  loadResidences() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.residencesService.myResidencesResidencesMineGet().subscribe({
      next: data => {
        this.residences.set(data);
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error loading residences:', error);
        this.errorMessage.set('Error al cargar las residencias');
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    if (this.residenceStateService.hasSelectedResidence()) {
      this.navCtrl.back();
    }
  }

  selectResidence(residence: any) {
    // Actualizar estado reactivo de residencia
    this.residenceStateService.selectResidence(residence);

    // Navegar a home con animación de retroceso
    this.navCtrl.navigateBack(['/wrap/home']);
  }
}
