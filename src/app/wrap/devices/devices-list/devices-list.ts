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
        next: (response: any) => {
          const devicesData = response.items || response || [];
          this.devices.set(devicesData);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Error loading devices:', error);
          this.errorMessage.set('Error al cargar dispositivos');
          this.isLoading.set(false);
        }
      });
  }

  getDeviceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      bp: 'Tensiómetro',
      spo2: 'Oxímetro',
      weight: 'Báscula',
      temperature: 'Termómetro'
    };
    return labels[type] || type;
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
