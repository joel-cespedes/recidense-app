import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonContent,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  NavController
} from '@ionic/angular/standalone';
import { TasksService } from '../../../../openapi/generated/services/tasks.service';
import { ResidenceStateService } from '../../../services/residence-state.service';
import { AuthStateService } from '../../../services/auth-state.service';
import { PaginatedResponseTaskCategoryOut } from '../../../../openapi/generated/models/paginated-response-task-category-out';
import { PaginatedResponseTaskTemplateOut } from '../../../../openapi/generated/models/paginated-response-task-template-out';
import { TaskCategoryOut } from '../../../../openapi/generated/models/task-category-out';
import { TaskTemplateOut } from '../../../../openapi/generated/models/task-template-out';
import { forkJoin } from 'rxjs';

interface CategoryWithTasks extends TaskCategoryOut {
  tasks: TaskTemplateOut[];
}

@Component({
  selector: 'app-residents-categories',
  templateUrl: './residents-categories.html',
  styleUrls: ['./residents-categories.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner
  ]
})
export class ResidentsCategories implements OnInit {
  private navCtrl = inject(NavController);
  private tasksService = inject(TasksService);
  private residenceStateService = inject(ResidenceStateService);
  private authStateService = inject(AuthStateService);

  categories = signal<CategoryWithTasks[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  residenceId = computed(() => this.residenceStateService.residenceId());

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    const residenceId = this.residenceId();
    if (!residenceId) {
      this.errorMessage.set('No hay residencia seleccionada');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.tasksService
      .listCategoriesTasksCategoriesGet({
        residence_id: residenceId.toString()
      })
      .subscribe({
        next: (response: PaginatedResponseTaskCategoryOut) => {
          const categoriesData = response.items;

          // Cargar tareas para cada categoría
          if (categoriesData.length === 0) {
            this.categories.set([]);
            this.isLoading.set(false);
            return;
          }

          const taskRequests = categoriesData.map(category =>
            this.tasksService.listTemplatesTasksTemplatesGet({
              residence_id: residenceId.toString(),
              category_id: category.id,
              size: 100
            })
          );

          forkJoin(taskRequests).subscribe({
            next: (tasksResponses: PaginatedResponseTaskTemplateOut[]) => {
              const categoriesWithTasks: CategoryWithTasks[] = categoriesData.map(
                (category, index) => ({
                  ...category,
                  tasks: tasksResponses[index].items
                })
              );
              this.categories.set(categoriesWithTasks);
              this.isLoading.set(false);
            },
            error: () => {
              // Aún mostrar categorías sin tareas
              const categoriesWithTasks: CategoryWithTasks[] = categoriesData.map(category => ({
                ...category,
                tasks: []
              }));
              this.categories.set(categoriesWithTasks);
              this.isLoading.set(false);
            }
          });
        },
        error: () => {
          this.errorMessage.set('Error al cargar las categorías');
          this.isLoading.set(false);
        }
      });
  }

  goBack() {
    this.navCtrl.back();
  }

  logout() {
    this.authStateService.logout();
  }
}
