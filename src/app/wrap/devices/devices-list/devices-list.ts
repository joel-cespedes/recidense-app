import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonToolbar,
  NavController,
  RefresherCustomEvent
} from '@ionic/angular/standalone';

import { DeviceOut } from '../../../../openapi/generated/models/device-out';
import { PaginatedResponseDeviceOut } from '../../../../openapi/generated/models/paginated-response-device-out';
import { DevicesService } from '../../../../openapi/generated/services/devices.service';
import { ResidenceStateService } from '../../../services/residence-state.service';

@Component({
  selector: 'app-devices-list',
  templateUrl: './devices-list.html',
  styleUrls: ['./devices-list.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonButtons,
    IonButton,
    IonSpinner,
    IonCard,
    IonRefresher,
    IonRefresherContent
  ]
})
export class DevicesList implements OnInit {
  private devicesService = inject(DevicesService);
  private residenceStateService = inject(ResidenceStateService);
  private navCtrl = inject(NavController);

  // Signals
  devices = signal<DeviceOut[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Computed
  residenceId = computed(() => this.residenceStateService.residenceId());

  devicesWithLabels = computed(() => {
    const labels: Record<string, string> = {
      blood_pressure: 'Tensiómetro',
      pulse_oximeter: 'Oxímetro',
      scale: 'Báscula',
      thermometer: 'Termómetro'
    };

    const icons: Record<string, string> = {
      blood_pressure: 'favorite',
      pulse_oximeter: 'water',
      scale: 'scale',
      thermometer: 'thermometer'
    };

    return this.devices().map(device => ({
      ...device,
      typeLabel: labels[device.type] || device.type,
      typeIcon: icons[device.type] || 'hardware_chip'
    }));
  });

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    const residenceId = this.residenceId();
    if (!residenceId) {
      this.errorMessage.set('No hay residencia seleccionada');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.devicesService
      .listDevicesDevicesGet({
        residence_id: residenceId.toString()
      })
      .subscribe({
        next: (response: PaginatedResponseDeviceOut) => {
          this.devices.set(response.items);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Error al cargar dispositivos');
          this.isLoading.set(false);
        }
      });
  }

  refresh(ev: any) {
    this.loadDevices();
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 1000);
  }

  goBack() {
    this.navCtrl.back();
  }
}
