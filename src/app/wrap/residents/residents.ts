import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  ViewChild
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
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
  styleUrls: ['./residents.scss', './flatpickr-custom.scss'],
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
export class Residents implements OnDestroy {
  private residentsService = inject(ResidentsService);
  private residenceStateService = inject(ResidenceStateService);

  @ViewChild('dateInput') dateInput!: ElementRef;
  private flatpickrInstance: any;

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
  dateRangeDisplay = signal<string>('');
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
    this.dateRangeDisplay.set('');
    if (this.flatpickrInstance) {
      this.flatpickrInstance.clear();
    }
    this.currentPage.set(1);
    this.loadResidents(true);
  }

  toggleSearch() {
    this.showSearch.update(value => !value);
  }

  openCalendarModal() {
    this.showCalendar.set(true);
    // Inicializar flatpickr cuando se abre el modal
    setTimeout(() => {
      if (this.dateInput) {
        const inputElement = this.dateInput.nativeElement;

        // Destruir instancia previa si existe
        if (this.flatpickrInstance) {
          this.flatpickrInstance.destroy();
          this.flatpickrInstance = null;
        }

        this.flatpickrInstance = flatpickr(inputElement, {
          mode: 'range',
          locale: Spanish,
          dateFormat: 'd/m/Y',
          clickOpens: true,
          allowInput: false,
          inline: false,
          appendTo: document.body,
          static: false,
          positionElement: inputElement,
          onClose: (selectedDates: Date[], dateStr: string) => {
            if (selectedDates.length > 0) {
              if (selectedDates.length === 1) {
                const date = selectedDates[0];
                const isoDate = date.toISOString().split('T')[0];
                this.dateFromControl.setValue(isoDate);
                this.dateToControl.setValue(isoDate);
                this.dateRangeDisplay.set(dateStr);
              } else if (selectedDates.length === 2) {
                this.dateFromControl.setValue(selectedDates[0].toISOString().split('T')[0]);
                this.dateToControl.setValue(selectedDates[1].toISOString().split('T')[0]);
                this.dateRangeDisplay.set(dateStr);
              }
            }
          }
        });
      }
    }, 300);
  }

  closeCalendarModal() {
    this.showCalendar.set(false);
  }

  ngOnDestroy() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }

  applyCalendar() {
    // Limpiar periodo seleccionado cuando se usa el calendario
    this.selectedPeriod.set(0);
    this.currentPage.set(1);
    this.loadResidents(true);
    this.closeCalendarModal();
  }

  clearCalendar() {
    this.dateFromControl.setValue(null);
    this.dateToControl.setValue(null);
    this.dateRangeDisplay.set('');
    if (this.flatpickrInstance) {
      this.flatpickrInstance.clear();
    }
    // Volver al periodo por defecto
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
