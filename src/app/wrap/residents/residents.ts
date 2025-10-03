import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  ViewChild
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent,
  IonCard
} from '@ionic/angular/standalone';

import { ResidentsService } from '../../../openapi/generated/services/residents.service';
import { ResidenceStateService } from '../../services/residence-state.service';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-residents',
  templateUrl: './residents.html',
  styleUrls: ['./residents.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonButtons,
    IonButton,
    IonSearchbar,
    IonSpinner,
    IonItem,
    IonLabel,
    IonAvatar,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonIcon,
    IonModal,
    IonCard,
    CommonModule,
    DatePipe
  ]
})
export class Residents {
  private residentsService = inject(ResidentsService);
  private residenceStateService = inject(ResidenceStateService);

  @ViewChild('datetime') datetime!: IonDatetime;

  isActive = input<boolean>(false);

  // Signals
  residents = signal<any[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  hasMore = signal(false);
  showCalendar = signal(false);
  showSearch = signal(false);
  selectedPeriod = signal<number>(7);

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
      this.loadResidents(true);
    });

    // Effect para cargar cuando el tab se activa
    effect(() => {
      if (this.isActive()) {
        this.loadResidents(true);
      }
    });
  }

  selectPeriod(days: number) {
    this.selectedPeriod.set(days);
    // Limpiar filtros de calendario
    this.dateFromControl.setValue(null);
    this.dateToControl.setValue(null);
    if (this.datetime) {
      this.datetime.value = undefined;
    }
    this.currentPage.set(1);
    this.loadResidents(true);
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
    if (this.datetime && this.datetime.value) {
      const dates = Array.isArray(this.datetime.value)
        ? this.datetime.value
        : [this.datetime.value];

      if (dates.length > 0) {
        this.dateFromControl.setValue(dates[0].split('T')[0]);
        this.dateToControl.setValue(dates[dates.length - 1].split('T')[0]);
        this.selectedPeriod.set(0);
        this.currentPage.set(1);
        this.loadResidents(true);
        this.closeCalendarModal();
      }
    }
  }

  clearCalendar() {
    this.dateFromControl.setValue(null);
    this.dateToControl.setValue(null);
    if (this.datetime) {
      this.datetime.value = undefined;
    }
    this.selectedPeriod.set(7);
    this.currentPage.set(1);
    this.loadResidents(true);
  }

  loadResidents(reset = false) {
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
      dateTo = this.dateToControl.value;
    } else if (this.selectedPeriod() > 0) {
      // Si no hay fechas del calendario, usar el periodo seleccionado
      const today = new Date();
      const fromDate = new Date(today.getTime() - this.selectedPeriod() * 24 * 60 * 60 * 1000);

      dateFrom = fromDate.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
    }

    this.residentsService
      .listResidentsResidentsGet({
        residence_id: residenceId.toString(),
        page: this.currentPage(),
        size: 20,
        search: this.searchControl.value || undefined,
        date_from: dateFrom,
        date_to: dateTo
      })
      .subscribe({
        next: response => {
          if (reset) {
            this.residents.set(response.items);
          } else {
            this.residents.update(current => [...current, ...response.items]);
          }
          this.totalPages.set(response.pages);
          this.hasMore.set(response.has_next);
          this.isLoading.set(false);
        },
        error: error => {
          console.error('Error loading residents:', error);
          this.errorMessage.set('Error al cargar residentes');
          this.isLoading.set(false);
        }
      });
  }

  onIonInfinite(ev: any) {
    if (this.hasMore()) {
      this.currentPage.update(page => page + 1);
      this.loadResidents();
    }
    setTimeout(() => {
      (ev as any).target.complete();
    }, 500);
  }

  refresh(ev: any) {
    this.currentPage.set(1);
    this.loadResidents(true);
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 1000);
  }
}
