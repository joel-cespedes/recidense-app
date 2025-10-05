import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { DatePipe } from '@angular/common';

import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonCard,
  IonCheckbox,
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
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
  RefresherCustomEvent
} from '@ionic/angular/standalone';

import { ResidentsService } from '../../../../openapi/generated/services/residents.service';
import { ResidenceStateService } from '../../../services/residence-state.service';
import { ResidentOut } from '../../../../openapi/generated/models/resident-out';
import { PaginatedResponseResidentOut } from '../../../../openapi/generated/models/paginated-response-resident-out';

@Component({
  selector: 'app-residents-task-list',
  templateUrl: './residents-task-list.html',
  styleUrls: ['./residents-task-list.scss'],
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
    IonCheckbox,
    DatePipe,
    IonSegment,
    IonSegmentButton
  ]
})
export class ResidentsTaskList implements OnInit {
  private residentsService = inject(ResidentsService);
  private residenceStateService = inject(ResidenceStateService);
  private navCtrl = inject(NavController);

  @ViewChild('datetime', { read: ElementRef }) datetimeRef!: ElementRef;

  // Signals
  residents = signal<ResidentOut[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  hasMore = signal(false);
  showCalendar = signal(false);
  showSearch = signal(false);
  selectedPeriod = signal<number>(1);

  // Selection mode signals
  selectionMode = signal<'single' | 'bulk'>('single');
  selectedResidents = signal<Set<string>>(new Set());
  selectAll = signal(false);

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
  }

  ngOnInit() {
    this.resetFilters();
    this.loadResidents(true);
  }

  onSegmentChange(event: any) {
    const value = event.detail.value;
    this.selectionMode.set(value === 'primary' ? 'single' : 'bulk');
    this.selectedResidents.set(new Set());
    this.selectAll.set(false);
  }

  toggleSelectAll() {
    this.selectAll.update(value => !value);

    if (this.selectAll()) {
      // Seleccionar todos los residentes (incluyendo los no mostrados por paginación)
      const allIds = this.residents().map(r => r.id);
      this.selectedResidents.set(new Set(allIds));
    } else {
      this.selectedResidents.set(new Set());
    }
  }

  toggleResidentSelection(residentId: string) {
    const selected = new Set(this.selectedResidents());

    if (selected.has(residentId)) {
      selected.delete(residentId);
    } else {
      selected.add(residentId);
    }

    this.selectedResidents.set(selected);

    // Actualizar selectAll si todos están seleccionados
    this.selectAll.set(selected.size === this.residents().length);
  }

  isResidentSelected(residentId: string): boolean {
    return this.selectedResidents().has(residentId);
  }

  navigateToResidentsDetails(event: Event, resident: ResidentOut) {
    event.preventDefault();
    event.stopPropagation();

    if (this.selectionMode() === 'bulk') {
      // En modo bloque, seleccionar/deseleccionar
      this.toggleResidentSelection(resident.id);
    } else {
      // En modo único, navegar
      this.navCtrl.navigateForward(`/wrap/residents-tasks/manual/apply`, {
        animated: true,
        state: { residentIds: [resident.id] }
      });
    }
  }

  navigateToApply() {
    const residentIds = Array.from(this.selectedResidents());
    this.navCtrl.navigateForward(`/wrap/residents-tasks/manual/apply`, {
      animated: true,
      state: { residentIds }
    });
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
            this.loadResidents(true);
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
        next: (response: PaginatedResponseResidentOut) => {
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
      setTimeout(() => {
        (ev as any).target.complete();
      }, 500);
    } else {
      (ev as any).target.complete();
    }
  }

  refresh(ev: any) {
    this.currentPage.set(1);
    this.loadResidents(true);
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 1000);
  }

  goBack() {
    this.navCtrl.back();
  }
}
