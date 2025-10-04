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
import { ResidentsService } from '../../../../openapi/generated/services/residents.service';
import { ResidentOut } from '../../../../openapi/generated/models/resident-out';
import { getMeasurementsByResidentMeasurementsResidentsResidentIdMeasurementsGet } from '../../../../openapi/generated/fn/measurements/get-measurements-by-resident-measurements-residents-resident-id-measurements-get';
import { PaginatedResponseMeasurementOut } from '../../../../openapi/generated/models/paginated-response-measurement-out';
import { MeasurementOut } from '../../../../openapi/generated/models/measurement-out';
import { HttpClient } from '@angular/common/http';
import { ApiConfiguration } from '../../../../openapi/generated/api-configuration';

@Component({
  selector: 'app-residents-details',
  templateUrl: './residents-task-apply.html',
  styleUrls: ['./residents-task-apply.scss'],
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
export class ResidentsTaskApply {
  id = input.required<string>();
  private navCtrl = inject(NavController);
  private residentsService = inject(ResidentsService);
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  resident = signal<ResidentOut | null>(null);
  measurements = signal<MeasurementOut[]>([]);
  isLoading = signal(true);
  isLoadingMeasurements = signal(true);
  errorMessage = signal<string | null>(null);
  measurementsError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const residentId = this.id();
      if (residentId) {
        this.loadMeasurements(residentId);
      }
    });
  }

  loadResident(id: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.residentsService.getResidentResidentsIdGet({ id }).subscribe({
      next: (resident: ResidentOut) => {
        this.resident.set(resident);
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error loading resident:', error);
        this.errorMessage.set('Error al cargar el residente');
        this.isLoading.set(false);
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
    }).subscribe({
      next: (response: any) => {
        const paginatedResponse = response.body as PaginatedResponseMeasurementOut;
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
