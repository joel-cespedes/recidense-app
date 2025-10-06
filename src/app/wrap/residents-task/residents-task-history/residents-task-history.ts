import { DatePipe } from '@angular/common';
import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonDatetime,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToolbar,
  NavController,
  RefresherCustomEvent
} from '@ionic/angular/standalone';
import { debounceTime } from 'rxjs';

import { PaginatedResponseTaskApplicationDailySummary } from '../../../../openapi/generated/models/paginated-response-task-application-daily-summary';
import { TaskApplicationDailySummary } from '../../../../openapi/generated/models/task-application-daily-summary';
import { UserAssigner } from '../../../../openapi/generated/models/user-assigner';
import { TasksService } from '../../../../openapi/generated/services/tasks.service';
import { ResidenceStateService } from '../../../services/residence-state.service';

@Component({
  selector: 'app-residents-task-history',
  templateUrl: './residents-task-history.html',
  styleUrls: ['./residents-task-history.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButtons,
    IonButton,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSpinner,
    IonCard,
    IonDatetime,
    IonModal,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSelect,
    IonSelectOption,
    DatePipe
  ]
})
export class ResidentsTaskHistory implements OnInit {
  private tasksService = inject(TasksService);
  private residenceStateService = inject(ResidenceStateService);
  private navCtrl = inject(NavController);

  @ViewChild('datetime', { read: ElementRef }) datetimeRef!: ElementRef;

  // Signals
  summaries = signal<TaskApplicationDailySummary[]>([]);
  assigners = signal<UserAssigner[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  hasMore = signal(false);
  showCalendar = signal(false);
  showSearch = signal(false);
  selectedPeriod = signal(1); // Por defecto día actual

  // Form controls
  searchControl = new FormControl('');
  dateFromControl = new FormControl<string | null>(null);
  dateToControl = new FormControl<string | null>(null);
  assignedByControl = new FormControl<string | null>(null);

  // Computed
  residenceId = computed(() => this.residenceStateService.residenceId());

  constructor() {
    // Search con debounce
    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(1);
      this.loadSummaries(true);
    });

    // Assigned by filter
    this.assignedByControl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadSummaries(true);
    });
  }

  ngOnInit() {
    this.resetFilters();
    this.setDefaultPeriod();
    this.loadAssigners();
    this.loadSummaries(true);
  }

  selectPeriod(days: number) {
    this.selectedPeriod.set(days);
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - days);

    this.dateFromControl.setValue(fromDate.toISOString().split('T')[0]);
    this.dateToControl.setValue(today.toISOString().split('T')[0]);

    this.currentPage.set(1);
    this.loadSummaries(true);
  }

  setDefaultPeriod() {
    this.selectPeriod(1);
  }

  loadAssigners() {
    const residenceId = this.residenceId();
    if (!residenceId) return;

    this.tasksService
      .getUserAssignersTasksUsersAssignersGet({ residence_id: residenceId.toString() })
      .subscribe({
        next: (users: UserAssigner[]) => {
          this.assigners.set(users);
        },
        error: (error: Error) => {
          console.error('Error loading assigners:', error);
        }
      });
  }

  goBack() {
    this.navCtrl.back();
  }

  toggleSearch() {
    this.showSearch.update(value => !value);
  }

  toggleCalendar() {
    this.showCalendar.set(true);
  }

  closeCalendarModal() {
    this.showCalendar.set(false);
  }

  clearCalendar() {
    this.selectedPeriod.set(0);
    this.dateFromControl.setValue(null);
    this.dateToControl.setValue(null);
    if (this.datetimeRef) {
      this.datetimeRef.nativeElement.value = undefined;
    }
    this.closeCalendarModal();
    this.currentPage.set(1);
    this.loadSummaries(true);
  }

  applyCalendar() {
    this.selectedPeriod.set(0); // Deseleccionar período cuando se usa calendario custom
    const datetime = this.datetimeRef?.nativeElement;
    if (datetime && datetime.value) {
      const dates = Array.isArray(datetime.value) ? datetime.value : [datetime.value];
      if (dates.length > 0) {
        this.dateFromControl.setValue(dates[0]);
        this.dateToControl.setValue(dates[dates.length - 1]);
      }
    }
    this.closeCalendarModal();
    this.currentPage.set(1);
    this.loadSummaries(true);
  }

  private resetFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.dateFromControl.setValue(null);
    this.dateToControl.setValue(null);
    this.assignedByControl.setValue(null);
    if (this.datetimeRef) {
      this.datetimeRef.nativeElement.value = undefined;
    }
  }

  loadSummaries(reset = false) {
    const residenceId = this.residenceId();
    if (!residenceId) {
      this.errorMessage.set('No hay residencia seleccionada');
      return;
    }

    if (reset) {
      this.currentPage.set(1);
      this.summaries.set([]);
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params: any = {
      residence_id: residenceId.toString(),
      page: this.currentPage(),
      size: 20
    };

    if (this.searchControl.value) {
      params.search = this.searchControl.value;
    }

    if (this.dateFromControl.value) {
      params.date_from = this.dateFromControl.value;
    }

    if (this.dateToControl.value) {
      params.date_to = this.dateToControl.value;
    }

    if (this.assignedByControl.value) {
      params.assigned_by_id = this.assignedByControl.value;
    }

    this.tasksService
      .getTaskApplicationsDailySummaryTasksApplicationsDailySummaryGet(params)
      .subscribe({
        next: (response: PaginatedResponseTaskApplicationDailySummary) => {
          if (reset) {
            this.summaries.set(response.items || []);
          } else {
            this.summaries.update(current => [...current, ...(response.items || [])]);
          }
          this.totalPages.set(response.pages || 1);
          this.hasMore.set(this.currentPage() < (response.pages || 1));
          this.isLoading.set(false);
        },
        error: (error: Error) => {
          console.error('Error loading summaries:', error);
          this.errorMessage.set('Error al cargar historial');
          this.isLoading.set(false);
        }
      });
  }

  onIonInfinite(event: any) {
    if (this.hasMore()) {
      this.currentPage.update(page => page + 1);
      this.loadSummaries(false);
    }
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  refresh(ev: any) {
    this.currentPage.set(1);
    this.loadSummaries(true);
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 1000);
  }

  navigateToDetail(summary: TaskApplicationDailySummary) {
    this.navCtrl.navigateForward('/wrap/residents-tasks/history/detail', {
      state: {
        residentId: summary.resident_id,
        date: summary.date,
        residentName: summary.resident_full_name,
        assignedById: this.assignedByControl.value // Pasar el filtro actual
      }
    });
  }
}
