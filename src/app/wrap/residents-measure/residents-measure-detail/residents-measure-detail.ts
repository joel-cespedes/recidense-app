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
import { getMeasurementsByResidentMeasurementsResidentsResidentIdMeasurementsGet } from '../../../../openapi/generated/fn/measurements/get-measurements-by-resident-measurements-residents-resident-id-measurements-get';
import { PaginatedResponseMeasurementOut } from '../../../../openapi/generated/models/paginated-response-measurement-out';
import { MeasurementOut } from '../../../../openapi/generated/models/measurement-out';
import { HttpClient } from '@angular/common/http';
import { ApiConfiguration } from '../../../../openapi/generated/api-configuration';
import { map } from 'rxjs/operators';

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
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  measurements = signal<MeasurementOut[]>([]);
  isLoadingMeasurements = signal(true);
  measurementsError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const residentId = this.id();
      if (residentId) {
        this.loadMeasurements(residentId);
      }
    });
  }

  loadMeasurements(residentId: string) {
    this.isLoadingMeasurements.set(true);
    this.measurementsError.set(null);

    const rootUrl = this.config.rootUrl || '';

    getMeasurementsByResidentMeasurementsResidentsResidentIdMeasurementsGet(this.http, rootUrl, {
      resident_id: residentId,
      time_filter: '7d',
      page: 1,
      size: 20
    }).pipe(
      map(response => response.body as PaginatedResponseMeasurementOut)
    ).subscribe({
      next: (paginatedResponse) => {
        this.measurements.set(paginatedResponse.items);
        this.isLoadingMeasurements.set(false);
      },
      error: error => {
        console.error('Error loading measurements:', error);
        this.measurementsError.set('Error al cargar las mediciones');
        this.isLoadingMeasurements.set(false);
      }
    });
  }

  goBack() {
    this.navCtrl.back();
  }
}
