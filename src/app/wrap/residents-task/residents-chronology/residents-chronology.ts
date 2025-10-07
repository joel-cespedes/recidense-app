import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

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

import { ResidentOut } from '../../../../openapi/generated/models/resident-out';
import { ResidentChronologyResponse } from '../../../../openapi/generated/models/resident-chronology-response';
import { MeasurementEvent } from '../../../../openapi/generated/models/measurement-event';
import { TaskEvent } from '../../../../openapi/generated/models/task-event';
import { BedChangeEvent } from '../../../../openapi/generated/models/bed-change-event';
import { StatusChangeEvent } from '../../../../openapi/generated/models/status-change-event';
import { ResidenceStateService } from '../../../services/residence-state.service';
import { environment } from '../../../../environments/environment';

type ChronologyEvent = MeasurementEvent | TaskEvent | BedChangeEvent | StatusChangeEvent;

interface EventDetail {
  label: string;
  value: string;
}

interface EventTitle {
  label: string;
  value: string;
}

@Component({
  selector: 'app-residents-chronology',
  templateUrl: './residents-chronology.html',
  styleUrls: ['./residents-chronology.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButtons,
    IonButton,
    IonSpinner,
    IonCard
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
  includeMeasurements = signal(false);
  includeTasks = signal(true);
  includeBedChanges = signal(false);
  includeStatusChanges = signal(false);

  // Computed events with metadata
  eventsWithMetadata = computed(() => {
    const events = this.chronologyData()?.events || [];
    return events.map(event => ({
      ...event,
      icon: this.calculateEventIcon(event),
      title: this.calculateEventTitle(event),
      timestamp: this.calculateTimestamp(event.timestamp),
      time: this.calculateTimeOnly(event.timestamp),
      date: this.calculateDateOnly(event.timestamp),
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
      next: response => {
        this.chronologyData.set(response);
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error loading chronology:', error);
        this.errorMessage.set('Error al cargar la cronología');
        this.isLoading.set(false);
      }
    });
  }

  private readonly filterToggles: Record<string, () => void> = {
    measurements: () => this.includeMeasurements.update(value => !value),
    tasks: () => this.includeTasks.update(value => !value),
    bed_changes: () => this.includeBedChanges.update(value => !value),
    status_changes: () => this.includeStatusChanges.update(value => !value)
  };

  toggleFilter(filterType: 'measurements' | 'tasks' | 'bed_changes' | 'status_changes') {
    const toggle = this.filterToggles[filterType];
    if (toggle) {
      toggle();
      this.loadChronology();
    }
  }

  refresh(ev: any) {
    this.loadChronology();
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 1000);
  }

  private readonly eventIcons: Record<string, string> = {
    measurement: 'medical_services',
    task: 'task_alt',
    bed_change: 'bed',
    status_change: 'sync_alt'
  };

  private readonly measurementTypeLabels: Record<string, string> = {
    blood_pressure: 'Tensiómetro',
    pulse_oximeter: 'Oxímetro',
    scale: 'Báscula',
    thermometer: 'Termómetro'
  };

  private readonly eventTitleGetters: Record<string, (event: any) => EventTitle> = {
    measurement: (event: MeasurementEvent) => {
      const typeLabel =
        this.measurementTypeLabels[event.measurement_type] || event.measurement_type;
      return { label: 'Medición', value: typeLabel };
    },
    task: (event: TaskEvent) => ({ label: 'Tarea', value: event.task_name }),
    bed_change: () => ({ label: 'Cambio de cama', value: '' }),
    status_change: (event: StatusChangeEvent) => ({
      label: 'Cambio de estado',
      value: event.new_status
    })
  };

  private readonly eventDetailsGetters: Record<string, (event: any) => EventDetail[]> = {
    measurement: (event: MeasurementEvent) => {
      const details: EventDetail[] = [];
      details.push({ label: 'Fuente', value: event.source });
      if (event.values) {
        Object.entries(event.values).forEach(([key, value]) => {
          details.push({ label: key, value: value as string });
        });
      }
      return details;
    },
    task: (event: TaskEvent) => {
      const details: EventDetail[] = [];
      details.push({ label: 'Categoría', value: event.task_category });
      if (event.status) {
        details.push({ label: 'Estado', value: event.status });
      }
      if (event.assigned_by_name) {
        details.push({ label: 'Asignada por', value: event.assigned_by_name });
      }
      return details;
    },
    bed_change: (event: BedChangeEvent) => {
      const details: EventDetail[] = [];
      details.push({ label: 'Tipo de cambio', value: event.change_type });
      if (event.previous_location) {
        details.push({ label: 'De', value: event.previous_location });
      }
      if (event.new_location) {
        details.push({ label: 'A', value: event.new_location });
      }
      return details;
    },
    status_change: (event: StatusChangeEvent) => {
      const details: EventDetail[] = [];
      if (event.previous_status) {
        details.push({ label: 'Estado anterior', value: event.previous_status });
      }
      details.push({ label: 'Nuevo estado', value: event.new_status });
      return details;
    }
  };

  private calculateEventIcon(event: ChronologyEvent): string {
    const eventType = (event as any).event_type;
    return this.eventIcons[eventType] || 'event';
  }

  private calculateEventTitle(event: ChronologyEvent): EventTitle {
    const eventType = (event as any).event_type;
    const getter = this.eventTitleGetters[eventType];
    return getter ? getter(event) : { label: 'Evento', value: '' };
  }

  private calculateEventDetails(event: ChronologyEvent): EventDetail[] {
    const eventType = (event as any).event_type;
    const getter = this.eventDetailsGetters[eventType];
    return getter ? getter(event) : [];
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

  private calculateTimeOnly(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private calculateDateOnly(timestamp: string): string {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  goBack() {
    this.navCtrl.back();
  }
}
