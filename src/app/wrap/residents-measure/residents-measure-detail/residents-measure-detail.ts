import { Component, inject, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSpinner,
  NavController
} from '@ionic/angular/standalone';
import { MeasurementsService } from '../../../../openapi/generated/services/measurements.service';
import { MeasurementOut } from '../../../../openapi/generated/models/measurement-out';

@Component({
  selector: 'app-residents-details',
  templateUrl: './residents-measure-detail.html',
  styleUrls: ['./residents-measure-detail.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonSpinner
  ]
})
export class ResidentsDetail {
  id = input.required<string>();
  private navCtrl = inject(NavController);
  private measurementsService = inject(MeasurementsService);

  measurement = signal<MeasurementOut | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const measurementId = this.id();
      if (measurementId) {
        this.loadMeasurement(measurementId);
      }
    });
  }

  loadMeasurement(measurementId: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.measurementsService.getMeasurementMeasurementsMeasurementIdGet({
      measurement_id: measurementId
    }).subscribe({
      next: (measurement: MeasurementOut) => {
        this.measurement.set(measurement);
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error loading measurement:', error);
        this.errorMessage.set('Error al cargar la medición');
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    this.navCtrl.back();
  }
}
