import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, IonSpinner } from '@ionic/angular/standalone';
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
import { ResidencesService } from '../../../openapi/generated/services/residences.service';

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
    IonSearchbar,
    IonSpinner
  ]
})
export class Residences implements OnInit {
  private navCtrl = inject(NavController);
  private router = inject(Router);
  private residencesService = inject(ResidencesService);

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
      next: (data) => {
        this.residences.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading residences:', error);
        this.errorMessage.set('Error al cargar las residencias');
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    const selectedResidence = localStorage.getItem('selected_residence');
    if (selectedResidence) {
      this.navCtrl.back();
    }
  }

  selectResidence(residence: any) {
    // Guardar residencia en localStorage
    localStorage.setItem('selected_residence', JSON.stringify(residence));

    // Navegar a home
    this.router.navigate(['/wrap/home']);
  }
}
