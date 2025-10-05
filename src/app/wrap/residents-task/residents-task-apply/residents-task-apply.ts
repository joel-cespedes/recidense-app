import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
  RefresherCustomEvent
} from '@ionic/angular/standalone';

import { TasksService } from '../../../../openapi/generated/services/tasks.service';
import { ResidenceStateService } from '../../../services/residence-state.service';
import { TaskTemplateOut } from '../../../../openapi/generated/models/task-template-out';
import { TaskCategoryOut } from '../../../../openapi/generated/models/task-category-out';

@Component({
  selector: 'app-residents-task-apply',
  templateUrl: './residents-task-apply.html',
  styleUrls: ['./residents-task-apply.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButtons,
    IonButton,
    IonSpinner,
    IonCard,
    IonSelect,
    IonSelectOption,
    IonCheckbox
  ]
})
export class ResidentsTaskApply implements OnInit {
  private tasksService = inject(TasksService);
  private residenceStateService = inject(ResidenceStateService);
  private navCtrl = inject(NavController);
  private router = inject(Router);

  // Signals
  taskTemplates = signal<TaskTemplateOut[]>([]);
  categories = signal<TaskCategoryOut[]>([]);
  selectedTasks = signal<Set<string>>(new Set());
  selectedStatus = signal<Record<string, string>>({});
  residentIds = signal<string[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  residenceId = computed(() => this.residenceStateService.residenceId());

  canApplyTasks = computed(() => {
    const tasks = Array.from(this.selectedTasks());
    return tasks.every(taskId => {
      const task = this.taskTemplates().find(t => t.id === taskId);
      if (!task) return false;

      // Si la tarea tiene statuses, debe tener un status seleccionado
      if (this.hasStatuses(task)) {
        return !!this.selectedStatus()[taskId];
      }

      // Si no tiene statuses, solo necesita estar seleccionada
      return true;
    });
  });

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.residentIds) {
      this.residentIds.set(state.residentIds);
    }

    this.loadCategories();
    this.loadTaskTemplates();
  }

  goBack() {
    this.navCtrl.back();
  }

  loadCategories() {
    this.tasksService.listCategoriesSimpleTasksCategoriesSimpleGet({}).subscribe({
      next: (categories: TaskCategoryOut[]) => {
        this.categories.set(categories);
      },
      error: error => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadTaskTemplates() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const residenceId = this.residenceId();
    if (!residenceId) {
      this.errorMessage.set('No hay residencia seleccionada');
      this.isLoading.set(false);
      return;
    }

    this.tasksService
      .listTemplatesTasksTemplatesGet({
        residence_id: residenceId.toString(),
        page: 1,
        size: 100
      })
      .subscribe({
        next: (response: any) => {
          const templates = response.items || [];
          this.taskTemplates.set(templates);
          this.isLoading.set(false);
        },
        error: error => {
          console.error('Error loading task templates:', error);
          this.errorMessage.set('Error al cargar tareas');
          this.isLoading.set(false);
        }
      });
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.name || '';
  }

  hasStatuses(task: TaskTemplateOut): boolean {
    return !!(task.status1 || task.status2 || task.status3 || task.status4 || task.status5 || task.status6);
  }

  isTaskSelected(taskId: string): boolean {
    return this.selectedTasks().has(taskId);
  }

  toggleTaskSelection(taskId: string) {
    const selected = new Set(this.selectedTasks());
    const status = { ...this.selectedStatus() };

    if (selected.has(taskId)) {
      selected.delete(taskId);
      delete status[taskId];
    } else {
      selected.add(taskId);
      // Para tareas sin status, usar un valor vacío
      status[taskId] = '';
    }

    this.selectedTasks.set(selected);
    this.selectedStatus.set(status);
  }

  onStatusChange(taskId: string, event: any) {
    const statusValue = event.detail.value;
    const status = { ...this.selectedStatus() };
    const selected = new Set(this.selectedTasks());

    if (!statusValue || statusValue === '') {
      // Si deselecciona (vuelve a "Seleccione un estado"), quitar de seleccionados
      delete status[taskId];
      selected.delete(taskId);
    } else {
      // Si selecciona un status, agregar a seleccionados
      status[taskId] = statusValue;
      selected.add(taskId);
    }

    this.selectedStatus.set(status);
    this.selectedTasks.set(selected);
  }

  applyTasks() {
    const residenceId = this.residenceId();
    if (!residenceId) {
      return;
    }

    const taskTemplateIds = Array.from(this.selectedTasks());
    const residentIds = this.residentIds();

    if (taskTemplateIds.length === 0 || residentIds.length === 0) {
      return;
    }

    this.isLoading.set(true);

    // Crear mapeo de task_template_id → status_text (solo para tareas con status)
    const taskStatuses: { [key: string]: string } = {};
    taskTemplateIds.forEach(taskId => {
      const task = this.taskTemplates().find(t => t.id === taskId);
      if (task && this.hasStatuses(task)) {
        const statusText = this.selectedStatus()[taskId];
        if (statusText) {
          taskStatuses[taskId] = statusText;
        }
      }
    });

    // Crear body solo con campos necesarios
    const body: any = {
      residence_id: residenceId.toString(),
      resident_ids: residentIds,
      task_template_ids: taskTemplateIds
    };

    // Solo agregar task_statuses si hay alguno
    if (Object.keys(taskStatuses).length > 0) {
      body.task_statuses = taskStatuses;
    }

    // Llamada al endpoint batch
    this.tasksService
      .createTaskApplicationsBatchTasksApplicationsBatchPost({
        body
      })
      .subscribe({
        next: response => {
          this.isLoading.set(false);
          console.log(`Se crearon ${response.created_count} aplicaciones`);
          this.navCtrl.back();
        },
        error: error => {
          console.error('Error applying tasks:', error);
          this.errorMessage.set('Error al aplicar tareas');
          this.isLoading.set(false);
        }
      });
  }

  refresh(ev: any) {
    this.loadTaskTemplates();
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 1000);
  }
}
