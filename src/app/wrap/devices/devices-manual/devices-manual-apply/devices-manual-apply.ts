import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonToolbar,
  NavController,
  ToastController
} from '@ionic/angular/standalone';

import { ResidentOut } from '../../../../../openapi/generated/models/resident-out';
import { MeasurementsService } from '../../../../../openapi/generated/services/measurements.service';
import { ResidenceStateService } from '../../../../services/residence-state.service';

@Component({
  selector: 'app-devices-manual-apply',
  templateUrl: './devices-manual-apply.html',
  styleUrls: ['./devices-manual-apply.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonInput,
    IonSpinner
  ]
})
export class DevicesManualApply implements OnInit {
  private navCtrl = inject(NavController);
  private router = inject(Router);
  private measurementsService = inject(MeasurementsService);
  private residenceStateService = inject(ResidenceStateService);
  private toastCtrl = inject(ToastController);

  resident = signal<ResidentOut | null>(null);
  selectedDevice = signal<string>('blood_pressure');
  isSubmitting = signal(false);

  residenceId = computed(() => this.residenceStateService.residenceId());

  // Forms para cada dispositivo
  bloodPressureForm = new FormGroup({
    systolic: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    diastolic: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    pulse: new FormControl<number | null>(null, [Validators.min(0)])
  });

  oximeterForm = new FormGroup({
    oxygen_saturation: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100)
    ]),
    pulse: new FormControl<number | null>(null, [Validators.min(0)])
  });

  scaleForm = new FormGroup({
    weight: new FormControl<number | null>(null, [Validators.required, Validators.min(0)])
  });

  thermometerForm = new FormGroup({
    temperature: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(30),
      Validators.max(45)
    ])
  });

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state || history.state;

    if (state?.['resident']) {
      this.resident.set(state['resident']);
    } else {
      this.goBack();
    }
  }

  onSegmentChange(event: any) {
    this.selectedDevice.set(event.detail.value);
  }

  getCurrentForm(): FormGroup {
    switch (this.selectedDevice()) {
      case 'blood_pressure':
        return this.bloodPressureForm;
      case 'oximeter':
        return this.oximeterForm;
      case 'scale':
        return this.scaleForm;
      case 'thermometer':
        return this.thermometerForm;
      default:
        return this.bloodPressureForm;
    }
  }

  submitMeasurement() {
    const form = this.getCurrentForm();

    if (form.invalid) {
      this.showErrorToast('Por favor completa todos los campos requeridos');
      return;
    }

    const resident = this.resident();
    const residenceId = this.residenceId();

    if (!resident || !residenceId) {
      this.showErrorToast('Datos incompletos');
      return;
    }

    this.isSubmitting.set(true);

    // Mapear tipo de dispositivo al formato del backend
    const measurementTypeMap: Record<string, string> = {
      blood_pressure: 'bp',
      oximeter: 'spo2',
      scale: 'weight',
      thermometer: 'temperature'
    };

    const measurementType = measurementTypeMap[this.selectedDevice()];
    const formValues = form.value;

    // Construir el body según el tipo
    const body: any = {
      resident_id: resident.id,
      type: measurementType,
      source: 'manual',
      taken_at: new Date().toISOString()
    };

    if (this.selectedDevice() === 'blood_pressure') {
      body.systolic = formValues.systolic;
      body.diastolic = formValues.diastolic;
      if (formValues.pulse) {
        body.pulse_bpm = formValues.pulse;
      }
    } else if (this.selectedDevice() === 'oximeter') {
      body.spo2 = formValues.oxygen_saturation;
      if (formValues.pulse) {
        body.pulse_bpm = formValues.pulse;
      }
    } else if (this.selectedDevice() === 'scale') {
      body.weight_kg = formValues.weight;
    } else if (this.selectedDevice() === 'thermometer') {
      body.temperature_c = formValues.temperature;
    }

    // Crear medición
    this.measurementsService
      .createMeasurementMeasurementsPost({
        residence_id: residenceId.toString(),
        body: body
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showSuccessToast('Medición registrada correctamente');
          setTimeout(() => {
            this.router.navigateByUrl('/wrap/devices');
          }, 2000);
        },
        error: (error: any) => {
          console.error('Error submitting measurement:', error);
          this.isSubmitting.set(false);
          this.showErrorToast(
            error.error?.message || 'Error al guardar la medición. Intenta de nuevo.'
          );
        }
      });
  }

  async showSuccessToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle'
    });
    await toast.present();
  }

  async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle'
    });
    await toast.present();
  }

  goBack() {
    this.navCtrl.back();
  }
}
