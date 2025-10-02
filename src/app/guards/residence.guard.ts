import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ResidenceStateService } from '../services/residence-state.service';

export const residenceGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const residenceStateService = inject(ResidenceStateService);

  // Si hay residencia seleccionada, permitir acceso
  if (residenceStateService.hasSelectedResidence()) {
    return true;
  }

  // Si no hay residencia, redirigir a select-residences
  router.navigate(['/wrap/select-residences']);
  return false;
};
