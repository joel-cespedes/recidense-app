import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonButton,
  IonButtons,
  IonCard,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonToolbar,
  NavController,
  RefresherCustomEvent
} from '@ionic/angular/standalone';

import { ResidentOut } from '../../../../openapi/generated/models/resident-out';
import { ResidentChronologyResponse } from '../../../../openapi/generated/models/resident-chronology-response';
import { MeasurementEvent } from '../../../../openapi/generated/models/measurement-event';
import { TaskEvent } from '../../../../openapi/generated/models/task-event';
import { BedChangeEvent } from '../../../../openapi/generated/models/bed-change-event';
import { StatusChangeEvent } from '../../../../openapi/generated/models/status-change-event';
import { ResidenceStateService } from '../../../services/residence-state.service';
import { environment } from '../../../../environments/environment';

type ChronologyEvent = MeasurementEvent | TaskEvent | BedChangeEvent | StatusChangeEvent;

@Component({
  selector: 'app-residents-chronology',
  templateUrl: './residents-chronology.html',
  styleUrls: ['./residents-chronology.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButtons,
    IonButton,
    IonSpinner,
    IonCard,
    IonCheckbox,
    IonItem
  ]
})
export class ResidentsChronology implements OnInit {
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private http = inject(HttpClient);
  private residenceStateService = inject(ResidenceStateService);

  // Signals
  resident = signal<ResidentOut | null>(null);
  chronologyData = signal<ResidentChronologyResponse | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Filter signals
  includeMeasurements = signal(true);
  includeTasks = signal(true);
  includeBedChanges = signal(true);
  includeStatusChanges = signal(true);

  // Computed events with metadata
  eventsWithMetadata = computed(() => {
    const events = this.chronologyData()?.events || [];
    return events.map(event => ({
      ...event,
      icon: this.calculateEventIcon(event),
      title: this.calculateEventTitle(event),
      timestamp: this.calculateTimestamp(event.timestamp),
      details: this.calculateEventDetails(event)
    }));
  });

  ngOnInit() {
    // Get resident from router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state && state['resident']) {
      this.resident.set(state['resident']);
      this.loadChronology();
    } else {
      this.errorMessage.set('No se encontró información del residente');
    }
  }

  loadChronology() {
    const resident = this.resident();
    if (!resident) {
      this.errorMessage.set('No se encontró información del residente');
      return;
    }

    const residenceId = this.residenceStateService.residenceId();
    if (!residenceId) {
      this.errorMessage.set('No hay residencia seleccionada');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params = new URLSearchParams({
      include_measurements: this.includeMeasurements().toString(),
      include_tasks: this.includeTasks().toString(),
      include_bed_changes: this.includeBedChanges().toString(),
      include_status_changes: this.includeStatusChanges().toString(),
      limit: '10',
      residence_id: residenceId.toString()
    });

    const url = `${environment.apiUrl}/residents/${resident.id}/chronology?${params.toString()}`;

    this.http.get<ResidentChronologyResponse>(url).subscribe({
      next: (response) => {
        this.chronologyData.set(response);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading chronology:', error);
        this.errorMessage.set('Error al cargar la cronología');
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange() {
    this.loadChronology();
  }

  refresh(ev: any) {
    this.loadChronology();
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 1000);
  }

  private calculateEventIcon(event: ChronologyEvent): string {
    const eventType = (event as any).event_type;
    switch (eventType) {
      case 'measurement':
        return 'medical_services';
      case 'task':
        return 'task_alt';
      case 'bed_change':
        return 'bed';
      case 'status_change':
        return 'sync_alt';
      default:
        return 'event';
    }
  }

  private calculateEventTitle(event: ChronologyEvent): string {
    const eventType = (event as any).event_type;
    switch (eventType) {
      case 'measurement':
        const mEvent = event as MeasurementEvent;
        return `Medición: ${mEvent.measurement_type}`;
      case 'task':
        const tEvent = event as TaskEvent;
        return `Tarea: ${tEvent.task_name}`;
      case 'bed_change':
        return 'Cambio de cama';
      case 'status_change':
        const sEvent = event as StatusChangeEvent;
        return `Cambio de estado: ${sEvent.new_status}`;
      default:
        return 'Evento';
    }
  }

  private calculateEventDetails(event: ChronologyEvent): string[] {
    const eventType = (event as any).event_type;
    const details: string[] = [];

    switch (eventType) {
      case 'measurement':
        const mEvent = event as MeasurementEvent;
        if (mEvent.device_name) {
          details.push(`Dispositivo: ${mEvent.device_name}`);
        }
        details.push(`Fuente: ${mEvent.source}`);
        if (mEvent.values) {
          Object.entries(mEvent.values).forEach(([key, value]) => {
            details.push(`${key}: ${value}`);
          });
        }
        break;
      case 'task':
        const tEvent = event as TaskEvent;
        details.push(`Categoría: ${tEvent.task_category}`);
        if (tEvent.status) {
          details.push(`Estado: ${tEvent.status}`);
        }
        if (tEvent.assigned_by_name) {
          details.push(`Asignada por: ${tEvent.assigned_by_name}`);
        }
        break;
      case 'bed_change':
        const bEvent = event as BedChangeEvent;
        details.push(`Tipo de cambio: ${bEvent.change_type}`);
        if (bEvent.previous_location) {
          details.push(`De: ${bEvent.previous_location}`);
        }
        if (bEvent.new_location) {
          details.push(`A: ${bEvent.new_location}`);
        }
        break;
      case 'status_change':
        const sEvent = event as StatusChangeEvent;
        if (sEvent.previous_status) {
          details.push(`Estado anterior: ${sEvent.previous_status}`);
        }
        details.push(`Nuevo estado: ${sEvent.new_status}`);
        break;
    }

    if (event.recorded_by_name) {
      details.push(`Registrado por: ${event.recorded_by_name}`);
    }

    return details;
  }

  private calculateTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack() {
    this.navCtrl.back();
  }
}
