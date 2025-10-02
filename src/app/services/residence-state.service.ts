import { Injectable, signal, computed } from '@angular/core';

interface Residence {
  id: number;
  name: string;
  address?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ResidenceStateService {
  private _selectedResidence = signal<Residence | null>(null);

  // Señales públicas de solo lectura
  selectedResidence = computed(() => this._selectedResidence());
  residenceName = computed(() => this._selectedResidence()?.name || '');
  residenceId = computed(() => this._selectedResidence()?.id || null);

  constructor() {
    this.loadSelectedResidence();
  }

  private loadSelectedResidence(): void {
    const stored = localStorage.getItem('selected_residence');
    if (stored) {
      try {
        const residence = JSON.parse(stored);
        this._selectedResidence.set(residence);
      } catch (error) {
        console.error('Error loading selected residence:', error);
        localStorage.removeItem('selected_residence');
      }
    }
  }

  selectResidence(residence: Residence): void {
    this._selectedResidence.set(residence);
    localStorage.setItem('selected_residence', JSON.stringify(residence));
  }

  clearResidence(): void {
    this._selectedResidence.set(null);
    localStorage.removeItem('selected_residence');
  }

  hasSelectedResidence(): boolean {
    return this._selectedResidence() !== null;
  }
}
