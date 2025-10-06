import { Component, inject, OnInit, signal } from '@angular/core';
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
  IonToolbar,
  NavController
} from '@ionic/angular/standalone';

import { ResidentOut } from '../../../../../openapi/generated/models/resident-out';

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
    IonInput
  ]
})
export class DevicesManualApply implements OnInit {
  private navCtrl = inject(NavController);
  private router = inject(Router);

  resident = signal<ResidentOut | null>(null);
  selectedDevice = signal<string>('blood_pressure');

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
      console.log('Form invalid', form.errors);
      return;
    }

    const resident = this.resident();
    if (!resident) {
      return;
    }

    const deviceType = this.selectedDevice();
    const values = form.value;

    console.log('Submitting measurement:', {
      resident: resident.id,
      deviceType,
      values
    });

    // TODO: Aquí enviar al backend la medición manual
    // Por ahora solo mostramos en consola

    this.navCtrl.back();
  }

  goBack() {
    this.navCtrl.back();
  }
}
