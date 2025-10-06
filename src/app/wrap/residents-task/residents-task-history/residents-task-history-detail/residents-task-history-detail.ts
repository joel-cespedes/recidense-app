import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
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

import { TaskApplicationResidentDay } from '../../../../../openapi/generated/models/task-application-resident-day';
import { TasksService } from '../../../../../openapi/generated/services/tasks.service';
import { ResidenceStateService } from '../../../../services/residence-state.service';

@Component({
  selector: 'app-residents-task-history-detail',
  templateUrl: './residents-task-history-detail.html',
  styleUrls: ['./residents-task-history-detail.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonButtons,
    IonButton,
    IonCard,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    DatePipe
  ]
})
export class ResidentsTaskHistoryDetail implements OnInit {
  private tasksService = inject(TasksService);
  private residenceStateService = inject(ResidenceStateService);
  private navCtrl = inject(NavController);
  private router = inject(Router);

  // Signals
  residentId = signal<string>('');
  date = signal<string>('');
  residentName = signal<string>('');
  assignedById = signal<string | null>(null);
  detailData = signal<TaskApplicationResidentDay | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Computed
  residenceId = computed(() => this.residenceStateService.residenceId());
  applications = computed(() => this.detailData()?.applications || []);

  applicationsWithTime = computed(() => {
    const apps = this.detailData()?.applications || [];
    return apps.map(app => ({
      ...app,
      timeFormatted: new Date(app.assigned_at).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
  });

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.residentId) {
      this.residentId.set(state.residentId);
    }
    if (state?.date) {
      this.date.set(state.date);
    }
    if (state?.residentName) {
      this.residentName.set(state.residentName);
    }
    if (state?.assignedById) {
      this.assignedById.set(state.assignedById);
    }

    this.loadDetail();
  }

  loadDetail() {
    const residenceId = this.residenceId();
    const residentId = this.residentId();
    const date = this.date();

    if (!residenceId || !residentId || !date) {
      this.errorMessage.set('Faltan parámetros requeridos');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params: any = {
      resident_id: residentId,
      date: date,
      residence_id: residenceId.toString()
    };

    if (this.assignedById()) {
      params.assigned_by_id = this.assignedById();
    }

    this.tasksService
      .getTaskApplicationsByResidentDateTasksApplicationsResidentResidentIdDateDateGet(params)
      .subscribe({
        next: (response: TaskApplicationResidentDay) => {
          this.detailData.set(response);
          this.isLoading.set(false);
        },
        error: (error: Error) => {
          console.error('Error loading detail:', error);
          this.errorMessage.set('Error al cargar detalle');
          this.isLoading.set(false);
        }
      });
  }

  refresh(ev: any) {
    this.loadDetail();
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 1000);
  }

  goBack() {
    this.navCtrl.back();
  }

  getTimeFromDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}
