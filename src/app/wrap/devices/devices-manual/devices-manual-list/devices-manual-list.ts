import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonToolbar,
  NavController,
  RefresherCustomEvent
} from '@ionic/angular/standalone';

import { PaginatedResponseResidentOut } from '../../../../../openapi/generated/models/paginated-response-resident-out';
import { ResidentOut } from '../../../../../openapi/generated/models/resident-out';
import { ResidentsService } from '../../../../../openapi/generated/services/residents.service';
import { ResidenceStateService } from '../../../../services/residence-state.service';

@Component({
  selector: 'app-devices-manual-list',
  templateUrl: './devices-manual-list.html',
  styleUrls: ['./devices-manual-list.scss'],
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
    IonCard
  ]
})
export class DevicesManualList implements OnInit {
  private residentsService = inject(ResidentsService);
  private residenceStateService = inject(ResidenceStateService);
  private navCtrl = inject(NavController);

  // Signals
  residents = signal<ResidentOut[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  hasMore = signal(false);

  // Form controls
  searchControl = new FormControl('');

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
    this.loadResidents(true);
  }

  navigateToApply(event: Event, resident: ResidentOut) {
    event.preventDefault();
    event.stopPropagation();

    this.navCtrl.navigateForward(`/wrap/devices/manual/apply`, {
      animated: true,
      state: { resident }
    });
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

    this.residentsService
      .listResidentsResidentsGet({
        residence_id: residenceId.toString(),
        page: this.currentPage(),
        size: 20,
        search: this.searchControl.value || undefined
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
