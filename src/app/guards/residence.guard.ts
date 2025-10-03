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

  // Si no hay residencia y está intentando acceder a select-residences, permitir
  if (state.url.includes('/select-residences')) {
    return true;
  }

  // Si no hay residencia y no está en select-residences, redirigir
  router.navigate(['/wrap/select-residences']);
  return false;
};
