import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonDatetime,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLabel,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonToolbar,
  NavController,
  RefresherCustomEvent
} from '@ionic/angular/standalone';

import { CommonModule, DatePipe } from '@angular/common';
import { MeasurementDailySummary } from '../../../openapi/generated/models/measurement-daily-summary';
import { PaginatedResponseMeasurementDailySummary } from '../../../openapi/generated/models/paginated-response-measurement-daily-summary';
import { MeasurementsService } from '../../../openapi/generated/services/measurements.service';
import { AuthStateService } from '../../services/auth-state.service';
import { ResidenceStateService } from '../../services/residence-state.service';

@Component({
  selector: 'app-residents-measure',
  templateUrl: './residents-measure.html',
  styleUrls: ['./residents-measure.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButtons,
    IonButton,
    IonSearchbar,
    IonSpinner,
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonDatetime,
    IonModal,
    IonCard,
    CommonModule,
    DatePipe
  ]
})
export class ResidentsMeasure implements OnInit {
  private measurementsService = inject(MeasurementsService);
  private residenceStateService = inject(ResidenceStateService);
  private authStateService = inject(AuthStateService);
  private navCtrl = inject(NavController);

  @ViewChild('datetime', { read: ElementRef }) datetimeRef!: ElementRef;

  // Signals
  dailySummaries = signal<MeasurementDailySummary[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  hasMore = signal(false);
  showCalendar = signal(false);
  showSearch = signal(false);
  selectedPeriod = signal<number>(1);

  // Form controls
  searchControl = new FormControl('');
  dateFromControl = new FormControl<string | null>(null);
  dateToControl = new FormControl<string | null>(null);

  // Computed residence ID
  residenceId = computed(() => this.residenceStateService.residenceId());

  constructor() {
    // Search con debounce
    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(1);
      this.loadMeasurements(true);
    });
  }

  ngOnInit() {
    this.resetFilters();
    this.loadMeasurements(true);
  }

  navigateToMeasurementDetails(event: Event, summary: MeasurementDailySummary) {
    event.preventDefault();
    event.stopPropagation();

    this.navCtrl.navigateForward(
      `/wrap/residents-measurements/${summary.resident_id}/${summary.date}`,
      {
        animated: true
      }
    );
  }

  private resetFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.dateFromControl.setValue(null);
    this.dateToControl.setValue(null);
    if (this.datetimeRef) {
      this.datetimeRef.nativeElement.value = undefined;
    }
    this.selectedPeriod.set(1);
    this.currentPage.set(1);
    this.showSearch.set(false);
    this.showCalendar.set(false);
  }

  selectPeriod(days: number) {
    this.selectedPeriod.set(days);
    // Limpiar filtros de calendario
    this.dateFromControl.setValue(null);
    this.dateToControl.setValue(null);
    if (this.datetimeRef) {
      this.datetimeRef.nativeElement.value = undefined;
    }
    this.currentPage.set(1);
    this.loadMeasurements(true);
  }

  toggleSearch() {
    this.showSearch.update(value => !value);
  }

  openCalendarModal() {
    this.showCalendar.set(true);
  }

  closeCalendarModal() {
    this.showCalendar.set(false);
  }

  applyCalendar() {
    if (this.datetimeRef) {
      const datetimeEl = this.datetimeRef.nativeElement;
      const value = datetimeEl.value;

      if (value) {
        const dates = Array.isArray(value) ? value : [value];

        if (dates.length > 0) {
          const sortedDates = dates.map(d => d.split('T')[0]).sort();
          this.dateFromControl.setValue(sortedDates[0]);
          this.dateToControl.setValue(sortedDates[sortedDates.length - 1]);
          this.selectedPeriod.set(0);
          this.currentPage.set(1);
          this.closeCalendarModal();
          setTimeout(() => {
            this.loadMeasurements(true);
          }, 0);
        }
      }
    }
  }

  clearCalendar() {
    this.dateFromControl.setValue(null);
    this.dateToControl.setValue(null);
    if (this.datetimeRef) {
      this.datetimeRef.nativeElement.value = undefined;
    }
    this.selectedPeriod.set(1);
    this.currentPage.set(1);
    this.loadMeasurements(true);
  }

  loadMeasurements(reset = false) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const residenceId = this.residenceId();
    if (!residenceId) {
      this.errorMessage.set('No hay residencia seleccionada');
      this.isLoading.set(false);
      return;
    }

    // Calcular date_from y date_to según el filtro activo
    let dateFrom: string | undefined;
    let dateTo: string | undefined;

    // Verificar si hay fechas del calendario seleccionadas
    if (this.dateFromControl.value && this.dateToControl.value) {
      // Usar las fechas del calendario
      dateFrom = this.dateFromControl.value;
      // Sumar 1 día a date_to para incluir el día completo
      const toDate = new Date(this.dateToControl.value);
      toDate.setDate(toDate.getDate() + 1);
      dateTo = toDate.toISOString().split('T')[0];
    } else if (this.selectedPeriod() > 0) {
      // Si no hay fechas del calendario, usar el periodo seleccionado
      const today = new Date();
      const fromDate = new Date(today.getTime() - this.selectedPeriod() * 24 * 60 * 60 * 1000);

      dateFrom = fromDate.toISOString().split('T')[0];
      // Sumar 1 día a date_to para incluir hoy completo
      const toDate = new Date(today);
      toDate.setDate(toDate.getDate() + 1);
      dateTo = toDate.toISOString().split('T')[0];
    }

    this.measurementsService
      .getDailySummaryMeasurementsDailySummaryGet({
        residence_id: residenceId.toString(),
        page: this.currentPage(),
        size: 20,
        search: this.searchControl.value || undefined,
        date_from: dateFrom,
        date_to: dateTo
      })
      .subscribe({
        next: (response: PaginatedResponseMeasurementDailySummary) => {
          if (reset) {
            this.dailySummaries.set(response.items);
          } else {
            this.dailySummaries.update(current => [...current, ...response.items]);
          }
          this.totalPages.set(response.pages);
          this.hasMore.set(response.has_next);
          this.isLoading.set(false);
        },
        error: (error: Error) => {
          console.error('Error loading measurements:', error);
          this.errorMessage.set('Error al cargar mediciones');
          this.isLoading.set(false);
        }
      });
  }

  onIonInfinite(ev: Event) {
    if (this.hasMore()) {
      this.currentPage.update(page => page + 1);
      this.loadMeasurements();
      setTimeout(() => {
        (ev.target as HTMLIonInfiniteScrollElement).complete();
      }, 500);
    } else {
      (ev.target as HTMLIonInfiniteScrollElement).complete();
    }
  }

  refresh(ev: Event) {
    this.currentPage.set(1);
    this.loadMeasurements(true);
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 1000);
  }

  logout() {
    this.authStateService.logout();
  }
}
